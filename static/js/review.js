// review.js
// Handles posting and displaying reviews with star ratings for movies
// Using Django backend API

async function submitReview(movieId, rating, reviewText) {
    try {
        const response = await fetch(`${DJANGO_BACKEND_URL}/api/reviews/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            credentials: 'include',
            body: JSON.stringify({
                movie_id: movieId,
                rating: rating,
                review_text: reviewText
            })
        });
        if (!response.ok) throw new Error('Failed to submit review');
        return await response.json();
    } catch (error) {
        console.error('Error submitting review:', error);
        throw error;
    }
}

async function fetchReviews(movieId) {
    try {
        const response = await fetch(`${DJANGO_BACKEND_URL}/api/reviews/?movie_id=${movieId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();
        return data.reviews || [];
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

function getCookie(name) {
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
