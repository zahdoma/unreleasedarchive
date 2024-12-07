const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Utility function to check if a directory exists
const directoryExists = (dirPath) => fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();

// Endpoint: Get Artists and Their Songs
app.get('/api/artists', (req, res) => {
    const artistsDir = path.join(__dirname, 'artists');
    const data = {};

    fs.readdir(artistsDir, (err, artists) => {
        if (err) {
            console.error('Error reading artists directory:', err);
            return res.status(500).send('Server error');
        }

        artists.forEach(artist => {
            const artistPath = path.join(artistsDir, artist);
            if (directoryExists(artistPath)) {
                const songs = fs.readdirSync(artistPath).filter(file => file.endsWith('.mp3'));
                data[artist] = songs;
            }
        });

        res.json(data);
    });
});

// Endpoint: Download Cart as a Zip File
app.get('/download-cart', (req, res) => {
    try {
        const cart = JSON.parse(decodeURIComponent(req.query.cart)); // Parse cart data
        const zip = archiver('zip', { zlib: { level: 9 } });

        res.attachment('cart.zip');
        zip.pipe(res);

        cart.forEach(item => {
            const songPath = path.join(__dirname, 'artists', item.artist, item.song);
            if (fs.existsSync(songPath)) {
                zip.file(songPath, { name: `${item.artist}-${item.song}` });
            }
        });

        zip.finalize();
    } catch (error) {
        console.error('Error creating zip file:', error);
        res.status(500).send('Server error');
    }
});

// Start the Server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
