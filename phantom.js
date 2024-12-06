// DOM Element
const connectButton = document.getElementById('connectButton');

// State to Track Wallet Connection
let isConnected = false;

// Initialize Button State
async function initializeButton() {
    if (window.solana && window.solana.isPhantom) {
        try {
            isConnected = await window.solana.isConnected; // Check wallet connection
            updateButtonText();
        } catch (error) {
            console.error('Failed to check wallet connection state', error);
        }
    } else {
        connectButton.innerText = 'Install Phantom Wallet';
    }
}

// Update Button Text Based on Connection State
function updateButtonText() {
    connectButton.innerText = isConnected ? 'disconnect wallet' : 'connect wallet';
}

// Handle Wallet Connection/Disconnection
async function handleWalletConnection() {
    if (window.solana && window.solana.isPhantom) {
        if (!isConnected) {
            try {
                await window.solana.connect(); // Connect the wallet
                console.log('Connected to Phantom wallet');
                isConnected = true;
            } catch (err) {
                console.error('Connection failed', err);
                return;
            }
        } else {
            // Simulate wallet disconnection
            console.log('Disconnected from Phantom wallet');
            isConnected = false;
        }
        updateButtonText();
    }
}

// Event Listener for Button Click
connectButton.addEventListener('click', handleWalletConnection);

// Initialize Button on Page Load
initializeButton();
