const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Load avatar data
const avatarFile = "albumAvatars.json";
function loadAvatars() {
  if (!fs.existsSync(avatarFile)) return {};
  return JSON.parse(fs.readFileSync(avatarFile));
}
function saveAvatars(avatars) {
  fs.writeFileSync(avatarFile, JSON.stringify(avatars, null, 2));
}

// Storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const albumName = req.params.albumName;
    const albumPath = path.join("public/uploads", albumName);
    cb(null, albumPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Trang mặc định
app.get("/", (req, res) => {
  const albums = fs
    .readdirSync("public/uploads")
    .filter((f) => fs.lstatSync(`public/uploads/${f}`).isDirectory());
  const avatars = loadAvatars();
  res.render("index", { albums, avatars, error: null });
});
// Trang danh sách album
app.get("/home", (req, res) => {
  const albums = fs
    .readdirSync("public/uploads")
    .filter((f) => fs.lstatSync(`public/uploads/${f}`).isDirectory());
  const avatars = loadAvatars();
  res.render("home", { albums, avatars, error: null });
});
// Tạo album
app.post("/create-album", (req, res) => {
  const albumName = req.body.albumName.trim();
  const albumPath = path.join("public/uploads", albumName);

  const albums = fs
    .readdirSync("public/uploads")
    .filter((f) => fs.lstatSync(`public/uploads/${f}`).isDirectory());
  const avatars = loadAvatars();

  if (fs.existsSync(albumPath)) {
    return res.render("index", {
      albums,
      avatars,
      error: "Tên album đã tồn tại!",
    });
  }
  fs.mkdirSync(albumPath);
  res.redirect("/home");
});

// Sửa tên album
app.post("/rename-album/:oldName", (req, res) => {
  const oldName = req.params.oldName;
  const newName = req.body.newName.trim();
  const oldPath = path.join("public/uploads", oldName);
  const newPath = path.join("public/uploads", newName);

  const albums = fs
    .readdirSync("public/uploads")
    .filter((f) => fs.lstatSync(`public/uploads/${f}`).isDirectory());
  const avatars = loadAvatars();

  if (fs.existsSync(newPath)) {
    return res.render("index", {
      albums,
      avatars,
      error: "Tên album đã tồn tại!",
    });
  }
  fs.renameSync(oldPath, newPath);

  let avatarData = loadAvatars();
  if (avatarData[oldName]) {
    avatarData[newName] = avatarData[oldName];
    delete avatarData[oldName];
    saveAvatars(avatarData);
  }
  res.redirect("/home");
});

// Xóa album
app.post("/delete-album/:albumName", (req, res) => {
  const albumName = req.params.albumName;
  const albumPath = path.join("public/uploads", albumName);

  fs.rmSync(albumPath, { recursive: true, force: true });

  let avatarData = loadAvatars();
  delete avatarData[albumName];
  saveAvatars(avatarData);

  res.redirect("/home");
});

// Trang album
// Trang album
app.get("/album/:albumName", (req, res) => {
  const albumName = req.params.albumName;
  const albumPath = path.join("public/uploads", albumName);

  if (!fs.existsSync(albumPath)) return res.redirect("/");

  const images = fs
    .readdirSync(albumPath)
    .filter((f) => fs.lstatSync(path.join(albumPath, f)).isFile())
    .map((file) => {
      const stats = fs.statSync(path.join(albumPath, file));
      return {
        name: file,
        date: stats.mtime.toLocaleString("vi-VN"), // ngày giờ cuối cùng chỉnh sửa/upload
      };
    });

  const avatars = loadAvatars();
  const currentAvatar = avatars[albumName] || null;

  res.render("album", { albumName, images, currentAvatar, error: null });
});

// Upload ảnh vào album
app.post("/upload/:albumName", upload.single("image"), (req, res) => {
  res.redirect(`/album/${req.params.albumName}`);
});

// Sửa tên ảnh
app.post("/rename-image/:albumName/:imageName", (req, res) => {
  console.log(req);
  const { albumName, imageName } = req.params;
  const newName = req.body.newName.trim();
  const albumPath = path.join("public/uploads", albumName);
  const oldImagePath = path.join(albumPath, imageName);
  const ext = path.extname(imageName);
  const newImagePath = path.join(albumPath, newName + ext);

  if (fs.existsSync(newImagePath)) {
    const images = fs
      .readdirSync(albumPath)
      .filter((f) => fs.lstatSync(path.join(albumPath, f)).isFile());
    const avatars = loadAvatars();
    const currentAvatar = avatars[albumName] || null;
    return res.render("album", {
      albumName,
      images,
      currentAvatar,
      error: "Tên ảnh đã tồn tại!",
    });
  }

  fs.renameSync(oldImagePath, newImagePath);

  let avatarData = loadAvatars();
  if (avatarData[albumName] === imageName) {
    avatarData[albumName] = newName + ext;
    saveAvatars(avatarData);
  }
  res.redirect(`/album/${albumName}`);
});

// Xóa ảnh
app.post("/delete-image/:albumName/:imageName", (req, res) => {
  const { albumName, imageName } = req.params;
  const imagePath = path.join("public/uploads", albumName, imageName);

  fs.unlinkSync(imagePath);

  let avatarData = loadAvatars();
  if (avatarData[albumName] === imageName) {
    delete avatarData[albumName];
    saveAvatars(avatarData);
  }

  res.redirect(`/album/${albumName}`);
});

// Set avatar
app.post("/set-avatar/:albumName/:imageName", (req, res) => {
  const { albumName, imageName } = req.params;
  let avatarData = loadAvatars();
  avatarData[albumName] = imageName;
  saveAvatars(avatarData);
  res.redirect(`/album/${albumName}`);
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
