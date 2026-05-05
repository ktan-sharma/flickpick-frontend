import { API_KEY, BASE_URL } from './config.js';

// Helper function to fix poster URLs
function fixPosterUrl(posterUrl) {
    if (!posterUrl) {
        return 'https://via.placeholder.com/240x360?text=No+Image';
    }
    // If it's already a full URL, return it
    if (posterUrl.startsWith('http://') || posterUrl.startsWith('https://')) {
        return posterUrl;
    }
    // If it starts with /, it's a TMDB path - add the base URL
    if (posterUrl.startsWith('/')) {
        return `https://image.tmdb.org/t/p/w500${posterUrl}`;
    }
    // Otherwise, assume it's a TMDB path without leading slash
    return `https://image.tmdb.org/t/p/w500/${posterUrl}`;
}

async function loadRecommendedSection() {
    const recommendationsSection = document.getElementById('popularMovies');
    if (!recommendationsSection) return;

    // Show loading state
    recommendationsSection.innerHTML = '<div class="loading">Loading personalized recommendations...</div>';

    try {
        // Check if user is logged in
        const userRes = await fetch('/api/get_current_user/', {
            credentials: 'include'
        });

        if (!userRes.ok) {
            recommendationsSection.innerHTML = '<p class="empty-message">Sign in to get personalized recommendations!</p>';
            return;
        }

        const user = await userRes.json();
        if (!user.id) {
            recommendationsSection.innerHTML = '<p class="empty-message">Sign in to get personalized recommendations!</p>';
            return;
        }

        // Fetch recommendations from Django API
        const recRes = await fetch('/api/recommendations/', {
            method: 'GET',
            credentials: 'include'
        });

        if (!recRes.ok) {
            throw new Error('Failed to fetch recommendations');
        }

        const recData = await recRes.json();
        const movies = recData.movies || [];

        if (!movies.length) {
            recommendationsSection.innerHTML = '<p class="empty-message">No recommendations found. Complete your <a href="/survey/" style="color:#e50914;">preference survey</a>!</p>';
            return;
        }

        // Display recommendations
        recommendationsSection.innerHTML = movies.map(movie => {
            const posterUrl = fixPosterUrl(movie.poster);
            return `
            <div class="movie-card" data-movie-id="${movie.id}">
                <img src="${posterUrl}" 
                     alt="${movie.title}" 
                     onerror="this.src='https://via.placeholder.com/240x360?text=No+Image'">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.year || ''}</p>
                    <p>Rating: ${movie.rating ? movie.rating.toFixed(1) : 'N/A'}</p>
                </div>
            </div>
        `}).join('');

        // Add click handlers
        Array.from(recommendationsSection.querySelectorAll('.movie-card')).forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.movieId;
                window.location.href = `/movie/?id=${id}`;
            });
        });

    } catch (err) {
        console.error('Error loading recommendations:', err);
        recommendationsSection.innerHTML = `
            <p class="empty-message">
                Failed to load recommendations. 
                <a href="/survey/" style="color:#e50914;">Complete preference survey</a> to get personalized movies!
            </p>
        `;
    }
}

// Also load popular movies as fallback
async function loadPopularMovies() {
    const section = document.getElementById('trendingMovies') || document.getElementById('topRatedMovies');
    if (!section) return;
    
    try {
        const response = await fetch('/api/recommendations/', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.movies && data.movies.length > 0) {
                // Movies already loaded by loadRecommendedSection
                return;
            }
        }
    } catch (e) {
        console.log('Recommendations not available, showing popular');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadRecommendedSection();
    loadPopularMovies();
});
