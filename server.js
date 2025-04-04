const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const express = require('express');
const archiver = require('archiver');
const path = require('path');
const { Readable } = require('stream');
require('dotenv').config();

const app = express();
const port = 5000;

const { Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');

const connection = new Connection('https://summer-alpha-haze.solana-mainnet.quiknode.pro/07d1622fe7e76082b6263be1c9d35c57f0c11ae3');

/* =========================================================
GET BALANCE
========================================================= */
app.get('/get-balance', async (req, res) => {
    const { wallet, mint } = req.query;
  
    if (!wallet || !mint) {
      return res.status(400).send({ error: 'Missing wallet or mint address.' });
    }
  
    try {
      const walletPublicKey = new PublicKey(wallet);
      const tokenMintPublicKey = new PublicKey(mint);
  
      // Get associated token address for the given mint and wallet
      const associatedTokenAddress = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        walletPublicKey
      );
  
      // Get account info for the associated token address
      const accountInfo = await getAccount(connection, associatedTokenAddress);
      const amount = accountInfo.amount.toString();
  
      res.send({ amount });
    } catch (error) {
      console.error("Error fetching balance:", error);  // Log the error to the server
      if (error.message.includes("AccountNotFound")) {
        res.status(404).send({ error: 'Token account not found for this wallet.' });
      } else {
        res.status(500).send({ error: 'Failed to fetch balance: ' + error.message });
      }
    }
  });

/* =========================================================
AWS
========================================================= */
// Configure AWS S3 Client
const s3 = new S3Client({
    region: 'ca-central-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const bucketName = 'unreleased';

// WASABI
// const s3 = new S3Client({
//     endpoint: 'https://s3.wasabisys.com', // Use the appropriate endpoint for your region
//     region: 'us-east-1', // Change to your Wasabi bucket's region
//     credentials: {
//         accessKeyId: process.env.WASABI_ACCESS_KEY_ID, // Wasabi Access Key
//         secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY // Wasabi Secret Key
//     }
// });
// const bucketName = 'unreleased'; // Your Wasabi bucket name


/* =========================================================
HELPER FUNCTIONS
========================================================= */
// Convert stream to readable buffer
const streamToReadable = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err) => reject(err));
    });
};

/* =========================================================
ROUTES
========================================================= */
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

        // Set up the zip file response
        res.attachment('cart.zip');
        zip.pipe(res);

        // Add each song in the cart to the zip file
        for (const item of cart) {
            const songKey = `artists/${item.artist}/${item.song}`;
            const command = new GetObjectCommand({ Bucket: bucketName, Key: songKey });

            const { Body } = await s3.send(command);

            // Convert stream to buffer and append it to the zip
            const buffer = await streamToReadable(Body);
            zip.append(buffer, { name: `${item.artist}-${item.song}` });
        }

        await zip.finalize();
    } catch (error) {
        console.error('Error creating zip file:', error);
        res.status(500).send('Server error');
    }
});

/* =========================================================
SERVER
========================================================= */
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
