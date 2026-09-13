/* ==========================================================================
   EventSphere - Main Frontend Utilities & Shared API Client
   ========================================================================== */

const API_BASE = '/api';

// Auth State Management (Strict Tab-Isolated Multi-Role Session Support)
function getToken() {
    return sessionStorage.getItem('eventsphere_token');
}

function getUser() {
    const userStr = sessionStorage.getItem('eventsphere_user');
    return userStr ? JSON.parse(userStr) : null;
}

function setAuth(token, user) {
    sessionStorage.setItem('eventsphere_token', token);
    sessionStorage.setItem('eventsphere_user', JSON.stringify(user));
}

function clearAuth() {
    sessionStorage.removeItem('eventsphere_token');
    sessionStorage.removeItem('eventsphere_user');
    localStorage.removeItem('eventsphere_token');
    localStorage.removeItem('eventsphere_user');
}

function isLoggedIn() {
    return !!getToken();
}

function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
}

function isOrganiser() {
    const user = getUser();
    return user && user.role === 'organiser';
}

function isOrganiserOrAdmin() {
    const user = getUser();
    return user && (user.role === 'admin' || user.role === 'organiser');
}

// Redirect Protection Guards
function requireAuth() {
    if (!isLoggedIn()) {
        showToast('Please log in to continue', 'warning');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1200);
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!isLoggedIn()) {
        showToast('Authentication required. Please log in.', 'warning');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1000);
        return false;
    }
    if (!isOrganiserOrAdmin()) {
        showToast('Access Denied: Organiser or Admin privileges required', 'error');
        setTimeout(() => {
            window.location.href = '/events.html';
        }, 1500);
        return false;
    }
    return true;
}

// Global API Fetch Helper
async function apiRequest(endpoint, method = 'GET', data = null, requiresToken = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (requiresToken) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const config = {
        method,
        headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.message || `API Error (${response.status})`);
        }

        return json;
    } catch (err) {
        console.error(`[API Error ${method} ${endpoint}]:`, err.message);
        throw err;
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✔';
    if (type === 'error') icon = '✖';
    if (type === 'warning') icon = '⚠';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// INR Currency Formatting
function formatINR(amount) {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val);
}

// Date Formatting
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatTime(timeStr) {
    return timeStr || '';
}

function getEventStartDateTime(dateStr, timeStr) {
    if (!dateStr) return new Date();

    const d = new Date(dateStr);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();

    let hours = 23;
    let minutes = 59;

    if (timeStr) {
        let clean = timeStr.trim().toUpperCase();
        if (clean.includes('AM') || clean.includes('PM')) {
            const isPM = clean.includes('PM');
            const parts = clean.replace(/AM|PM/g, '').trim().split(':');
            let h = parseInt(parts[0], 10) || 0;
            const m = parseInt(parts[1], 10) || 0;
            if (isPM && h < 12) h += 12;
            if (!isPM && h === 12) h = 0;
            hours = h;
            minutes = m;
        } else {
            const parts = clean.split(':');
            hours = parseInt(parts[0], 10) || 0;
            minutes = parseInt(parts[1], 10) || 0;
        }
    }

    return new Date(year, month, day, hours, minutes, 0);
}

// Dynamic Header Navigation Renderer
function renderNavbar() {
    const navUserContainer = document.getElementById('nav-user-container');
    
    if (!navUserContainer) return;

    const user = getUser();

    if (user) {
        // Hide Home navigation link for logged-in users
        document.querySelectorAll('.nav-links a[href*="index.html"]').forEach(link => {
            if (link.parentElement && link.parentElement.tagName === 'LI') {
                link.parentElement.style.display = 'none';
            } else {
                link.style.display = 'none';
            }
        });

        navUserContainer.innerHTML = `
            <div class="user-badge">Hi, <strong>${user.name.split(' ')[0]}</strong></div>
            <button onclick="openProfileModal(event)" class="btn btn-secondary btn-sm">Profile</button>
            <button id="logout-btn" class="btn btn-danger btn-sm">Logout</button>
        `;

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            clearAuth();
            showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        });
    } else {
        navUserContainer.innerHTML = `
            <a href="/login.html" class="btn btn-secondary btn-sm">Login</a>
            <a href="/register.html" class="btn btn-primary btn-sm">Register</a>
        `;
    }
}

// Profile Modal Popup Management
function initProfileModal() {
    if (document.getElementById('profile-modal-overlay')) return;

    const modalHTML = `
        <div id="profile-modal-overlay" class="modal-overlay" onclick="closeProfileModal()" style="display: none;">
            <div class="modal-card" onclick="event.stopPropagation()">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <h3 style="margin:0; font-family:var(--font-heading, sans-serif); color:var(--text-primary, #f8fafc);">User Profile</h3>
                    <button class="modal-close" onclick="closeProfileModal()" style="background:transparent; border:none; color:var(--text-muted, #94a3b8); font-size:1.5rem; cursor:pointer; line-height:1;">&times;</button>
                </div>
                <form id="modal-profile-form">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display:block; margin-bottom:0.4rem; font-size:0.85rem; color:var(--text-secondary, #94a3b8);">Full Name</label>
                        <input type="text" id="modal-profile-name" class="form-control" required style="width:100%;">
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display:block; margin-bottom:0.4rem; font-size:0.85rem; color:var(--text-secondary, #94a3b8);">Email Address (Read-only)</label>
                        <input type="email" id="modal-profile-email" class="form-control" readonly style="width:100%; opacity: 0.7; cursor: not-allowed;">
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display:block; margin-bottom:0.4rem; font-size:0.85rem; color:var(--text-secondary, #94a3b8);">Phone Number</label>
                        <input type="tel" id="modal-profile-phone" class="form-control" required style="width:100%;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="display:block; margin-bottom:0.4rem; font-size:0.85rem; color:var(--text-secondary, #94a3b8);">Account Role</label>
                            <input type="text" id="modal-profile-role" class="form-control" readonly style="width:100%; opacity: 0.7; text-transform: capitalize;">
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="display:block; margin-bottom:0.4rem; font-size:0.85rem; color:var(--text-secondary, #94a3b8);">Member Since</label>
                            <input type="text" id="modal-profile-created" class="form-control" readonly style="width:100%; opacity: 0.7;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary" onclick="closeProfileModal()">Cancel</button>
                        <button type="submit" id="modal-profile-submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('modal-profile-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('modal-profile-name').value.trim();
        const phone = document.getElementById('modal-profile-phone').value.trim();

        if (!name || !phone) {
            showToast('Name and Phone are required', 'error');
            return;
        }

        const submitBtn = document.getElementById('modal-profile-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const res = await apiRequest('/auth/profile', 'PUT', { name, phone }, true);
            if (res.success && res.user) {
                const currentAuth = getUser();
                setAuth(getToken(), { ...currentAuth, ...res.user });
                renderNavbar();
                showToast('Profile updated successfully!', 'success');
                closeProfileModal();
            }
        } catch (err) {
            showToast(err.message || 'Failed to update profile', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
        }
    });
}

async function openProfileModal(e) {
    if (e) e.preventDefault();
    initProfileModal();

    try {
        const res = await apiRequest('/auth/me', 'GET', null, true);
        if (res.success && res.user) {
            const u = res.user;
            if (document.getElementById('modal-profile-name')) document.getElementById('modal-profile-name').value = u.name || '';
            if (document.getElementById('modal-profile-email')) document.getElementById('modal-profile-email').value = u.email || '';
            if (document.getElementById('modal-profile-phone')) document.getElementById('modal-profile-phone').value = u.phone || '';
            if (document.getElementById('modal-profile-role')) document.getElementById('modal-profile-role').value = u.role || '';
            if (document.getElementById('modal-profile-created')) document.getElementById('modal-profile-created').value = formatDate(u.createdAt);

            const overlay = document.getElementById('profile-modal-overlay');
            if (overlay) overlay.style.display = 'flex';
        }
    } catch (err) {
        showToast('Please log in to view profile', 'error');
    }
}

function closeProfileModal() {
    const overlay = document.getElementById('profile-modal-overlay');
    if (overlay) overlay.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    const path = window.location.pathname;

    // Prevent logged in users from seeing the HOME page (index.html)
    if (user && (path === '/' || path.endsWith('/index.html') || path.endsWith('/index'))) {
        if (user.role === 'admin') {
            window.location.href = '/admin/users.html';
        } else if (user.role === 'organiser') {
            window.location.href = '/admin/dashboard.html';
        } else {
            window.location.href = '/events.html';
        }
        return;
    }

    renderNavbar();

    // Attach profile modal click handler to any profile link on page
    document.querySelectorAll('a[href*="profile.html"]').forEach(link => {
        link.addEventListener('click', (e) => openProfileModal(e));
    });
});
