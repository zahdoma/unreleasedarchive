const connectButton = document.getElementById('connectButton');

let isConnected = false;

async function initializeButton() {
    if (window.solana && window.solana.isPhantom) {
        try {
            isConnected = await window.solana.isConnected;
            updateButtonText();
        } catch (error) {
            console.error('Failed to check wallet connection state', error);
        }
    } else {
        connectButton.innerText = 'Install Phantom Wallet';
    }
}

function updateButtonText() {
    connectButton.innerText = isConnected ? 'disconnect wallet' : 'connect wallet';
}

async function handleWalletConnection() {
    if (window.solana && window.solana.isPhantom) {
        if (!isConnected) {
            try {
                await window.solana.connect();
                console.log('Connected to Phantom wallet');
                isConnected = true;
            } catch (err) {
                console.error('Connection failed', err);
                return;
            }
        } else {
            console.log('Disconnected from Phantom wallet');
            isConnected = false;
        }
        updateButtonText();
    }
}

connectButton.addEventListener('click', handleWalletConnection);

initializeButton();
