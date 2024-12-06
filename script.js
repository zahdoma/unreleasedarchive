document.addEventListener('DOMContentLoaded', () => {
    const artistsContainer = document.getElementById('artists');
    const searchBar = document.getElementById('search-bar');
    const downloadCartBtn = document.getElementById('download-cart-btn');
    const cartContainer = document.getElementById('cart-container');
    const cartItemsList = document.getElementById('cart-items-list');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    let cart = [];

    fetch('/api/artists')
        .then(response => response.json())
        .then(data => {
            const allData = data;

            const renderArtists = (dataToRender, isSearching = false) => {
                artistsContainer.innerHTML = '';

                Object.entries(dataToRender).forEach(([artist, songs]) => {
                    const artistDiv = document.createElement('div');
                    artistDiv.classList.add('artist');
                    artistDiv.textContent = artist;
                    artistsContainer.appendChild(artistDiv);

                    const songsDiv = document.createElement('div');
                    songsDiv.classList.add('songs');
                    songsDiv.style.display = isSearching ? 'block' : 'none';

                    songs.forEach(song => {
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

                        songsDiv.appendChild(songDiv);
                    });

                    artistDiv.appendChild(songsDiv);

                    artistDiv.addEventListener('click', () => {
                        const currentDisplay = songsDiv.style.display;
                        songsDiv.style.display = currentDisplay === 'block' ? 'none' : 'block';
                    });
                });
            };

            renderArtists(allData);

            searchBar.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();

                if (searchTerm === '') {
                    renderArtists(allData, false);
                } else {
                    const filteredData = Object.fromEntries(
                        Object.entries(allData).map(([artist, songs]) => [
                            artist,
                            songs.filter(song => song.toLowerCase().includes(searchTerm))
                        ]).filter(([_, songs]) => songs.length > 0)
                    );

                    renderArtists(filteredData, true);
                }
            });

            const addToCart = (artist, song) => {
                const songItem = { artist, song };
                cart.push(songItem);
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
                
                    // Remove .mp3 from the song name before displaying it
                    const cartItemText = document.createElement('span');
                    cartItemText.textContent = `${item.song.replace('.mp3', '').toLowerCase()} by ${item.artist}`;
                    cartItemDiv.appendChild(cartItemText);
                
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'remove';
                    removeBtn.onclick = () => removeFromCart(index);
                    cartItemDiv.appendChild(removeBtn);
                
                    cartItemsList.appendChild(cartItemDiv);
                });
            };
            
            

            const removeFromCart = (index) => {
                cart.splice(index, 1);
                renderCart();
            };

            clearCartBtn.addEventListener('click', () => {
                cart = [];
                renderCart();
            });

            downloadCartBtn.addEventListener('click', () => {
                if (cart.length === 0) {
                    return;
                }

                const cartData = encodeURIComponent(JSON.stringify(cart));
                window.location.href = `/download-cart?cart=${cartData}`;
            });
        });
});
