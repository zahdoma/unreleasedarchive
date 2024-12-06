document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const artistsContainer = document.getElementById('artists');
    const searchBar = document.getElementById('search-bar');
    const downloadCartBtn = document.getElementById('download-cart-btn');
    const cartContainer = document.getElementById('cart-container');
    const cartItemsList = document.getElementById('cart-items-list');
    const clearCartBtn = document.getElementById('clear-cart-btn');

    // Cart Data
    let cart = [];

    // Fetch and Render Artists and Songs
    fetch('/api/artists')
        .then(response => response.json())
        .then(data => {
            const allData = data;

            // Render Artists and Songs
            const renderArtists = (dataToRender, isSearching = false) => {
                artistsContainer.innerHTML = '';

                Object.entries(dataToRender).forEach(([artist, songs]) => {
                    const artistDiv = createArtistElement(artist, songs, isSearching);
                    artistsContainer.appendChild(artistDiv);
                });
            };

            // Create Artist and Songs UI
            const createArtistElement = (artist, songs, isSearching) => {
                const artistDiv = document.createElement('div');
                artistDiv.classList.add('artist');
                artistDiv.textContent = artist;

                const songsDiv = document.createElement('div');
                songsDiv.classList.add('songs');
                songsDiv.style.display = isSearching ? 'block' : 'none';

                songs.forEach(song => {
                    const songDiv = createSongElement(artist, song);
                    songsDiv.appendChild(songDiv);
                });

                artistDiv.appendChild(songsDiv);
                artistDiv.addEventListener('click', () => {
                    toggleDisplay(songsDiv);
                });

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
                    renderArtists(allData, false);
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

                renderArtists(filteredData, true);
            };

            // Cart Functions
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

            // Download Cart
            const downloadCart = () => {
                if (cart.length === 0) return;
                const cartData = encodeURIComponent(JSON.stringify(cart));
                window.location.href = `/download-cart?cart=${cartData}`;
            };

            // Event Listeners
            searchBar.addEventListener('input', handleSearch);
            clearCartBtn.addEventListener('click', clearCart);
            downloadCartBtn.addEventListener('click', downloadCart);

            // Initial Render
            renderArtists(allData);
        });
});
