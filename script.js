document.addEventListener('DOMContentLoaded', () => {
    const artistsContainer = document.getElementById('artists');
    const searchBar = document.getElementById('search-bar');
    const downloadCartBtn = document.getElementById('download-cart-btn');
    const cartContainer = document.getElementById('cart-container');
    const cartItemsList = document.getElementById('cart-items-list');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const connectButton = document.getElementById('connectButton');

    let cart = [];
    let isConnected = false;

    const requiredSOLAmount = 0.1; // 0.1 SOL
    const recipientWallet = "3Nt5ZyCtW5WbRpBpm5qjTdYYhNCHDE3LfJGz6xvpUda9";

    const initializeWallet = async () => {
        if (window.solana && window.solana.isPhantom) {
            try {
                isConnected = await window.solana.isConnected;
                updateConnectButton();
            } catch (error) {
                console.error('Error initializing wallet:', error);
            }
        } else {
            connectButton.innerText = 'Install Phantom Wallet';
        }
    };

    const updateConnectButton = () => {
        connectButton.innerText = isConnected ? 'disconnect wallet' : 'connect wallet';
    };

    const handleWalletConnection = async () => {
        if (!window.solana || !window.solana.isPhantom) return;
        try {
            if (!isConnected) {
                await window.solana.connect();
                console.log('Wallet connected:', window.solana.publicKey.toString());
                isConnected = true;
            } else {
                console.log('Wallet disconnected');
                isConnected = false;
            }
            updateConnectButton();
        } catch (error) {
            console.error('Wallet connection error:', error);
        }
    };

    connectButton.addEventListener('click', handleWalletConnection);

    const fetchArtists = async () => {
        try {
            const response = await fetch('/api/artists');
            const data = await response.json();
            renderArtists(data);
        } catch (error) {
            console.error('Error fetching artists:', error);
        }
    };

    const renderArtists = (data) => {
        artistsContainer.innerHTML = '';
        Object.entries(data).forEach(([artist, songs]) => {
            const artistDiv = document.createElement('div');
            artistDiv.classList.add('artist');
            artistDiv.textContent = artist;

            const songsDiv = document.createElement('div');
            songsDiv.classList.add('songs');
            songsDiv.style.display = 'none';

            songs.forEach(song => {
                const songDiv = document.createElement('div');
                songDiv.classList.add('song');

                const songName = document.createElement('span');
                songName.textContent = song.replace('.mp3', '');
                songDiv.appendChild(songName);

                const addToCartBtn = document.createElement('button');
                addToCartBtn.textContent = 'add to cart';
                addToCartBtn.onclick = () => addToCart(artist, song);
                songDiv.appendChild(addToCartBtn);

                songsDiv.appendChild(songDiv);
            });

            artistDiv.appendChild(songsDiv);
            artistDiv.onclick = () => {
                songsDiv.style.display = songsDiv.style.display === 'none' ? 'block' : 'none';
            };
            artistsContainer.appendChild(artistDiv);
        });
    };

    const addToCart = (artist, song) => {
        cart.push({ artist, song });
        renderCart();
    };

    const removeFromCart = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    const renderCart = () => {
        cartItemsList.innerHTML = '';
        if (cart.length === 0) {
            cartContainer.style.display = 'none';
            return;
        }
        cartContainer.style.display = 'block';
        cart.forEach((item, index) => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.textContent = `${item.song.replace('.mp3', '')} by ${item.artist}`;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'remove';
            removeBtn.onclick = () => removeFromCart(index);
            cartItemDiv.appendChild(removeBtn);

            cartItemsList.appendChild(cartItemDiv);
        });
    };

    const sendSolTransaction = async (sender, recipient, amount) => {
        const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));
        const senderPublicKey = new solanaWeb3.PublicKey(sender);
        const recipientPublicKey = new solanaWeb3.PublicKey(recipient);

        const transaction = new solanaWeb3.Transaction().add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: senderPublicKey,
                toPubkey: recipientPublicKey,
                lamports: amount * solanaWeb3.LAMPORTS_PER_SOL,
            })
        );

        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = senderPublicKey;

        const signedTransaction = await window.solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(signature);
        return signature;
    };

    downloadCartBtn.addEventListener('click', async () => {
        if (!isConnected) {
            alert('Please connect your wallet first.');
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        try {
            const senderWallet = window.solana.publicKey.toString();
            const transactionHash = await sendSolTransaction(senderWallet, recipientWallet, requiredSOLAmount);
            alert(`Transaction successful! Hash: ${transactionHash}`);

            const cartData = encodeURIComponent(JSON.stringify(cart));
            window.location.href = `/download-cart?cart=${cartData}`;
        } catch (error) {
            console.error('Transaction failed:', error);
            alert('Transaction failed. Please try again.');
        }
    });

    clearCartBtn.addEventListener('click', () => {
        cart = [];
        renderCart();
    });

    fetchArtists();
    initializeWallet();
});
