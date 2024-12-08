const { Connection, PublicKey, SystemProgram, Keypair } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token'); // Required for working with SPL tokens

const rpc = 'https://summer-alpha-haze.solana-mainnet.quiknode.pro/07d1622fe7e76082b6263be1c9d35c57f0c11ae3/';
const connection = new Connection(rpc);

// The wallet public key you want to query
const wallet = new PublicKey('4v2XqX1CuAtUrzyTBR6qVdmcVdzUJEg5F9tpop5SiWE4');

// The mint address of the SPL token you want to check (example: USDC)
const tokenMintAddress = new PublicKey('D3QiRT12vKBpj87h99ufQFz4mCpbPC7JVy1U6NRKpump'); // Example: USDC Mint Address

async function getTokenBalance(connection, wallet, tokenMintAddress) {
    try {
        // Get the associated token address for the wallet and token mint address
        const associatedTokenAccount = await getAssociatedTokenAddress(
            tokenMintAddress,  // Token Mint Address
            wallet             // Wallet PublicKey
        );

        // Fetch the balance for the associated token account
        const info = await connection.getTokenAccountBalance(associatedTokenAccount);
        
        if (info.value.uiAmount == null) {
            console.log('No balance found for the token account');
        } else {
            console.log(`Balance: ${info.value.uiAmount} of the token`);
        }

    } catch (err) {
        console.log('Error fetching token balance:', err);
    }
}

getTokenBalance(connection, wallet, tokenMintAddress);
