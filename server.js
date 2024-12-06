const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// API endpoint to get artists and their songs
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
            if (fs.lstatSync(artistPath).isDirectory()) {
                const songs = fs.readdirSync(artistPath).filter(file => file.endsWith('.mp3'));
                data[artist] = songs;
            }
        });

        res.json(data);
    });
});

// Endpoint to download individual songs
app.get('/download/:artist/:song', (req, res) => {
    const artist = req.params.artist;
    const song = req.params.song;
    const filePath = path.join(__dirname, 'artists', artist, song);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Endpoint to download multiple songs as a zip
app.get('/download-cart', (req, res) => {
    // Parse the cart data from the query string
    const cart = JSON.parse(decodeURIComponent(req.query.cart));

    // Create a new zip archive
    const zip = archiver('zip', { zlib: { level: 9 } });
    res.attachment('cart.zip');
    zip.pipe(res);

    // Add each song to the zip
    cart.forEach(item => {
        const songPath = path.join(__dirname, 'artists', item.artist, item.song);
        if (fs.existsSync(songPath)) {
            zip.file(songPath, { name: `${item.artist}-${item.song}` });
        }
    });

    // Finalize the zip file and send it
    zip.finalize();
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
