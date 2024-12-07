const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const express = require('express');
const archiver = require('archiver');
const { Readable } = require('stream');

const app = express();
const port = 3000;

// Configure AWS S3 Client
const s3 = new S3Client({
    region: 'ca-central-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const bucketName = 'unreleased';

// Helper: Stream-to-Readable
const streamToReadable = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err) => reject(err));
    });
};

// Endpoint: Get Artists and Their Songs
app.get('/api/artists', async (req, res) => {
    try {
        const artists = {};
        const params = { Bucket: bucketName, Prefix: 'artists/' };
        const command = new ListObjectsV2Command(params);

        const data = await s3.send(command);

        if (data.Contents) {
            data.Contents.forEach((item) => {
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
        }

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
            const command = new GetObjectCommand({ Bucket: bucketName, Key: songKey });

            const { Body } = await s3.send(command);

            // Convert stream to readable buffer
            const buffer = await streamToReadable(Body);
            zip.append(buffer, { name: `${item.artist}-${item.song}` });
        }

        await zip.finalize();
    } catch (error) {
        console.error('Error creating zip file:', error);
        res.status(500).send('Server error');
    }
});

// Start the Server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
