import { API_KEY, BASE_URL } from './config.js';

class ProfileManager {
    constructor() {
        this.currentUser = null; // Will be set after fetching from backend
        this.init();
    }

    getCsrfToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    updateNavbarProfile() {
        // Update the navbar profile icon if it exists
        const navProfileIcon = document.getElementById('navProfileIcon');
        if (navProfileIcon && this.currentUser && !this.currentUser.profile_picture) {
            const initials = this.getInitials(this.currentUser.name || 'User');
            navProfileIcon.innerHTML = `<span style="display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:50%; background:#444; color:#fff; font-weight:bold; font-size:1.1rem;">${initials}</span>`;
        }
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    updateNavbarProfilePicture(pictureUrl) {
        // Update the navbar profile icon if it exists
        const navProfileIcon = document.getElementById('navProfileIcon');
        if (navProfileIcon) {
            if (pictureUrl) {
                navProfileIcon.innerHTML = `<img src="${pictureUrl}" alt="Profile" style="width:40px; height:40px; object-fit:cover; border-radius:50%; border:2px solid #fff;">`;
            } else {
                const initials = this.getInitials(this.currentUser?.name || 'User');
                navProfileIcon.innerHTML = `<span style="display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:50%; background:#444; color:#fff; font-weight:bold; font-size:1.1rem;">${initials}</span>`;
            }
        }
    }

    async init() {
        // Load current user from backend
        await this.loadCurrentUser();
        this.setupTabs();
        this.loadUserProfile();
        this.loadWatchlist();
        this.loadRatings();
        this.setupProfilePicUpload();
        this.setupEditName();
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/get_current_user/', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (response.ok) {
                this.currentUser = await response.json();
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    setupEditName() {
        const editBtn = document.getElementById('editNameBtn');
        const editArea = document.getElementById('editNameArea');
        const nameDisplay = document.getElementById('profileName');
        const input = document.getElementById('editNameInput');
        const saveBtn = document.getElementById('saveNameBtn');
        const cancelBtn = document.getElementById('cancelNameBtn');

        if (!editBtn || !editArea || !nameDisplay || !input || !saveBtn || !cancelBtn) return;

        editBtn.addEventListener('click', () => {
            editArea.style.display = 'flex';
            input.value = this.currentUser.name;
            nameDisplay.parentElement.style.display = 'none';
        });

        cancelBtn.addEventListener('click', () => {
            editArea.style.display = 'none';
            nameDisplay.parentElement.style.display = 'flex';
        });

        saveBtn.addEventListener('click', async () => {
            const newName = input.value.trim();
            if (!newName || newName.length < 2) {
                alert('Username must be at least 2 characters.');
                return;
            }
            // Save to backend
            if (this.currentUser && this.currentUser.id) {
                try {
                    const csrfToken = this.getCsrfToken();
                    const response = await fetch(`/api/user/${this.currentUser.id}/`, {
                        method: 'PUT',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken
                        },
                        body: JSON.stringify({ name: newName })
                    });
                    if (response.ok) {
                        this.currentUser.name = newName;
                        // Update displayed initials in navbar if no profile pic
                        this.updateNavbarProfile();
                    } else {
                        const errorData = await response.json();
                        alert('Could not update username: ' + (errorData.message || 'Unknown error'));
                    }
                } catch (e) {
                    alert('Could not update username in database.');
                    console.error('Error updating name:', e);
                }
            }
            nameDisplay.textContent = newName;
            editArea.style.display = 'none';
            nameDisplay.parentElement.style.display = 'flex';
        });
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const panels = document.querySelectorAll('.tab-panel');
                panels.forEach(panel => panel.classList.remove('active'));
                
                const targetPanel = document.getElementById(tab.dataset.tab);
                targetPanel.classList.add('active');
            });
        });
    }

    loadUserProfile() {
        if (!this.currentUser) {
            document.querySelector('.profile-page').innerHTML = '<div class="not-logged-in-message" style="padding:2rem;text-align:center;font-size:1.3rem;">Please <a href="/login/" style="color:#e50914;">log in</a> to view your profile.</div>';
            return;
        }

        document.getElementById('profileName').textContent = this.currentUser.name;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        document.getElementById('memberSince').textContent = '—';
        
        const remoteFallback = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.currentUser.name || 'User') + '&background=random&format=png';
        const profilePic = this.currentUser.profile_picture ? this.currentUser.profile_picture : remoteFallback;
        const largeProfilePicElem = document.getElementById('largeProfilePic');
        if (largeProfilePicElem) largeProfilePicElem.src = profilePic;
    }

    async loadWatchlist() {
    const watchlistGrid = document.getElementById('watchlistGrid');
    if (!watchlistGrid) return;

    try {
        const response = await fetch('/api/watchlist/', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            watchlistGrid.innerHTML = '<p class="empty-message">Failed to load watchlist</p>';
            return;
        }

        const watchlist = await response.json(); // this should now be [tmdbIds]

        if (!watchlist.length) {
            watchlistGrid.innerHTML = '<p class="empty-message">Your watchlist is empty</p>';
            return;
        }

        const movies = await Promise.all(
            watchlist.map(async tmdbId => {
                const res = await fetch(`${BASE_URL}movie/${tmdbId}?api_key=${API_KEY}`);
                const movie = await res.json();

                const creditsRes = await fetch(`${BASE_URL}movie/${tmdbId}/credits?api_key=${API_KEY}`);
                const credits = await creditsRes.json();

                movie.credits = credits;
                return movie;
            })
        );

        watchlistGrid.innerHTML = movies.map(movie => this.createMovieCard({
            Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
            Title: movie.title,
            Year: movie.release_date ? movie.release_date.split('-')[0] : '',
            imdbRating: movie.vote_average ? (movie.vote_average / 2).toFixed(1) : 'N/A',
            Runtime: movie.runtime ? `${movie.runtime} min` : 'N/A',
            Genre: movie.genres?.map(g => g.name).join(', ') || '',
            Director: movie.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name).join(', ') || '',
            Writer: movie.credits?.crew?.filter(c => c.job === 'Writer' || c.department === 'Writing').map(c => c.name).join(', ') || '',
            Actors: movie.credits?.cast?.slice(0, 5).map(a => a.name).join(', ') || '',
            tmdbId: movie.id
        })).join('');

    } catch (error) {
        console.error('Error loading watchlist:', error);
        watchlistGrid.innerHTML = '<p class="empty-message">Failed to load watchlist</p>';
    }
}

    async loadRatings() {
        if (!this.currentUser) return;
        const ratingsGrid = document.getElementById('ratingsGrid');
        ratingsGrid.innerHTML = '<div class="loading">Loading your reviews...</div>';
        
        try {
            const response = await fetch(`/api/user/${this.currentUser.id}/reviews/`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load reviews');
            }

            const reviews = await response.json();
            console.log('[Profile] Reviews data:', reviews);

            if (!reviews.length) {
                ratingsGrid.innerHTML = '<p class="empty-message">You haven\'t written any reviews yet</p>';
                return;
            }

            // Render reviews - use fields from ReviewSerializer
            const reviewCards = reviews.map(review => {
                console.log('[Profile] Review:', review);
                // Use movie_title from serializer, fallback to Unknown
                const movieTitle = review.movie_title || 'Unknown Movie';
                const reviewText = review.text || '';
                const rating = review.rating || 0;
                // Use movie_tmdb_id for navigation
                const tmdbId = review.movie_tmdb_id;

                // Store tmdbId for navigation
                return `
                    <div class="review-card" data-tmdb-id="${tmdbId || ''}" style="cursor:pointer;">
                        <div class="review-header">
                            <span class="movie-title">${movieTitle}</span>
                            <span class="review-rating">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>
                        </div>
                        <div class="review-text">${reviewText}</div>
                        <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
                    </div>
                `;
            });

            ratingsGrid.innerHTML = reviewCards.join('');

            // Add click handlers to review cards - use tmdb_id for navigation
            Array.from(ratingsGrid.querySelectorAll('.review-card')).forEach((el, idx) => {
                el.addEventListener('click', () => {
                    const tmdbId = el.getAttribute('data-tmdb-id');
                    if (tmdbId && tmdbId !== 'null' && tmdbId !== 'undefined') {
                        window.location.href = `/movie/?id=${tmdbId}#reviews`;
                    } else {
                        alert('Movie information not available');
                    }
                });
            });

} catch (error) {
    console.error('Error loading ratings:', error);
    ratingsGrid.innerHTML = '<p class="empty-message">Failed to load reviews</p>';
}
}  // ✅ THIS closes loadRatings()

    createMovieCard(movie, showRating = false) {
        return `
            <div class="movie-card">
                <img src="${movie.Poster}" alt="${movie.Title}">
                <div class="movie-info">
                    <h3>${movie.Title}</h3>
                    <p>${movie.Year}</p>
                    ${showRating ? `<p class="user-rating">Your Rating: ${movie.userRating}/10</p>` : ''}
                </div>
            </div>
        `;
    }

    setupProfilePicUpload() {
        const largeProfilePic = document.getElementById('largeProfilePic');
        const profilePicInput = document.getElementById('profilePicInput');
        if (!profilePicInput || !largeProfilePic) return;

        profilePicInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file || !this.currentUser || !this.currentUser.id) return;

            // Show preview immediately
            const reader = new FileReader();
            reader.onload = (ev) => {
                largeProfilePic.src = ev.target.result;
            };
            reader.readAsDataURL(file);

            // Upload to server using FormData for file upload
            try {
                const formData = new FormData();
                formData.append('profile_picture', file);

                const csrfToken = this.getCsrfToken();
                const response = await fetch(`/api/user/${this.currentUser.id}/`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'X-CSRFToken': csrfToken
                    },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.profile_picture) {
                        this.currentUser.profile_picture = data.profile_picture;
                        largeProfilePic.src = data.profile_picture;
                    }
                    // Update navbar if it has profile icon
                    this.updateNavbarProfilePicture(data.profile_picture);
                } else {
                    console.error('Failed to upload profile picture:', await response.text());
                    alert('Failed to upload profile picture. Please try again.');
                }
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                alert('Error uploading profile picture. Please try again.');
            }
        });
        // Clicking the large profile pic triggers file input
        largeProfilePic.addEventListener('click', () => profilePicInput.click());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});