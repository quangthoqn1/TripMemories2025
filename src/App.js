import React from 'react';
import './style.css';

const App = () => {
    const albums = ['Hà nội', 'Camera', 'Rename'];
    const images = [
        { name: '1753953368602-images (1).jpg', date: '07/31/2025, 4:16:08 PM' },
        { name: '1753948946678-images (1).jpg', date: '07/31/2025, 4:16:08 PM' }
    ];

    return (
        <div className="grid-layout">
            {albums.map((album, index) => (
                <div key={index} className="grid-item">
                    <h3>{album}</h3>
                    <button style={{ background: 'red', color: 'white' }}>Delete</button>
                </div>
            ))}
            {images.map((image, index) => (
                <div key={index} className="grid-item">
                    <img src={`/uploads/${image.name}`} alt={image.name} />
                    <p>{image.name}</p>
                    <p>{image.date}</p>
                    <button>Download</button>
                    <button style={{ background: 'red', color: 'white' }}>Delete</button>
                </div>
            ))}
        </div>
    );
};

export default App;