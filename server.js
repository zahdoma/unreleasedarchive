const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the root directory
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

// Endpoint to download songs
app.get('/download/:artist/:song', (req, res) => {
    const artist = req.params.artist;
    const song = req.params.song;
    const filePath = path.join(__dirname, 'artists', artist, song);

    if (fs.existsSync(filePath)) {
        res.download(filePath); // Initiates download
    } else {
        res.status(404).send('File not found');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
