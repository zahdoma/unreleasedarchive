const connectButton = document.getElementById('connectButton');
let isConnected = false;  // Track the connection state

// Initialize the button state based on wallet connection
async function initializeButton() {
    if (window.solana && window.solana.isPhantom) {
        isConnected = await window.solana.isConnected;  // Check if the wallet is connected
        connectButton.innerText = isConnected ? 'disconnect wallet' : 'connect wallet';
    } else {
        connectButton.innerText = 'Install Phantom Wallet';
    }
}

// Handle button click
connectButton.addEventListener('click', async () => {
    if (window.solana && window.solana.isPhantom) {
        if (!isConnected) {
            try {
                // Connect the wallet
                await window.solana.connect();
                console.log('Connected to Phantom wallet');
                connectButton.innerText = 'disconnect wallet';
                isConnected = true;
            } catch (err) {
                console.error('Connection failed', err);
            }
        } else {
            // Simulate disconnection
            console.log('Disconnected from Phantom wallet');
            connectButton.innerText = 'connect wallet';
            isConnected = false;
        }
    }
});

// Initialize the button on page load
initializeButton();