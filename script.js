document.addEventListener('DOMContentLoaded', () => {
    const artistsContainer = document.getElementById('artists');
    const searchBar = document.getElementById('search-bar');

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

                        // Song name and download button
                        const songName = document.createElement('span');
                        songName.textContent = ` ${song} `;
                        songDiv.appendChild(songName);

                        const downloadBtn = document.createElement('a');
                        downloadBtn.href = `/download/${artist}/${song}`;
                        downloadBtn.classList.add('download-btn');
                        downloadBtn.textContent = 'Download';
                        songDiv.appendChild(downloadBtn);

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
        });
});
