const solanaWeb3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');

const getTokenBalance = async () => {
    const rpc = 'https://summer-alpha-haze.solana-mainnet.quiknode.pro/07d1622fe7e76082b6263be1c9d35c57f0c11ae3/';
    const connection = new solanaWeb3.Connection(rpc);
    const wallet = new solanaWeb3.PublicKey('4v2XqX1CuAtUrzyTBR6qVdmcVdzUJEg5F9tpop5SiWE4');
    const tokenMintAddress = new solanaWeb3.PublicKey('D3QiRT12vKBpj87h99ufQFz4mCpbPC7JVy1U6NRKpump');
    try {
        const associatedTokenAccount = await splToken.getAssociatedTokenAddress(
            tokenMintAddress,
            wallet         
        );

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

getTokenBalance();
