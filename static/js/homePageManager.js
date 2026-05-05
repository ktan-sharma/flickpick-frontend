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

export class HomePageManager {
    constructor() {
        this.initializeHeader();
        this.loadHeroBannerMovie(); // Load random hero movie
        this.loadMovieSections();
        this.setupScrollButtons();
    }

    initializeHeader() {
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.main-header');
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    async fetchMoviesForSection(section) {
        const movieIds = {
            popularMovies: [
                'tt0111161', 'tt0068646', 'tt0071562', 'tt0468569',
                'tt0050083', 'tt0108052', 'tt0167260', 'tt0110912',
                'tt0060196', 'tt0120737', 'tt0109830', 'tt0137523',
                'tt1375666', 'tt0081505', 'tt0120586', 'tt0172495', 'tt0120338',
                'tt0114709', 'tt0114814', 'tt0107290', 'tt0099685', 'tt0112573',
                'tt0119217', 'tt0133093', 'tt0169547', 'tt0105236', 'tt0120815'
            ],
            trendingMovies: [
                'tt0133093', 'tt0167261', 'tt0080684', 'tt0073486',
                'tt0099685', 'tt0076759', 'tt0047478', 'tt0114369',
                'tt0102926', 'tt0317248', 'tt0038650', 'tt0118799',
                'tt0113277', 'tt0109830', 'tt0120737', 'tt0120815', 'tt0110357',
                'tt0110413', 'tt0120689', 'tt0108052', 'tt0111161', 'tt0110912',
                'tt0114814', 'tt0137523', 'tt0167260', 'tt0112573', 'tt0114709'
            ],
            topRatedMovies: [
                'tt0088763', 'tt0245429', 'tt0064116', 'tt0120815',
                'tt0047396', 'tt0816692', 'tt0120689', 'tt0021749',
                'tt0054215', 'tt0103064', 'tt0110357', 'tt0027977',
                'tt0111161', 'tt0068646', 'tt0071562', 'tt0468569', 'tt0050083',
                'tt0108052', 'tt0167260', 'tt0110912', 'tt0060196', 'tt0120737',
                'tt0109830', 'tt0137523', 'tt1375666', 'tt0081505', 'tt0120586'
            ],
            actionMovies: [
                'tt2911666', 'tt4154796', 'tt0110413', 'tt0468569', 'tt0848228', 'tt1877830', 'tt3896198', 'tt1375666', 'tt0816692', 'tt4154756', 'tt0110912', 'tt0107290', 'tt0133093', 'tt0120737', 'tt0114369', 'tt4154756'
            ],
            comedyMovies: [
                'tt0107048', 'tt0110912', 'tt0109830', 'tt0103639', 'tt0088763', 'tt0114709', 'tt0108052', 'tt0120338', 'tt0112573', 'tt0102926', 'tt0118715', 'tt0109686', 'tt0110357', 'tt0107048', 'tt0088763', 'tt0109830'
            ],
            familyMovies: [
                'tt0110357', 'tt0107290', 'tt0114709', 'tt0111161', 'tt0110912', 'tt0118799', 'tt0120737', 'tt0109830', 'tt0103639', 'tt0114709', 'tt0110357', 'tt0111161', 'tt0110912', 'tt0118799', 'tt0120737'
            ]
        };

        try {
            const movies = await Promise.all(
                movieIds[section].map(async imdbId => {
                    // Use TMDB's /find endpoint to get TMDB movie by IMDb ID
                    const tmdbFindUrl = `${BASE_URL}find/${imdbId}?api_key=${API_KEY}&language=en-US&external_source=imdb_id`;
                    const response = await fetch(tmdbFindUrl);
                    const data = await response.json();
                    // TMDB returns results in movie_results array
                    if (data && data.movie_results && data.movie_results.length > 0) {
                        const movie = data.movie_results[0];
                        // Adapt TMDB data to OMDB-like structure for compatibility
                        const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/240x360?text=No+Image';
                        return {
                            imdbID: imdbId,
                            id: movie.id,
                            Title: movie.title,
                            Poster: posterUrl,
                            Year: movie.release_date ? movie.release_date.split('-')[0] : '',
                            imdbRating: movie.vote_average ? (movie.vote_average / 2).toFixed(1) : 'N/A',
                            Genre: '', // TMDB /find does not include genres
                            Runtime: '', // Not available here
                            Plot: movie.overview,
                            Director: '', // Not available here
                            Writer: '', // Not available here
                            Actors: '', // Not available here
                        };
                    }
                    return null;
                })
            );
            return movies.filter(movie => movie !== null);
        } catch (error) {
            console.error(`Error fetching ${section}:`, error);
            return [];
        }
    }

    async loadHeroBannerMovie() {
        // Use the popularMovies list to fetch a random movie
        const movieIds = [
            'tt0111161', 'tt0068646', 'tt0071562', 'tt0468569',
            'tt0050083', 'tt0108052', 'tt0167260', 'tt0110912',
            'tt0060196', 'tt0120737', 'tt0109830', 'tt0137523',
            'tt1375666', 'tt0081505', 'tt0120586', 'tt0172495', 'tt0120338',
            'tt0114709', 'tt0114814', 'tt0107290', 'tt0099685', 'tt0112573',
            'tt0119217', 'tt0133093', 'tt0169547', 'tt0105236', 'tt0120815'
        ];
        const randomId = movieIds[Math.floor(Math.random() * movieIds.length)];
        try {
            const tmdbFindUrl = `${BASE_URL}find/${randomId}?api_key=${API_KEY}&language=en-US&external_source=imdb_id`;
            const response = await fetch(tmdbFindUrl);
            const data = await response.json();
            if (data && data.movie_results && data.movie_results.length > 0) {
                const m = data.movie_results[0];
                // Set hero banner background, title, and description
                const heroBg = document.querySelector('.hero-bg');
                const heroTitle = document.querySelector('.hero-title');
                const heroDesc = document.querySelector('.hero-desc');
                const moreInfoBtn = document.querySelector('.hero-btn.info');
                const playBtn = document.getElementById('heroPlayBtn');
                if (heroBg && heroTitle && heroDesc) {
                    const bgUrl = m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : 
                                  m.poster_path ? `https://image.tmdb.org/t/p/original${m.poster_path}` : '';
                    heroBg.style.backgroundImage = bgUrl ? `url('${bgUrl}')` : 'none';
                    heroTitle.textContent = m.title;
                    heroDesc.textContent = m.overview;
                }
                // Update Play button's data-title attribute
                if (playBtn) {
                    playBtn.setAttribute('data-title', m.title);
                }
                // Store the imdbID in a data attribute for the More Info button
                if (moreInfoBtn) {
                    moreInfoBtn.dataset.imdbId = randomId;
                    moreInfoBtn.onclick = () => {
                        window.location.href = `/movie/?id=${randomId}`;
                    };
                }
            }
        } catch (error) {
            console.error('Failed to load hero banner movie:', error);
        }
    }

    renderMovieRow(sectionId, movies) {
        const container = document.getElementById(sectionId);
        if (!container) return;

        if (!movies || movies.length === 0) {
            container.innerHTML = '<p class="empty-message">No movies found</p>';
            return;
        }

        container.innerHTML = movies.map(movie => {
            const genres = movie.Genre ? movie.Genre.split(',').map(g => g.trim()).filter(g => g) : [];
            const posterUrl = fixPosterUrl(movie.Poster);
            return `
            <div class="movie-card" data-id="${movie.imdbID || movie.id}">
                <a href="/movie/?id=${movie.imdbID || movie.id}">
                    <div class="movie-card-inner">
                        <img src="${posterUrl}" alt="${movie.Title}"
                            onerror="this.src='https://via.placeholder.com/240x360?text=No+Image'">
                        <div class="movie-info">
                            <h3>${movie.Title}</h3>
                            <div class="movie-meta">
                                <span class="movie-year">${movie.Year}</span>
                                <span class="movie-rating">
                                    <i class="fas fa-star"></i> ${movie.imdbRating}
                                </span>
                            </div>
                            <div class="movie-genres">
                                ${genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        `}).join('');
    }

    async loadFeaturedContent() {
        try {
            const featuredId = 'tt0468569'; // The Dark Knight as example
            // Use TMDB /find endpoint to get TMDB movie by IMDb ID
            const tmdbFindUrl = `${BASE_URL}find/${featuredId}?api_key=${API_KEY}&language=en-US&external_source=imdb_id`;
            const response = await fetch(tmdbFindUrl);
            const data = await response.json();
            let movie = null;
            if (data && data.movie_results && data.movie_results.length > 0) {
                const m = data.movie_results[0];
                const posterUrl = m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/240x360?text=No+Image';
                movie = {
                    Title: m.title,
                    Plot: m.overview,
                    Poster: posterUrl,
                    Year: m.release_date ? m.release_date.split('-')[0] : '',
                    imdbRating: m.vote_average ? (m.vote_average / 2).toFixed(1) : 'N/A',
                };
            }
            const featured = document.getElementById('featuredMovie');
            if (featured && movie) {
                featured.innerHTML = `
                    <div class="featured-details">
                        <h2 class="featured-title">${movie.Title}</h2>
                        <p class="featured-description">${movie.Plot}</p>
                        <div class="featured-actions">
                            <button class="play-btn">
                                <i class="fas fa-play"></i> Play Trailer
                            </button>
                        </div>
                    </div>
                    <img class="featured-poster" src="${movie.Poster}" alt="${movie.Title}">
                `;
            }
        } catch (error) {
            console.error('Failed to load featured content:', error);
        }
    }

    async loadMovieSections() {
        // Load all movie sections (popularMovies is handled by recommended.js for personalized content)
        const sections = [
            'trendingMovies', 'topRatedMovies', 'actionMovies', 'comedyMovies', 'familyMovies'
        ];
        for (const section of sections) {
            try {
                const movies = await this.fetchMoviesForSection(section);
                this.renderMovieRow(section, movies);
            } catch (error) {
                console.error(`Error loading ${section}:`, error);
                const container = document.getElementById(section);
                if (container) {
                    container.innerHTML = '<p class="error">Failed to load movies</p>';
                }
            }
        }
    }

    setupScrollButtons() {
        document.querySelectorAll('.content-section').forEach(section => {
            const movieRow = section.querySelector('.movie-row');
            const leftBtn = section.querySelector('.scroll-left');
            const rightBtn = section.querySelector('.scroll-right');

            if (leftBtn && rightBtn && movieRow) {
                leftBtn.addEventListener('click', () => {
                    movieRow.scrollBy({
                        left: -800,
                        behavior: 'smooth'
                    });
                });

                rightBtn.addEventListener('click', () => {
                    movieRow.scrollBy({
                        left: 800,
                        behavior: 'smooth'
                    });
                });
            }
        });
    }
}