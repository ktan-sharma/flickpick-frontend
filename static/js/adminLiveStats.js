// adminLiveStats.js
// Fetch and update live stats for admin dashboard (users, reviews) from backend API

export async function updateAdminLiveStats() {
    try {
        const response = await fetch('/api/admin/stats/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load stats');
        }

        const stats = await response.json();
        const userCount = stats.users || 0;
        const reviewCount = stats.reviews || 0;
        
        console.log('[adminLiveStats] User count:', userCount);
        console.log('[adminLiveStats] Review count:', reviewCount);
        // Update stat cards
        const statUsers = document.getElementById('statUsers');
        if (statUsers) statUsers.textContent = userCount;
        const statReviews = document.getElementById('statReviews');
        if (statReviews) statReviews.textContent = reviewCount;

        // Optionally, update the overview tab if it renders counts directly (robustness)
        const overview = document.getElementById('overview');
        if (overview) {
            // Try to update numbers in the overview if present
            const userStat = overview.querySelector('.stat-card .stat-value#statUsers');
            if (userStat) userStat.textContent = userCount;
            const reviewStat = overview.querySelector('.stat-card .stat-value#statReviews');
            if (reviewStat) reviewStat.textContent = reviewCount;
        }
    } catch (e) {
        console.error('Error loading live stats:', e);
    }
}


// Optionally, auto-update every X seconds (uncomment below to enable polling)
// setInterval(updateAdminLiveStats, 15000); // every 15 seconds
