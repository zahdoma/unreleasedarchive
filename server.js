const AWS = require('aws-sdk');
const express = require('express');
const archiver = require('archiver');

const app = express();
const port = 3000;

// Configure AWS S3
const s3 = new AWS.S3({
    region: 'ca-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Set in Render environment variables
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Set in Render environment variables
});

const bucketName = 'unreleased';

// Endpoint: Get Artists and Their Songs
app.get('/api/artists', async (req, res) => {
    try {
        const artists = {};
        const params = { Bucket: bucketName, Prefix: 'artists/' };
        const data = await s3.listObjectsV2(params).promise();

        data.Contents.forEach(item => {
            const parts = item.Key.split('/');
            if (parts.length === 3) {
                const artist = parts[1];
                const song = parts[2];

                if (!artists[artist]) {
                    artists[artist] = [];
                }
                artists[artist].push(song);
            }
        });

        res.json(artists);
    } catch (error) {
        console.error('Error fetching artists:', error);
        res.status(500).send('Server error');
    }
});

// Endpoint: Download Cart as a Zip File
app.get('/download-cart', async (req, res) => {
    try {
        const cart = JSON.parse(decodeURIComponent(req.query.cart));
        const zip = archiver('zip', { zlib: { level: 9 } });

        res.attachment('cart.zip');
        zip.pipe(res);

        for (const item of cart) {
            const songKey = `artists/${item.artist}/${item.song}`;
            const params = { Bucket: bucketName, Key: songKey };

            const songStream = s3.getObject(params).createReadStream();
            zip.append(songStream, { name: `${item.artist}-${item.song}` });
        }

        await zip.finalize();
    } catch (error) {
        console.error('Error creating zip file:', error);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
