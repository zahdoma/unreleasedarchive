document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const connectButton = document.getElementById('connectButton');
    const downloadCartBtn = document.getElementById('download-cart-btn');
    const walletStatusDiv = document.getElementById('wallet-status');
    const searchBar = document.getElementById('search-bar');
    const cartContainer = document.getElementById('cart-container');
    const cartItemsList = document.getElementById('cart-items-list');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const artistsContainer = document.getElementById('artists');

    // Cart Data
    let cart = [];
    let walletPublicKey = null;

    // Show error message
    const showError = (message) => {
        walletStatusDiv.textContent = message;
        walletStatusDiv.style.color = 'red';
    };

    const getProvider = () => {
        if('phantom' in window) {
            const provider = window.phantom?.solana;

            if(provider?.isPhantom)
                return provider;
        }
    }

    // Phantom Wallet Connection
    const connectWallet = async () => {
        if (window.solana && window.solana.isPhantom && !walletPublicKey) {
            const provider = getProvider();

            const network = "https://summer-alpha-haze.solana-mainnet.quiknode.pro/07d1622fe7e76082b6263be1c9d35c57f0c11ae3";
            const connection = new solanaWeb3.Connection(network);
            
            try {
                const response = await provider.connect();
                walletPublicKey = response.publicKey.toString();
                
                const publicKey = new solanaWeb3.PublicKey(walletPublicKey);
                const balance = await connection.getBalance(publicKey);

                connectButton.textContent = `wallet: ${walletPublicKey.slice(0, 4).toLowerCase()}...${walletPublicKey.slice(-4).toLowerCase()} (${(balance / 1e9).toFixed(3)}) SOL`;
                showError('');
            } catch (err) {
                console.error('Wallet connection failed:', err);
                showError('failed to connect wallet. please try again.');
            }
        } else if (!walletPublicKey) {
            showError('phantom wallet not installed. please install it.');
        }
    };
    
    connectButton.addEventListener('click', connectWallet);

    // Fetch and Render Artists and Songs
    const fetchArtists = async () => {
        try {
            const response = await fetch('/api/artists');
            const data = await response.json();
            renderArtists(data);
        } catch (error) {
            console.error('Error fetching artists:', error);
            showError('failed to load artists. please try again later.');
        }
    };

    const renderArtists = (dataToRender) => {
        artistsContainer.innerHTML = '';

        if (Object.keys(dataToRender).length === 0) {
            artistsContainer.innerHTML = '<p>no artists found.</p>';
        } else {
            Object.entries(dataToRender).forEach(([artist, songs]) => {
                const artistDiv = createArtistElement(artist, songs);
                artistsContainer.appendChild(artistDiv);
            });
        }
    };

    // Create Artist and Songs UI
    const createArtistElement = (artist, songs) => {
        const artistDiv = document.createElement('div');
        artistDiv.classList.add('artist');
        artistDiv.textContent = artist;

        const songsDiv = document.createElement('div');
        songsDiv.classList.add('songs');
        songsDiv.style.display = 'none';

        songs.forEach(song => {
            const songDiv = createSongElement(artist, song);
            songsDiv.appendChild(songDiv);
        });

        artistDiv.appendChild(songsDiv);
        artistDiv.addEventListener('click', () => toggleDisplay(songsDiv));

        return artistDiv;
    };

    // Create Song UI
    const createSongElement = (artist, song) => {
        const songDiv = document.createElement('div');
        songDiv.classList.add('song');

        const songName = document.createElement('span');
        songName.textContent = ` ${song.replace('.mp3', '').toLowerCase()} `;
        songDiv.appendChild(songName);

        const addToCartBtn = document.createElement('button');
        addToCartBtn.textContent = 'add to cart';
        addToCartBtn.classList.add('add-to-cart-btn');
        addToCartBtn.onclick = () => addToCart(artist, song);
        songDiv.appendChild(addToCartBtn);

        return songDiv;
    };

    // Toggle Display Helper
    const toggleDisplay = (element) => {
        element.style.display = element.style.display === 'block' ? 'none' : 'block';
    };

    // Handle Search
    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();

        if (!searchTerm) {
            fetchArtists();
            return;
        }

        const filteredData = Object.fromEntries(
            Object.entries(allData)
                .map(([artist, songs]) => [
                    artist,
                    songs.filter(song => song.toLowerCase().includes(searchTerm))
                ])
                .filter(([_, songs]) => songs.length > 0)
        );

        renderArtists(filteredData);
    };

    // Cart Functions
    const addToCart = (artist, song) => {
        cart.push({ artist, song });
        renderCart();
        showError('')
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
            const cartItemDiv = createCartItemElement(item, index);
            cartItemsList.appendChild(cartItemDiv);
        });
    };

    const createCartItemElement = (item, index) => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');

        const cartItemText = document.createElement('span');
        cartItemText.textContent = `${item.song.replace('.mp3', '').toLowerCase()} by ${item.artist}`;
        cartItemDiv.appendChild(cartItemText);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'remove';
        removeBtn.onclick = () => removeFromCart(index);
        cartItemDiv.appendChild(removeBtn);

        return cartItemDiv;
    };

    // Clear Cart
    const clearCart = () => {
        cart = [];
        renderCart();
    };

    // Cart and Download Logic
    const downloadCart = async () => {
        if (!walletPublicKey) {
            showError('connect your wallet to download songs.');
            return;
        }

        if (cart.length === 0) {
            showError('your cart is empty.');
            return;
        }

        const network = "https://summer-alpha-haze.solana-mainnet.quiknode.pro/07d1622fe7e76082b6263be1c9d35c57f0c11ae3";
        const connection = new solanaWeb3.Connection(network);
        const publicKey = new solanaWeb3.PublicKey(walletPublicKey);
        
        try {
            const balance = await connection.getBalance(publicKey);
            const requiredSol = 1; // Change this value to the required SOL amount
    
            if (balance < requiredSol * 1e9) { // Convert SOL to lamports (1 SOL = 1e9 lamports)
                showError(`you need at least ${requiredSol} sol to download.`);
                return;
            }
    
            // If balance is sufficient, proceed to download
            const cartData = encodeURIComponent(JSON.stringify(cart));
            window.location.href = `/download-cart?cart=${cartData}`;
        } catch (error) {
            console.error('Error checking balance:', error);
            showError('failed to check wallet balance. please try again later.');
        }
    };

    // Event Listeners
    searchBar.addEventListener('input', handleSearch);
    clearCartBtn.addEventListener('click', clearCart);
    downloadCartBtn.addEventListener('click', downloadCart);

    // Initial Fetch Artists
    fetchArtists();
});
