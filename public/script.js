document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
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

    document.getElementById('connectButton').addEventListener('click', async () => {
        try {
            if (!window.solana || !window.solana.isPhantom) {
                alert("Please install the Phantom Wallet extension.");
                return;
            }
    
            const response = await window.solana.connect();
            walletPublicKey = response.publicKey.toString();
            console.log("Connected to:", walletPublicKey);
    
            // Replace with your backend endpoint to fetch token balance
            const tokenMintAddress = "D3QiRT12vKBpj87h99ufQFz4mCpbPC7JVy1U6NRKpump";

            const balance = await fetch(`/get-balance?wallet=${walletPublicKey}&mint=${tokenMintAddress}`)
                .then((res) => res.json());
    
            // Update the button with balance
            const connectButton = document.getElementById('connectButton');
            connectButton.textContent = `balance: ${(balance.amount / 1e6).toFixed(5)}`;
        } catch (error) {
            walletStatusDiv.textContent = "failed to connect. please try again.";
            walletStatusDiv.style.color = 'red';
        }
    });

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


    // CART DOWNLOAD
const downloadCart = async () => {
    if (!walletPublicKey) {
        showError('Connect your wallet to download songs.');
        return;
    }

    if (cart.length === 0) {
        showError('Your cart is empty.');
        return;
    }

    const tokenMintAddress = "D3QiRT12vKBpj87h99ufQFz4mCpbPC7JVy1U6NRKpump"; // Replace with your token's mint address
    const requiredTokenAmount = 3000; // Replace with the required amount of tokens

    try {
        // Fetch the token balance for the connected wallet
        const response = await fetch(`/get-balance?wallet=${walletPublicKey}&mint=${tokenMintAddress}`);
        const balance = await response.json();

        if (!balance || balance.amount / 1e6 < requiredTokenAmount) {
            showError(`you need at least ${requiredTokenAmount} tokens to download.`);
            return;
        }

        // If token balance is sufficient, proceed to download
        const cartData = encodeURIComponent(JSON.stringify(cart));
        window.location.href = `/download-cart?cart=${cartData}`;
    } catch (error) {
        console.error('Error checking token balance:', error);
        showError('Failed to check token balance. Please try again later.');
    }
};


    // Event Listeners
    searchBar.addEventListener('input', handleSearch);
    clearCartBtn.addEventListener('click', clearCart);
    downloadCartBtn.addEventListener('click', downloadCart);

    // Initial Fetch Artists
    fetchArtists();
});
