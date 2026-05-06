export const API_KEY = '5e338db773fdec4213f2c68748ff8d36';
export const BASE_URL = 'https://api.themoviedb.org/3/';

// Django Backend API URL
// Update this with your actual Django backend URL when deployed
export const DJANGO_BACKEND_URL = 'https://flickpick.onrender.com'; // Your Django backend URL
// Local development: 'http://localhost:8000'

export const MOVIES = {
    featured: [
        '278', // The Shawshank Redemption (TMDB ID)
        '238', // The Godfather
        '155', // The Dark Knight
        '122', // The Lord of the Rings: The Return of the King
        '550'  // Fight Club
    ]
};

// Top 100 TMDB Movie IDs (replace with actual TMDB IDs if needed)
export const TOP_100_IMDB_MOVIES = [
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
    '278', '238', '240', '155', '389', '424', '680', '13', '122', '550',
];

export async function validateAPIKey() {
    try {
        const response = await fetch(`${BASE_URL}movie/${MOVIES.featured[0]}?api_key=${API_KEY}`);
        const data = await response.json();
        return response.ok && data && data.id;
    } catch (error) {
        console.error('API validation failed:', error);
        return false;
    }
}