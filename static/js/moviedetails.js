import { userManager } from './auth.js';
import { fetchMovieDetails, TOP_100_IMDB_MOVIES } from './movieData.js';
import { API_KEY, BASE_URL } from './config.js';
import { WatchlistManager } from './watchlist.js';

// Create watchlist manager instance for use in movie details page
const watchlistManager = new WatchlistManager();

class MovieDetailsPage {
    static async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');

        if (!movieId) {
            this.showError('No movie ID provided');
            return;
        }

        // Store movieId globally for watchlist functionality
        window.currentMovieId = movieId;

        try {
            const movie = await fetchMovieDetails(movieId);
            if (!movie) throw new Error('Movie not found');
            this.renderMovieDetails(movie);
            this.initializeReviews(movieId);
        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('Failed to load movie details');
        }
    }

    static renderMovieDetails(movie) {
        const main = document.getElementById('movieDetails');
        main.innerHTML = `
            <div class="movie-details-container">
                <img class="movie-details-poster" src="${movie.Poster}" alt="${movie.Title} Poster" onerror="this.src='https://via.placeholder.com/240x360?text=No+Image'" />
                <div class="movie-details-info">
                    <div>
                        <h2 class="movie-details-title">${movie.Title}</h2>
                        <div class="movie-details-meta">
                            <span class="movie-details-rating"><i class="fas fa-star"></i> ${movie.imdbRating || 'N/A'}</span>
                            <span>${movie.Year || ''}</span>
                            <span>${movie.Genre || ''}</span>
                            <span>${movie.Runtime || ''}</span>
                        </div>
                    </div>
                    <div class="movie-details-plot">${movie.Plot || 'No plot available.'}</div>
                    <div class="movie-details-meta">
                        ${movie.Director ? `<span><strong>Director:</strong> ${movie.Director}</span>` : ''}
                        ${movie.Writer ? `<span><strong>Writer:</strong> ${movie.Writer}</span>` : ''}
                        ${movie.Actors ? `<span><strong>Cast:</strong> ${movie.Actors}</span>` : ''}
                    </div>
                    <div class="movie-details-actions">
                        <button class="movie-details-btn" id="watchNowBtn"><i class="fas fa-play"></i> Watch Now</button>
                        <button class="movie-details-btn" id="addToWatchlistBtn"><i class="fas fa-plus"></i> Add to My List</button>
                    </div>
                </div>
            </div>
        `;
        this.toggleReviewForm();
        this.setupWatchlistButton(movie);
    }

    static setupWatchlistButton(movie) {
        const addToWatchlistBtn = document.getElementById('addToWatchlistBtn');
        if (!addToWatchlistBtn) return;

        // Check if already in watchlist
        const movieId = window.currentMovieId;
        if (!movieId) return;

        watchlistManager.isInWatchlist(movieId).then(isInList => {
            if (isInList) {
                addToWatchlistBtn.innerHTML = '<i class="fas fa-check"></i> In My List';
                addToWatchlistBtn.disabled = true;
            }
        });

        addToWatchlistBtn.addEventListener('click', async () => {
            if (!userManager.isLoggedIn()) {
                alert('Please login to add movies to your watchlist');
                window.location.href = '/login/';
                return;
            }

            const success = await watchlistManager.addToWatchlist(movieId);
            if (success) {
                addToWatchlistBtn.innerHTML = '<i class="fas fa-check"></i> In My List';
                addToWatchlistBtn.disabled = true;
                alert('Added to your watchlist!');
            } else {
                alert('Failed to add to watchlist. Please try again.');
            }
        });
    }

    static renderCast(actorsString) {
        if (!actorsString || actorsString === 'N/A') return '<p>No cast information available.</p>';
        
        const actors = actorsString.split(', ').map(actor => actor.trim());
        return actors.map(actor => `
            <div class="cast-member">
                <img src="https://via.placeholder.com/100" alt="${actor}" class="cast-image">
                <p>${actor}</p>
            </div>
        `).join('');
    }

    static initializeReviews(movieId) {
        const userReviewsSection = document.getElementById('userReviewsSection');
        const userReviews = document.getElementById('userReviews');
        const addReviewForm = document.getElementById('addReviewForm');
        const reviewForm = document.getElementById('reviewForm');

        if (!userManager.isLoggedIn()) {
            userReviewsSection.style.display = 'none';
            return;
        }

        userReviewsSection.style.display = 'block';
        this.renderUserReviews(movieId, userReviews);
        this.toggleReviewForm();

        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rating = document.getElementById('reviewRating').value;
            const text = document.getElementById('reviewText').value.trim();

            if (!rating || !text) {
                alert('Please provide both a rating and review text.');
                return;
            }

            await this.addReview(movieId, { rating: parseInt(rating), text, user: userManager.getCurrentUser().name, date: new Date().toISOString() });
            reviewForm.reset();
            this.renderUserReviews(movieId, userReviews);
        });
    }

    static toggleReviewForm() {
        const addReviewForm = document.getElementById('addReviewForm');
        if (!userManager.isLoggedIn()) {
            addReviewForm.style.display = 'none';
            return;
        }
        addReviewForm.style.display = 'block';
    }

    static renderUserReviews(movieId, container) {
        const reviews = this.getReviewsForMovie(movieId);
        container.innerHTML = reviews.length ? reviews.map(review => `
            <div class="review-item">
                <h3>${review.user}</h3>
                <p>Rating: ★ ${review.rating}/10</p>
                <p>${review.text}</p>
                <small>Reviewed on: ${new Date(review.date).toLocaleDateString()}</small>
            </div>
        `).join('') : '<p>No user reviews yet. Be the first to review!</p>';
    }

    static getReviewsForMovie(movieId) {
        const reviews = JSON.parse(localStorage.getItem('movieReviews')) || {};
        return reviews[movieId] || [];
    }

    static addReview(movieId, review) {
        const reviews = this.getReviewsForMovie(movieId);
        reviews.push(review);
        const allReviews = JSON.parse(localStorage.getItem('movieReviews')) || {};
        allReviews[movieId] = reviews;
        localStorage.setItem('movieReviews', JSON.stringify(allReviews));
    }

    static showError(message) {
        const container = document.getElementById('movieDetails');
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

export class MovieDetailsManager {
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.movieId = new URLSearchParams(window.location.search).get('id');
        this.container = document.getElementById('movieDetails');
        
        if (this.movieId) {
            this.loadMovieDetails();
        } else {
            this.showError('Movie ID not found');
        }
    }

    async loadMovieDetails() {
    try {
        console.log('Loading movie:', this.movieId);
        let movie = null;
        if (/^\d+$/.test(this.movieId)) {
            // Numeric: TMDB ID
            const detailsRes = await fetch(`${this.baseUrl}movie/${this.movieId}?api_key=${this.apiKey}&language=en-US&append_to_response=credits`);
            const details = await detailsRes.json();
            if (details && !details.status_code) {
                movie = {
                    imdbID: details.imdb_id,
                    tmdbId: details.id,
                    Title: details.title,
                    Plot: details.overview,
                    Poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
                    Year: details.release_date ? details.release_date.split('-')[0] : '',
                    imdbRating: details.vote_average ? (details.vote_average / 2).toFixed(1) : 'N/A',
                    Runtime: details.runtime ? `${details.runtime} min` : 'N/A',
                    Rated: details.adult ? '18+' : 'PG',
                    Genre: details.genres && details.genres.length ? details.genres.map(g => g.name).join(', ') : '',
                    Director: details.credits && details.credits.crew ? details.credits.crew.filter(c => c.job === 'Director').map(c => c.name).join(', ') : '',
                    Writer: details.credits && details.credits.crew ? details.credits.crew.filter(c => c.job === 'Writer' || c.department === 'Writing').map(c => c.name).join(', ') : '',
                    Actors: details.credits && details.credits.cast ? details.credits.cast.slice(0, 5).map(a => a.name).join(', ') : '',
                    Released: details.release_date || '',
                    BoxOffice: details.revenue ? `$${details.revenue.toLocaleString()}` : 'N/A',
                };
            }
        } else if (this.movieId.startsWith('tt')) {
            // IMDB ID: use /find
            const tmdbFindUrl = `${this.baseUrl}find/${this.movieId}?api_key=${this.apiKey}&language=en-US&external_source=imdb_id`;
            const response = await fetch(tmdbFindUrl);
            const data = await response.json();
            if (data && data.movie_results && data.movie_results.length > 0) {
                const m = data.movie_results[0];
                // Fetch full details using TMDB ID
                const detailsRes = await fetch(`${this.baseUrl}movie/${m.id}?api_key=${this.apiKey}&language=en-US&append_to_response=credits`);
                const details = await detailsRes.json();
                if (details && !details.status_code) {
                    movie = {
                        imdbID: this.movieId,
                        tmdbId: details.id,
                        Title: details.title,
                        Plot: details.overview,
                        Poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
                        Year: details.release_date ? details.release_date.split('-')[0] : '',
                        imdbRating: details.vote_average ? (details.vote_average / 2).toFixed(1) : 'N/A',
                        Runtime: details.runtime ? `${details.runtime} min` : 'N/A',
                        Rated: details.adult ? '18+' : 'PG',
                        Genre: details.genres && details.genres.length ? details.genres.map(g => g.name).join(', ') : '',
                        Director: details.credits && details.credits.crew ? details.credits.crew.filter(c => c.job === 'Director').map(c => c.name).join(', ') : '',
                        Writer: details.credits && details.credits.crew ? details.credits.crew.filter(c => c.job === 'Writer' || c.department === 'Writing').map(c => c.name).join(', ') : '',
                        Actors: details.credits && details.credits.cast ? details.credits.cast.slice(0, 5).map(a => a.name).join(', ') : '',
                        Released: details.release_date || '',
                        BoxOffice: details.revenue ? `$${details.revenue.toLocaleString()}` : 'N/A',
                    };
                }
            }
        }
        if (movie) {
            this.renderMovieDetails(movie);
        } else {
            throw new Error('Failed to load movie');
        }
    } catch (error) {
        console.error('Error loading movie:', error);
        this.showError(error.message);
    }
}

    renderMovieDetails(movie) {
        const main = document.getElementById('movieDetails');
        main.innerHTML = `
            <div class="movie-details-container">
                <img class="movie-details-poster" src="${movie.Poster}" alt="${movie.Title} Poster" onerror="this.src='https://via.placeholder.com/240x360?text=No+Image'" />
                <div class="movie-details-info">
                    <div>
                        <h2 class="movie-details-title">${movie.Title}</h2>
                        <div class="movie-details-meta">
                            <span class="movie-details-rating"><i class="fas fa-star"></i> ${movie.imdbRating || 'N/A'}</span>
                            <span>${movie.Year || ''}</span>
                            <span>${movie.Genre || ''}</span>
                            <span>${movie.Runtime || ''}</span>
                        </div>
                    </div>
                    <div class="movie-details-plot">${movie.Plot || 'No plot available.'}</div>
                    <div class="movie-details-meta">
                        ${movie.Director ? `<span><strong>Director:</strong> ${movie.Director}</span>` : ''}
                        ${movie.Writer ? `<span><strong>Writer:</strong> ${movie.Writer}</span>` : ''}
                        ${movie.Actors ? `<span><strong>Cast:</strong> ${movie.Actors}</span>` : ''}
                    </div>
                    <div class="movie-details-actions">
                        <button class="movie-details-btn" id="watchNowBtn"><i class="fas fa-play"></i> Watch Now</button>
                        <button class="movie-details-btn" id="addToWatchlistBtn"><i class="fas fa-plus"></i> Add to My List</button>
                    </div>
                </div>
            </div>
        `;
        this.setupEventListeners(movie);
    }

    setupEventListeners(movie) {
        const watchNowBtn = document.getElementById('watchNowBtn');
        const addToWatchlistBtn = document.getElementById('addToWatchlistBtn');
        const rateMovieBtn = document.getElementById('rateMovie');

        if (watchNowBtn) {
            watchNowBtn.addEventListener('click', () => {
                // Open watchnow page with imdbID and title in query string
                const imdbID = movie.imdbID;
                const title = encodeURIComponent(movie.Title);
                window.location.href = `/watchnow/?imdb=${imdbID}&title=${title}`;
            });
        }

        if (addToWatchlistBtn) {
            addToWatchlistBtn.addEventListener('click', async () => {
                // Add to watchlist via backend
                try {
                    const movieId = movie.tmdbId || movie.id;
                    if (!movieId) {
                        alert('Movie ID not found.');
                        return;
                    }
                    
                    // Get CSRF token
                    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                                       document.cookie.match(/csrftoken=([^;]+)/)?.[1];
                    
                    const response = await fetch('/api/watchlist/add/', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken || ''
                        },
                        body: JSON.stringify({
                            movieId: movieId,
                            title: movie.Title,
                            poster: movie.Poster
                        })
                    });
                    
                    if (response.ok) {
                        addToWatchlistBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
                        addToWatchlistBtn.disabled = true;
                        alert('Movie added to your watchlist!');
                    } else {
                        const data = await response.json().catch(() => ({}));
                        alert(data.message || 'Failed to add to watchlist. You may need to be logged in.');
                    }
                } catch (err) {
                    alert('Failed to add to watchlist. Please try again.');
                    console.error(err);
                }
            });
        }

        if (rateMovieBtn) {
            rateMovieBtn.addEventListener('click', () => {
                // Implement rating functionality
                console.log('Rate movie clicked');
            });
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Error</h2>
                <p>${message}</p>
                <a href="/" class="btn primary">Back to Home</a>
            </div>
        `;
    }
}