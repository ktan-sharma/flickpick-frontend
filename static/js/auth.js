// Helper function to get CSRF token from cookies
function getCsrfToken() {
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

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.dropdownOpen = false;
        this.initializeAuth();
    }

    initializeAuth() {
        this.setupEventListeners();
        this.loadCurrentUser();
    }

    async loadCurrentUser() {
        console.log('[Auth] Loading current user...');
        try {
            const response = await fetch('/api/get_current_user/', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.id) {
                    this.currentUser = data;
                    
                    // Check if user needs to complete survey
                    if (!data.has_completed_survey && window.location.pathname !== '/survey/') {
                        console.log('[Auth] User needs to complete survey, redirecting...');
                        window.location.href = '/survey/';
                        return;
                    }
                    
                    this.updateUI();
                    console.log('[Auth] User loaded:', data);
                } else {
                    this.updateUI();
                }
            } else {
                this.updateUI();
            }
        } catch (error) {
            console.error('[Auth] Error loading current user:', error);
            this.currentUser = null;
            this.updateUI();
        }
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = '/login/';
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                window.location.href = '/register/';
            });
        }

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('navProfileDropdown');
            const icon = document.getElementById('navProfileIcon');
            if (this.dropdownOpen && dropdown && icon && !dropdown.contains(e.target) && !icon.contains(e.target)) {
                dropdown.style.display = 'none';
                this.dropdownOpen = false;
            }
        });
    }

    createProfileIcon() {
        console.log('[Auth] Creating profile icon...');
        const authArea = document.getElementById('navbarAuthArea');
        if (!authArea) {
            console.error('[Auth] navbarAuthArea not found!');
            return;
        }

        // Hide login/register buttons
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';

        // Remove any existing profile icon to prevent duplicates
        const existing = document.getElementById('navProfileIcon');
        if (existing) existing.remove();
        const existingDropdown = document.getElementById('navProfileDropdown');
        if (existingDropdown) existingDropdown.remove();

        const displayName = this.currentUser.name || this.currentUser.username || 'U';
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const hasProfilePic = this.currentUser.profile_picture;

        const iconHtml = `
            <div id="navProfileIcon" style="position:relative; cursor:pointer; margin-left:1rem;">
                ${hasProfilePic
                    ? `<img src="${this.currentUser.profile_picture}" alt="Profile" style="width:40px; height:40px; object-fit:cover; border-radius:50%; border:2px solid #fff;">`
                    : `<span style="display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:50%; background:#444; color:#fff; font-weight:bold; font-size:1.1rem;">${initials}</span>`
                }
            </div>
            <div id="navProfileDropdown" class="profile-dropdown">
                <a href="/profile/" class="profile-menu-item">My Profile</a>
                <div class="profile-menu-divider"></div>
                <a href="/watchlist/" class="profile-menu-item">My Watchlist</a>
                <div class="profile-menu-divider"></div>
                <div class="profile-menu-item" id="navLogoutBtn" style="cursor:pointer;">Logout</div>
            </div>
        `;

        authArea.insertAdjacentHTML('beforeend', iconHtml);

        // Toggle dropdown on icon click
        const icon = document.getElementById('navProfileIcon');
        if (icon) {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('[Auth] Profile icon clicked');
                const dropdown = document.getElementById('navProfileDropdown');
                if (dropdown) {
                    this.dropdownOpen = !this.dropdownOpen;
                    dropdown.style.display = this.dropdownOpen ? 'block' : 'none';
                    console.log('[Auth] Dropdown toggled:', this.dropdownOpen ? 'open' : 'closed');
                } else {
                    console.error('[Auth] Dropdown element not found!');
                }
            });
        } else {
            console.error('[Auth] Profile icon element not found!');
        }

        // Logout handler
        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                console.log('[Auth] Logout clicked');
                await this.logout();
            });
        } else {
            console.error('[Auth] Logout button not found!');
        }
    }

    async logout() {
        console.log('[Auth] Logging out...');
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/api/logout/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            });

            if (response.ok) {
                console.log('[Auth] Logout successful');
                this.currentUser = null;
                this.updateUI();
                window.location.href = '/';
            } else {
                console.error('[Auth] Logout failed:', response.status);
            }
        } catch (error) {
            console.error('[Auth] Logout error:', error);
        }
    }

    updateUI() {
        console.log('[Auth] Updating UI, user:', this.currentUser);
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');

        if (this.currentUser && this.currentUser.id) {
            console.log('[Auth] User logged in, showing profile');
            // Hide login/register buttons
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';

            // Create profile icon with dropdown
            this.createProfileIcon();
        } else {
            console.log('[Auth] No user, showing login/register');
            // Show login/register buttons
            if (loginBtn) loginBtn.style.display = '';
            if (registerBtn) registerBtn.style.display = '';

            // Remove profile icon and dropdown
            const icon = document.getElementById('navProfileIcon');
            if (icon) icon.remove();
            const dropdown = document.getElementById('navProfileDropdown');
            if (dropdown) dropdown.remove();
        }
    }
}

export const userManager = new AuthManager();