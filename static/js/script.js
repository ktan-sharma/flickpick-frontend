import { userManager } from './auth.js';
import { API_KEY, BASE_URL, MOVIES, TOP_100_IMDB_MOVIES } from './config.js';
import { MovieCardManager } from './movieCard.js';
import { SliderManager } from './sliderManager.js';
import { watchlistManager } from './watchlist.js';
import { ModalManager } from './modalManager.js';
import { HomePageManager } from './homePageManager.js';

class AppInitializer {
    constructor() {
        this.movieGrid = document.getElementById('movieGrid');
        this.slider = document.getElementById('movieSlider');
        this.imdbTop100Grid = document.getElementById('imdbTop100Grid');
    }

    async initialize() {
        try {
            const apiWorks = await this.testAPIConnection();
            if (!apiWorks) throw new Error('Failed to connect to movie database');

            await Promise.all([
                this.initializeSlider(),
                this.initializeMovieGrid(),
                this.initializeImdbTop100Grid()
            ]);
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.handleError(error);
        }
    }

    async testAPIConnection() {
        try {
            // Use TMDB /find endpoint with IMDb ID for connectivity test
            const response = await fetch(`${BASE_URL}find/tt0111161?api_key=${API_KEY}&external_source=imdb_id`);
            const data = await response.json();
            return data && data.movie_results && data.movie_results.length > 0;
        } catch (error) {
            console.error('API Test failed:', error);
            return false;
        }
    }

    async initializeSlider() {
        if (!this.slider) return;

        try {
            const sliderManager = new SliderManager('movieSlider');
            await sliderManager.initialize();
        } catch (error) {
            console.error('Slider initialization failed:', error);
            this.slider.innerHTML = '<div class="error">Failed to load featured movies</div>';
        }
    }

    async initializeMovieGrid() {
        if (!this.movieGrid) return;

        this.showLoading(this.movieGrid);
        try {
            const movies = await this.fetchMovies();
            MovieCardManager.populateGrid(this.movieGrid, movies);
        } catch (error) {
            console.error('Movie grid initialization failed:', error);
            this.showError(this.movieGrid, 'Failed to load movies');
        } finally {
            this.hideLoading(this.movieGrid);
        }
    }

    async initializeImdbTop100Grid() {
        if (!this.imdbTop100Grid) return;

        this.showLoading(this.imdbTop100Grid);
        try {
            const movies = await this.fetchImdbTop100Movies();
            MovieCardManager.populateGrid(this.imdbTop100Grid, movies);
        } catch (error) {
            console.error('Top 100 IMDb Movies grid initialization failed:', error);
            this.showError(this.imdbTop100Grid, 'Failed to load Top 100 IMDb Movies');
        } finally {
            this.hideLoading(this.imdbTop100Grid);
        }
    }

    async fetchMovies() {
        try {
            const popularMovieIds = MOVIES.featured.slice(0, 8);
            const movies = await Promise.all(
                popularMovieIds.map(async (movieId) => {
                    const response = await fetch(`${BASE_URL}movie/${movieId}?api_key=${API_KEY}`);
                    if (!response.ok) throw new Error('Failed to fetch movie data');
                    return response.json();
                })
            );
            return movies.filter(movie => movie && (movie.Response === "True" || movie.id));
        } catch (error) {
            console.error('Error fetching movies:', error);
            throw error;
        }
    }

    async fetchImdbTop100Movies() {
        try {
            const movies = await Promise.all(
                TOP_100_IMDB_MOVIES.slice(0, 10).map(async (movieId) => {
                    const response = await fetch(`${BASE_URL}movie/${movieId}?api_key=${API_KEY}`);
                    if (!response.ok) throw new Error('Failed to fetch movie data');
                    return response.json();
                })
            );
            return movies.filter(movie => movie && movie.id);
        } catch (error) {
            console.error('Error fetching Top 100 IMDb Movies:', error);
            throw error;
        }
    }

    showLoading(element) {
        element.classList.add('loading');
        element.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading movies...</p>
            </div>
        `;
    }

    hideLoading(element) {
        element.classList.remove('loading');
    }

    showError(element, message) {
        element.innerHTML = `
            <div class="error">
                <h3>Error Loading Content</h3>
                <p>${message}</p>
            </div>
        `;
    }

    handleError(error) {
        const errorMessage = `
            <div class="error">
                <h3>Error Loading Content</h3>
                <p>${error.message}</p>
            </div>
        `;
        if (this.movieGrid) this.movieGrid.innerHTML = errorMessage;
        if (this.imdbTop100Grid) this.imdbTop100Grid.innerHTML = errorMessage;
        if (this.slider) this.slider.innerHTML = errorMessage;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new AppInitializer();
    await app.initialize();
    new ModalManager();

    // --- SEARCH BAR FUNCTIONALITY ---
    const searchInput = document.querySelector('.search-bar input');
    const searchIcon = document.querySelector('.search-bar i');
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            handleSearch(searchInput.value.trim());
        }
    });
    searchIcon.addEventListener('click', function() {
        handleSearch(searchInput.value.trim());
    });

    async function handleSearch(query) {
        if (!query) return;
        // Search TMDB for both movies and TV shows
        const url = `${BASE_URL}search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.results && data.results.length > 0) {
                // Show results in a modal or replace main content
                showSearchResults(data.results);
            } else {
                showSearchResults([]);
            }
        } catch (err) {
            console.error('Search failed:', err);
            showSearchResults([]);
        }
    }

    function showSearchResults(results) {
        // Basic: Replace main movie grid with search results
        let main = document.querySelector('main');
        if (!main) return;
        main.innerHTML = `<section class="content-section"><h2 class="section-title">Search Results</h2><div class="movie-row" id="searchResults"></div></section>`;
        const container = document.getElementById('searchResults');
        if (!container) return;
        if (results.length === 0) {
            container.innerHTML = '<div class="error">No results found.</div>';
            return;
        }
        // Render movie/TV cards
        results.forEach(item => {
    if (item.media_type === 'movie') {
        const title = item.title || '';
        const year = (item.release_date || '').split('-')[0];
        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/240x360?text=No+Image';
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <img src="${poster}" alt="${title} Poster" class="movie-poster" onerror="this.src='https://via.placeholder.com/240x360?text=No+Image'">
            <div class="movie-info">
                <h3>${title}</h3>
                <p>${year || ''}</p>
            </div>
        `;
        // Make card clickable
        card.addEventListener('click', () => {
            window.location.href = `/movie/?id=${item.id}`;
        });
        container.appendChild(card);
    } else if (item.media_type === 'tv') {
        // Optionally render TV shows as non-clickable cards (or skip entirely)
        const title = item.name || '';
        const year = (item.first_air_date || '').split('-')[0];
        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/240x360?text=No+Image';
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${poster}" alt="${title} Poster" class="movie-poster" onerror="this.src='https://via.placeholder.com/240x360?text=No+Image'">
            <div class="movie-info">
                <h3>${title}</h3>
                <p>${year || ''}</p>
            </div>
        `;
        container.appendChild(card);
    }
});
    }

    // --- TV SHOWS NAVBAR FUNCTIONALITY ---
    const tvShowsNav = document.getElementById('tvShowsNav');
    if (tvShowsNav) {
        tvShowsNav.addEventListener('click', async (e) => {
            e.preventDefault();
            // Fetch all TV show categories in parallel
            const endpoints = {
                trending: `${BASE_URL}trending/tv/week?api_key=${API_KEY}&language=en-US`,
                topRated: `${BASE_URL}tv/top_rated?api_key=${API_KEY}&language=en-US`,
                recent: `${BASE_URL}tv/on_the_air?api_key=${API_KEY}&language=en-US`
            };
            try {
                const [trending, topRated, recent] = await Promise.all([
                    fetch(endpoints.trending).then(r => r.json()),
                    fetch(endpoints.topRated).then(r => r.json()),
                    fetch(endpoints.recent).then(r => r.json())
                ]);
                showTvShowSections({
                    trending: trending.results || [],
                    topRated: topRated.results || [],
                    recent: recent.results || []
                });
            } catch (err) {
                console.error('TV Shows fetch failed:', err);
                showTvShowSections({ trending: [], topRated: [], recent: [] });
            }
        });
    }

    function showTvShowSections(tvData) {
        let main = document.querySelector('main');
        if (!main) return;
        main.innerHTML = `
            <section class="content-section">
                <h2 class="section-title">Trending TV Shows</h2>
                <button class="scroll-btn scroll-left" data-target="trendingTvShows"><i class="fas fa-chevron-left"></i></button>
                <div class="movie-row" id="trendingTvShows"></div>
                <button class="scroll-btn scroll-right" data-target="trendingTvShows"><i class="fas fa-chevron-right"></i></button>
            </section>
            <section class="content-section">
                <h2 class="section-title">Top Rated TV Shows</h2>
                <button class="scroll-btn scroll-left" data-target="topRatedTvShows"><i class="fas fa-chevron-left"></i></button>
                <div class="movie-row" id="topRatedTvShows"></div>
                <button class="scroll-btn scroll-right" data-target="topRatedTvShows"><i class="fas fa-chevron-right"></i></button>
            </section>
            <section class="content-section">
                <h2 class="section-title">Most Recent TV Shows</h2>
                <button class="scroll-btn scroll-left" data-target="recentTvShows"><i class="fas fa-chevron-left"></i></button>
                <div class="movie-row" id="recentTvShows"></div>
                <button class="scroll-btn scroll-right" data-target="recentTvShows"><i class="fas fa-chevron-right"></i></button>
            </section>
        `;
        renderTvShowRow(tvData.trending, 'trendingTvShows');
        renderTvShowRow(tvData.topRated, 'topRatedTvShows');
        renderTvShowRow(tvData.recent, 'recentTvShows');
        setupTvSliderButtons();
    }

    function renderTvShowRow(shows, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        shows.forEach(item => {
            const title = item.name;
            const year = (item.first_air_date || '').split('-')[0];
            const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <img src="${poster}" alt="${title}" class="movie-poster">
                <div class="movie-info">
                    <h3>${title}</h3>
                    <p>${year || ''}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function setupTvSliderButtons() {
        document.querySelectorAll('.scroll-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = btn.getAttribute('data-target');
                const row = document.getElementById(targetId);
                if (!row) return;
                const scrollAmount = 400;
                if (btn.classList.contains('scroll-left')) {
                    row.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                } else {
                    row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            });
        });
    }

    new HomePageManager();
});