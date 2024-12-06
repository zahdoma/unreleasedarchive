document.addEventListener('DOMContentLoaded', () => {
    const artistsContainer = document.getElementById('artists');
    const searchBar = document.getElementById('search-bar');
    const downloadCartBtn = document.getElementById('download-cart-btn');
    const cartContainer = document.getElementById('cart-container');
    const cartItemsList = document.getElementById('cart-items-list');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    let cart = [];

    // Fetch artist and song data
    fetch('/api/artists')
        .then(response => response.json())
        .then(data => {
            // Store the raw data for filtering
            const allData = data;

            // Render artists and songs
            const renderArtists = (dataToRender, isSearching = false) => {
                artistsContainer.innerHTML = ''; // Clear the container

                Object.entries(dataToRender).forEach(([artist, songs]) => {
                    const artistDiv = document.createElement('div');
                    artistDiv.classList.add('artist');
                    artistDiv.textContent = artist;
                    artistsContainer.appendChild(artistDiv);

                    const songsDiv = document.createElement('div');
                    songsDiv.classList.add('songs');
                    songsDiv.style.display = isSearching ? 'block' : 'none'; // Auto-expand on search

                    songs.forEach(song => {
                        const songDiv = document.createElement('div');
                        songDiv.classList.add('song');

                        // Song name and add-to-cart button
                        const songName = document.createElement('span');
                        songName.textContent = ` ${song} `;
                        songDiv.appendChild(songName);

                        const addToCartBtn = document.createElement('button');
                        addToCartBtn.textContent = 'Add to Cart';
                        addToCartBtn.classList.add('add-to-cart-btn');
                        addToCartBtn.onclick = () => addToCart(artist, song);
                        songDiv.appendChild(addToCartBtn);

                        songsDiv.appendChild(songDiv);
                    });

                    artistDiv.appendChild(songsDiv);

                    // Toggle song list visibility when artist is clicked
                    artistDiv.addEventListener('click', () => {
                        const currentDisplay = songsDiv.style.display;
                        songsDiv.style.display = currentDisplay === 'block' ? 'none' : 'block';
                    });
                });
            };

            renderArtists(allData); // Initial render

            // Search functionality
            searchBar.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();

                // If search box is empty, collapse all artists
                if (searchTerm === '') {
                    renderArtists(allData, false); // Collapse all
                } else {
                    // Filter songs based on the search term
                    const filteredData = Object.fromEntries(
                        Object.entries(allData).map(([artist, songs]) => [
                            artist,
                            songs.filter(song => song.toLowerCase().includes(searchTerm))
                        ]).filter(([_, songs]) => songs.length > 0) // Remove artists with no matching songs
                    );

                    renderArtists(filteredData, true); // Re-render with filtered data and auto-expand artists
                }
            });

            // Add a song to the cart
            const addToCart = (artist, song) => {
                const songItem = { artist, song };
                cart.push(songItem);
                renderCart(); // Update the cart view
            };

            // Render the cart
            const renderCart = () => {
                // Clear the current cart display
                cartItemsList.innerHTML = '';

                if (cart.length === 0) {
                    cartContainer.style.display = 'none';
                    return;
                }

                cartContainer.style.display = 'block';

                // Populate cart with items
                cart.forEach((item, index) => {
                    const cartItemDiv = document.createElement('div');
                    cartItemDiv.classList.add('cart-item');

                    const cartItemText = document.createElement('span');
                    cartItemText.textContent = `${item.song} by ${item.artist}`;
                    cartItemDiv.appendChild(cartItemText);

                    // Remove button for each cart item
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'Remove';
                    removeBtn.onclick = () => removeFromCart(index);
                    cartItemDiv.appendChild(removeBtn);

                    cartItemsList.appendChild(cartItemDiv);
                });
            };

            // Remove a song from the cart
            const removeFromCart = (index) => {
                cart.splice(index, 1); // Remove item from the cart array
                renderCart(); // Re-render the cart view
            };

            // Clear the cart
            clearCartBtn.addEventListener('click', () => {
                cart = []; // Clear the cart array
                renderCart(); // Re-render the cart view
            });

            // Download all cart items as a zip file
            downloadCartBtn.addEventListener('click', () => {
                if (cart.length === 0) {
                    alert('Your cart is empty!');
                    return;
                }

                // Encode the cart data as JSON
                const cartData = encodeURIComponent(JSON.stringify(cart));

                // Redirect to download the cart as a zip
                window.location.href = `/download-cart?cart=${cartData}`;
            });
        });
});
