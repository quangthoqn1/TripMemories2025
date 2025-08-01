const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function getAlbumList() {
  return fs.readdirSync(uploadsDir).filter(file =>
    fs.statSync(path.join(uploadsDir, file)).isDirectory()
  );
}

function getImageUploadTime(imagePath) {
  const stats = fs.statSync(imagePath);
  return new Date(stats.ctime).toLocaleString();
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const albumDir = path.join(uploadsDir, req.params.album);
    if (!fs.existsSync(albumDir)) fs.mkdirSync(albumDir);
    cb(null, albumDir);
  },
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  const albums = getAlbumList();
  const albumThumbnails = {};
  albums.forEach(album => {
    const files = fs.readdirSync(path.join(uploadsDir, album)).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
    albumThumbnails[album] = files[0] || null;
  });

  res.render('index', { albums, albumThumbnails });
});

app.get('/album/:albumName', (req, res) => {
  const albumName = req.params.albumName;
  const albumPath = path.join(uploadsDir, albumName);
  if (!fs.existsSync(albumPath)) return res.status(404).send('Album not found');
  const files = fs.readdirSync(albumPath).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
  res.render('album', {
    albumName,
    images: files,
    getImageUploadTime: (file) => getImageUploadTime(path.join(albumPath, file))
  });
});

app.post('/create-album', (req, res) => {
  const albumName = req.body.albumName.trim();
  if (albumName) {
    const dir = path.join(uploadsDir, albumName);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  }
  res.redirect('/');
});

app.post('/upload/:album', upload.single('image'), (req, res) => {
  res.redirect(`/album/${req.params.album}`);
});

app.post('/delete-album/:album', (req, res) => {
  const dir = path.join(uploadsDir, req.params.album);
  fs.rmSync(dir, { recursive: true, force: true });
  res.redirect('/');
});

app.post('/rename-album/:album', (req, res) => {
  const oldPath = path.join(uploadsDir, req.params.album);
  const newName = req.body.newName.trim();
  const newPath = path.join(uploadsDir, newName);
  if (fs.existsSync(oldPath) && newName) fs.renameSync(oldPath, newPath);
  res.redirect('/');
});

app.post('/delete-image/:album/:image', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.album, req.params.image);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.redirect(`/album/${req.params.album}`);
});

app.post('/rename-image/:album/:image', (req, res) => {
  const album = req.params.album;
  const newName = req.body.newName.trim();
  const oldPath = path.join(uploadsDir, album, req.params.image);
  const newPath = path.join(uploadsDir, album, newName);
  if (fs.existsSync(oldPath) && newName) fs.renameSync(oldPath, newPath);
  res.redirect(`/album/${album}`);
});

app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
});
