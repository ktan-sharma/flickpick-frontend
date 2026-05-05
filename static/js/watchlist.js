import { API_KEY, BASE_URL } from './config.js';

export class WatchlistManager {
    constructor() {
        this.initializeWatchlist();
    }

    async initializeWatchlist() {
        if (window.location.pathname.includes('/watchlist/') || window.location.pathname.includes('/profile/')) {
            try {
                const response = await fetch('/api/watchlist/', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    const watchlist = await response.json();
                    console.log('Fetched watchlist from backend:', watchlist);
                    this.renderWatchlist(watchlist);
                } else {
                    console.log('Failed to load watchlist');
                    this.renderWatchlist([]);
                }
            } catch (error) {
                console.error('Error loading watchlist:', error);
                this.renderWatchlist([]);
            }
        }
    }

    // RenderWatchlist now takes watchlist array directly
    async renderWatchlist(watchlistArr = []) {
        const container = document.getElementById('watchlistContainer') || document.getElementById('watchlist');
        if (!container) return;
        if (!watchlistArr.length) {
            container.innerHTML = '<div class="empty-watchlist">Your watchlist is empty</div>';
            return;
        }
        container.innerHTML = '<div class="loading">Loading watchlist...</div>';
        const movies = await Promise.all(
            watchlistArr.map(async tmdbId => {
                try {
                    const response = await fetch(`${BASE_URL}movie/${tmdbId}?api_key=${API_KEY}`);
                    return await response.json();
                } catch (e) {
                    console.error('TMDB fetch error:', e);
                    return null;
                }
            })
        );
        container.innerHTML = movies.filter(Boolean).map(movie => `
            <div class="watchlist-item" data-id="${movie.id}">
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="watchlist-poster">
                <div class="watchlist-info">
                    <h3>${movie.title}</h3>
                    <p class="year">${movie.release_date ? movie.release_date.substring(0, 4) : ''}</p>
                    <div class="ratings-container">
                        <div class="imdb-rating">
                            <span class="rating-label">TMDB:</span>
                            <span class="rating-value">★ ${(movie.vote_average / 2).toFixed(1)}</span>
                        </div>
                    </div>
                    <button class="remove-watchlist" onclick="watchlistManager.removeFromWatchlist('${movie.id}')">
                        Remove from Watchlist
                    </button>
                </div>
            </div>
        `).join('');
    }


    // Add movie to watchlist
    async addToWatchlist(movieId) {
        try {
            const csrfToken = this.getCsrfToken();
            const response = await fetch('/api/watchlist/add/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ movie_id: movieId })
            });

            if (response.ok) {
                console.log('Added to watchlist:', movieId);
                return true;
            } else {
                console.error('Failed to add to watchlist:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            return false;
        }
    }

    // Remove movie from watchlist
    async removeFromWatchlist(movieId) {
        try {
            const csrfToken = this.getCsrfToken();
            const response = await fetch(`/api/watchlist/remove/${movieId}/`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });

            if (response.ok) {
                console.log('Removed from watchlist:', movieId);
                // Refresh watchlist display if on watchlist page
                if (window.location.pathname.includes('/watchlist/') || window.location.pathname.includes('/profile/')) {
                    this.initializeWatchlist();
                }
                return true;
            } else {
                console.error('Failed to remove from watchlist:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            return false;
        }
    }

    // Check if movie is in watchlist
    async isInWatchlist(movieId) {
        try {
            const response = await fetch('/api/watchlist/', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const watchlist = await response.json();
                // API returns array of movie objects, check if any has matching tmdb_id
                return watchlist.some(movie => 
                    movie.tmdb_id === parseInt(movieId) || movie.id === parseInt(movieId)
                );
            }
            return false;
        } catch (error) {
            console.error('Error checking watchlist:', error);
            return false;
        }
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

    async fetchWatchlistMovies() {
        const currentUser = this.getCurrentUser();
        if (!currentUser?.watchlist?.length) return [];

        const movies = await Promise.all(
            currentUser.watchlist.map(async (movie) => {
                const response = await fetch(`${BASE_URL}movie/${movie.id}?api_key=${API_KEY}`);
                const data = await response.json();
                return data && (data.id || data.Response === "True") ? { ...data, userRating: movie.userRating } : null;
            })
        );
        return movies.filter(movie => movie);
    }


}

export const watchlistManager = new WatchlistManager();

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/watchlist/') || window.location.pathname.includes('/profile/')) {
        watchlistManager.initializeWatchlist();
    }
});

window.watchlistManager = watchlistManager;