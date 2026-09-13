/* Admin Dashboard, Management & Analytics Script */

let revenueChart = null;
let categoryChart = null;

document.addEventListener('DOMContentLoaded', () => {
    // Adapt sidebar & navigation badges based on role
    if (isOrganiser()) {
        const userNavLinks = document.querySelectorAll('a[href="users.html"]');
        userNavLinks.forEach(link => link.style.display = 'none');

        const logoBadges = document.querySelectorAll('.logo-badge');
        logoBadges.forEach(b => {
            b.textContent = 'ORGANISER';
            b.style.background = 'var(--primary)';
        });
    } else if (isAdmin()) {
        const createEventNavLinks = document.querySelectorAll('a[href="create-event.html"]');
        createEventNavLinks.forEach(link => link.style.display = 'none');
    }

    // Determine active admin view from page URL
    const path = window.location.pathname;

    if (path.includes('/admin/login.html')) {
        setupAdminLoginForm();
        return;
    }

    // Require Organiser or Admin role on all other admin pages
    if (!requireAdmin()) return;

    if (path.includes('create-event.html') && isAdmin()) {
        showToast('Admins cannot create events. Only Organisers can add events.', 'warning');
        setTimeout(() => window.location.href = '/admin/dashboard.html', 1000);
        return;
    }

    if (path.includes('dashboard.html')) {
        loadAdminDashboard();
    } else if (path.includes('events.html') && !path.includes('event-details.html')) {
        loadAdminEvents();
    } else if (path.includes('create-event.html')) {
        setupCreateEventForm();
    } else if (path.includes('bookings.html')) {
        loadAdminBookings();
    } else if (path.includes('users.html')) {
        loadAdminUsers();
    } else if (path.includes('event-details.html')) {
        loadEventSpecificAnalytics();
    }
});

// Admin Login Form
function setupAdminLoginForm() {
    const form = document.getElementById('admin-login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;

        try {
            const res = await apiRequest('/auth/login', 'POST', { email, password });
            if (res.success && res.user.role === 'admin') {
                setAuth(res.token, res.user);
                showToast('Admin Authentication Successful!', 'success');
                setTimeout(() => window.location.href = '/admin/dashboard.html', 1000);
            } else {
                showToast('403 Forbidden: You do not have administrator permissions', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Invalid admin credentials', 'error');
        }
    });
}

// 1. Admin Dashboard Stats & Chart.js Visualizations
async function loadAdminDashboard() {
    // Hide Total Users and Total Organizers stat cards for Organiser role
    if (isOrganiser()) {
        const usersCard = document.getElementById('metric-card-users');
        if (usersCard) usersCard.style.display = 'none';
        const orgsCard = document.getElementById('metric-card-organisers');
        if (orgsCard) orgsCard.style.display = 'none';
    }

    try {
        const [statsRes, analyticsRes] = await Promise.all([
            apiRequest('/admin/dashboard', 'GET', null, true),
            apiRequest('/admin/analytics', 'GET', null, true)
        ]);

        if (statsRes.success && statsRes.stats) {
            const s = statsRes.stats;
            if (document.getElementById('stat-total-events')) document.getElementById('stat-total-events').textContent = s.totalEvents;
            if (document.getElementById('stat-total-users')) document.getElementById('stat-total-users').textContent = s.totalUsers;
            if (document.getElementById('stat-total-organisers')) document.getElementById('stat-total-organisers').textContent = s.totalOrganisers || 0;
            if (document.getElementById('stat-total-bookings')) document.getElementById('stat-total-bookings').textContent = s.totalBookings;
            if (document.getElementById('stat-tickets-sold')) document.getElementById('stat-tickets-sold').textContent = s.totalTicketsSold.toLocaleString('en-IN');
            if (document.getElementById('stat-total-revenue')) document.getElementById('stat-total-revenue').textContent = formatINR(s.totalRevenue);
            if (document.getElementById('stat-upcoming-events')) document.getElementById('stat-upcoming-events').textContent = s.upcomingEvents;

            renderRecentBookingsTable(statsRes.recentBookings || []);
        }

        if (analyticsRes.success) {
            setupDropdownAnalytics(analyticsRes.revenueByEvent || [], analyticsRes.ticketsByCategory || []);
        }
    } catch (err) {
        showToast('Failed to load dashboard metrics', 'error');
    }
}

function renderRecentBookingsTable(recentBookings) {
    const tableBody = document.getElementById('recent-bookings-tbody');
    if (!tableBody) return;

    if (recentBookings.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No recent bookings</td></tr>`;
        return;
    }

    tableBody.innerHTML = recentBookings.map(b => `
        <tr>
            <td>${b.user ? b.user.name : 'Unknown User'}</td>
            <td>${b.event ? b.event.title : 'Deleted Event'}</td>
            <td>${b.ticketCount} ticket(s)</td>
            <td style="font-weight:700; color:var(--success);">${formatINR(b.amount)}</td>
            <td><span class="badge ${b.bookingStatus === 'Confirmed' ? 'badge-upcoming' : 'badge-cancelled'}">${b.bookingStatus || 'Confirmed'}</span></td>
            <td>${formatDate(b.bookingDate)}</td>
        </tr>
    `).join('');
}

function initCustomSelect(selectEl) {
    if (!selectEl) return;
    
    selectEl.style.display = 'none';

    const existing = selectEl.parentElement.querySelector('.custom-dropdown');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-dropdown';

    const optionsArr = Array.from(selectEl.options);
    const selectedOpt = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
    const initialLabel = selectedOpt ? selectedOpt.textContent : 'Select Option';

    let optionsHTML = optionsArr.map(opt => {
        const isSelected = opt.value === selectEl.value;
        return `
            <div class="custom-dropdown-option ${isSelected ? 'selected' : ''}" data-value="${opt.value}">
                <span>${opt.textContent}</span>
                <span class="check-mark">✓</span>
            </div>
        `;
    }).join('');

    wrapper.innerHTML = `
        <div class="custom-dropdown-trigger">
            <span class="custom-dropdown-label">${initialLabel}</span>
            <span class="custom-dropdown-arrow">▼</span>
        </div>
        <div class="custom-dropdown-menu">
            ${optionsHTML}
        </div>
    `;

    selectEl.parentElement.appendChild(wrapper);

    const trigger = wrapper.querySelector('.custom-dropdown-trigger');
    const label = wrapper.querySelector('.custom-dropdown-label');

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d !== wrapper) d.classList.remove('open');
        });
        wrapper.classList.toggle('open');
    });

    wrapper.querySelectorAll('.custom-dropdown-option').forEach(optEl => {
        optEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = optEl.getAttribute('data-value');
            selectEl.value = val;
            
            label.textContent = optEl.querySelector('span').textContent;

            wrapper.querySelectorAll('.custom-dropdown-option').forEach(o => o.classList.remove('selected'));
            optEl.classList.add('selected');

            wrapper.classList.remove('open');

            if (typeof selectEl.onchange === 'function') {
                selectEl.onchange();
            }
            selectEl.dispatchEvent(new Event('change'));
        });
    });
}

document.addEventListener('click', () => {
    document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
});

function setupDropdownAnalytics(revenueByEvent, ticketsByCategory) {
    // 1. Revenue by Event Dropdown Handler
    const revSelect = document.getElementById('revenue-event-select');
    const revDetails = document.getElementById('revenue-event-details');
    const revEmpty = document.getElementById('revenue-event-empty');

    if (revSelect) {
        if (revenueByEvent.length === 0) {
            revSelect.innerHTML = `<option value="">-- No Events Available --</option>`;
            if (revDetails) revDetails.style.display = 'none';
            if (revEmpty) revEmpty.style.display = 'block';
            initCustomSelect(revSelect);
        } else {
            const totalAllRevenue = revenueByEvent.reduce((sum, item) => sum + (item.revenue || 0), 0);
            const totalAllTickets = revenueByEvent.reduce((sum, item) => sum + (item.ticketsSold || 0), 0);

            revSelect.innerHTML = `<option value="all">All Events</option>` +
                revenueByEvent.map((item, index) => `<option value="${index}">${item.title}</option>`).join('');

            revSelect.onchange = () => {
                const val = revSelect.value;
                if (val === 'all') {
                    document.getElementById('event-detail-title').textContent = 'All Events';
                    document.getElementById('event-detail-revenue').textContent = formatINR(totalAllRevenue);
                    document.getElementById('event-detail-tickets').textContent = `${totalAllTickets} ticket(s)`;
                    if (revEmpty) revEmpty.style.display = 'none';
                    if (revDetails) revDetails.style.display = 'block';
                } else if (val === '' || !revenueByEvent[val]) {
                    if (revDetails) revDetails.style.display = 'none';
                    if (revEmpty) revEmpty.style.display = 'block';
                } else {
                    const item = revenueByEvent[val];
                    document.getElementById('event-detail-title').textContent = item.title;
                    document.getElementById('event-detail-revenue').textContent = formatINR(item.revenue || 0);
                    document.getElementById('event-detail-tickets').textContent = `${item.ticketsSold || 0} ticket(s)`;
                    if (revEmpty) revEmpty.style.display = 'none';
                    if (revDetails) revDetails.style.display = 'block';
                }
            };

            // Auto-select "All Events" by default and initialize custom dropdown
            revSelect.value = "all";
            revSelect.onchange();
            initCustomSelect(revSelect);
        }
    }

    // 2. Sales by Category Dropdown Handler
    const catSelect = document.getElementById('sales-category-select');
    const catDetails = document.getElementById('sales-category-details');
    const catEmpty = document.getElementById('sales-category-empty');

    if (catSelect) {
        if (ticketsByCategory.length === 0) {
            catSelect.innerHTML = `<option value="">-- No Categories Available --</option>`;
            if (catDetails) catDetails.style.display = 'none';
            if (catEmpty) catEmpty.style.display = 'block';
            initCustomSelect(catSelect);
        } else {
            const totalAllCatRevenue = ticketsByCategory.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
            const totalAllCatTickets = ticketsByCategory.reduce((sum, item) => sum + (item.totalTickets || 0), 0);

            catSelect.innerHTML = `<option value="all">All Categories</option>` +
                ticketsByCategory.map((item, index) => `<option value="${index}">${item._id || 'Uncategorized'}</option>`).join('');

            catSelect.onchange = () => {
                const val = catSelect.value;
                if (val === 'all') {
                    document.getElementById('category-detail-name').textContent = 'All Categories';
                    document.getElementById('category-detail-revenue').textContent = formatINR(totalAllCatRevenue);
                    document.getElementById('category-detail-tickets').textContent = `${totalAllCatTickets} ticket(s)`;
                    if (catEmpty) catEmpty.style.display = 'none';
                    if (catDetails) catDetails.style.display = 'block';
                } else if (val === '' || !ticketsByCategory[val]) {
                    if (catDetails) catDetails.style.display = 'none';
                    if (catEmpty) catEmpty.style.display = 'block';
                } else {
                    const item = ticketsByCategory[val];
                    document.getElementById('category-detail-name').textContent = item._id || 'Uncategorized';
                    document.getElementById('category-detail-revenue').textContent = formatINR(item.totalRevenue || 0);
                    document.getElementById('category-detail-tickets').textContent = `${item.totalTickets || 0} ticket(s)`;
                    if (catEmpty) catEmpty.style.display = 'none';
                    if (catDetails) catDetails.style.display = 'block';
                }
            };

            // Auto-select "All Categories" by default and initialize custom dropdown
            catSelect.value = "all";
            catSelect.onchange();
            initCustomSelect(catSelect);
        }
    }
}

// 2. Admin Events Table & Management
async function loadAdminEvents() {
    const tableBody = document.getElementById('admin-events-tbody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Loading events...</td></tr>`;

    try {
        const res = await apiRequest('/events?sort=newest', 'GET', null, true);
        if (res.success) {
            const events = res.events || [];
            if (events.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No events available. <a href="/admin/create-event.html">Create One</a></td></tr>`;
                return;
            }

            tableBody.innerHTML = events.map(e => {
                let statusText = '';
                if (e.status === 'Cancelled') {
                    statusText = 'Cancelled';
                } else {
                    const eventStart = getEventStartDateTime(e.date, e.time);
                    const isPast = eventStart < new Date();
                    statusText = isPast ? 'Completed' : 'Upcoming';
                }

                return `
                    <tr>
                        <td><strong>${e.title}</strong></td>
                        <td>${e.category}</td>
                        <td>${formatDate(e.date)}</td>
                        <td>${e.location}</td>
                        <td>${formatINR(e.ticketPrice)}</td>
                        <td>${statusText}</td>
                        <td>
                            <div style="display:flex; gap:0.4rem;">
                                <a href="/admin/event-details.html?id=${e._id}" class="btn btn-secondary btn-sm">Stats</a>
                                ${isOrganiser() ? `<button onclick="openEditEventModal('${e._id}')" class="btn btn-secondary btn-sm">Edit</button>` : ''}
                                <button onclick="handleDeleteEvent('${e._id}')" class="btn btn-danger btn-sm">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--danger)">Failed to load events</td></tr>`;
    }
}

function formatTime12hr(time24) {
    if (!time24) return '';
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const strH = h < 10 ? '0' + h : h;
    return `${strH}:${m} ${ampm}`;
}

function formatTime24hr(time12) {
    if (!time12) return '';
    if (time12.includes(':') && !time12.includes('AM') && !time12.includes('PM')) return time12;
    const parts = time12.split(' ');
    if (parts.length < 2) return time12;
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours, 10);
    if (h === 12) h = 0;
    if (modifier === 'PM') h += 12;
    const strH = h < 10 ? '0' + h : h;
    return `${strH}:${minutes}`;
}

// 3. Create / Edit Event Handlers
function setupCreateEventForm() {
    const form = document.getElementById('create-event-form');
    if (!form) return;

    const categorySelect = document.getElementById('event-category');
    const otherGroup = document.getElementById('other-category-group');

    if (categorySelect && otherGroup) {
        categorySelect.addEventListener('change', () => {
            if (categorySelect.value === 'Other') {
                otherGroup.style.display = 'block';
                document.getElementById('event-other-category')?.setAttribute('required', 'required');
            } else {
                otherGroup.style.display = 'none';
                document.getElementById('event-other-category')?.removeAttribute('required');
            }
        });
    }

    // Check if editing existing event
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        document.getElementById('event-form-title').textContent = 'Edit Event Details';
        populateEditEventForm(editId);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const rawTime = document.getElementById('event-time').value;
        let selectedCategory = document.getElementById('event-category').value;

        if (selectedCategory === 'Other') {
            const customCat = document.getElementById('event-other-category')?.value.trim();
            if (!customCat) {
                showToast('Please enter a name for the custom category', 'error');
                return;
            }
            selectedCategory = customCat;
        }

        const payload = {
            title: document.getElementById('event-title').value.trim(),
            description: document.getElementById('event-description').value.trim(),
            category: selectedCategory,
            location: document.getElementById('event-location').value.trim(),
            venue: document.getElementById('event-venue').value.trim(),
            date: document.getElementById('event-date').value,
            time: formatTime12hr(rawTime),
            ticketPrice: parseFloat(document.getElementById('event-price').value),
            totalTickets: parseInt(document.getElementById('event-total-tickets').value),
            organizer: document.getElementById('event-organizer').value.trim() || 'EventSphere Experiences'
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            let res;
            if (editId) {
                res = await apiRequest(`/events/${editId}`, 'PUT', payload, true);
            } else {
                res = await apiRequest('/events', 'POST', payload, true);
            }

            if (res.success) {
                showToast(res.message || 'Event saved successfully!', 'success');
                setTimeout(() => window.location.href = '/admin/events.html', 1200);
            }
        } catch (err) {
            showToast(err.message || 'Failed to save event', 'error');
            submitBtn.disabled = false;
        }
    });
}

async function populateEditEventForm(eventId) {
    try {
        const res = await apiRequest(`/events/${eventId}`);
        if (res.success && res.event) {
            const e = res.event;
            document.getElementById('event-title').value = e.title;
            document.getElementById('event-description').value = e.description;
            const standardCategories = ['Music', 'Concert', 'Technology', 'Sports', 'Business', 'Comedy', 'Workshop', 'Cultural'];
            if (standardCategories.includes(e.category)) {
                document.getElementById('event-category').value = e.category;
                if (document.getElementById('other-category-group')) document.getElementById('other-category-group').style.display = 'none';
            } else {
                document.getElementById('event-category').value = 'Other';
                if (document.getElementById('other-category-group')) document.getElementById('other-category-group').style.display = 'block';
                if (document.getElementById('event-other-category')) document.getElementById('event-other-category').value = e.category;
            }
            document.getElementById('event-location').value = e.location;
            document.getElementById('event-venue').value = e.venue;
            if (e.date) document.getElementById('event-date').value = new Date(e.date).toISOString().split('T')[0];
            document.getElementById('event-time').value = formatTime24hr(e.time);
            document.getElementById('event-price').value = e.ticketPrice;
            document.getElementById('event-total-tickets').value = e.totalTickets;
            document.getElementById('event-organizer').value = e.organizer;
        }
    } catch (err) {
        showToast('Error loading event for edit', 'error');
    }
}

function openEditEventModal(eventId) {
    window.location.href = `/admin/create-event.html?edit=${eventId}`;
}

async function handleDeleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? If bookings exist, it will be marked as Cancelled for safety.')) return;

    try {
        const res = await apiRequest(`/events/${eventId}`, 'DELETE', null, true);
        if (res.success) {
            showToast(res.message || 'Event processed successfully', 'success');
            loadAdminEvents();
        }
    } catch (err) {
        showToast(err.message || 'Failed to delete event', 'error');
    }
}

// 4. Admin Bookings Directory & Filter
async function loadAdminBookings() {
    const tbody = document.getElementById('admin-bookings-tbody');
    if (!tbody) return;

    const eventFilter = document.getElementById('filter-booking-event')?.value || '';
    const statusFilter = document.getElementById('filter-booking-status')?.value || '';

    const params = new URLSearchParams();
    if (eventFilter) params.append('eventId', eventFilter);
    if (statusFilter && statusFilter !== 'All') params.append('bookingStatus', statusFilter);

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Loading bookings...</td></tr>`;

    try {
        const res = await apiRequest(`/admin/bookings?${params.toString()}`, 'GET', null, true);
        if (res.success) {
            const bookings = res.bookings || [];
            if (bookings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No matching bookings found</td></tr>`;
                return;
            }

            tbody.innerHTML = bookings.map(b => `
                <tr>
                    <td>
                        <strong>${b.user?.name || 'Guest User'}</strong>
                    </td>
                    <td>${b.event ? b.event.title : 'Deleted Event'}</td>
                    <td>${b.ticketCount}</td>
                    <td style="font-weight:700; color:var(--success);">${formatINR(b.amount)}</td>
                    <td>${b.paymentStatus}</td>
                    <td>${b.bookingStatus}</td>
                    <td>${formatDate(b.bookingDate)}</td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--danger)">Failed to load bookings</td></tr>`;
    }
}

// 5. Admin Registered Users Directory
async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Loading user directory...</td></tr>`;

    try {
        const res = await apiRequest('/admin/users', 'GET', null, true);
        if (res.success) {
            const users = res.users || [];
            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No registered users found</td></tr>`;
                return;
            }

            const currentAdmin = getUser();

            tbody.innerHTML = users.map(u => `
                <tr>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.email}</td>
                    <td>${u.phone}</td>
                    <td>${formatDate(u.createdAt)}</td>
                    <td style="text-transform: capitalize; font-weight: 600; color: var(--text-primary);">${u.role}</td>
                    <td>${(u.role === 'admin' || u.role === 'organiser') ? '-' : `${u.bookingCount || 0} booking(s)`}</td>
                    <td style="font-weight:700; color:var(--success);">${(u.role === 'admin' || u.role === 'organiser') ? '-' : formatINR(u.totalSpent || 0)}</td>
                    <td>
                        ${currentAdmin && currentAdmin._id === u._id 
                            ? `<span style="font-size:0.75rem; color:var(--text-muted);">(You)</span>` 
                            : u.role === 'admin'
                                ? `<span style="font-size:0.75rem; color:var(--text-muted);">-</span>`
                                : `<button onclick="handleDeleteUser('${u._id}', '${u.name}')" class="btn btn-danger btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Delete</button>`
                        }
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger)">Failed to load user directory</td></tr>`;
    }
}

async function handleUserRoleChange(userId, newRole) {
    try {
        const res = await apiRequest(`/admin/users/${userId}/role`, 'PUT', { role: newRole }, true);
        if (res.success) {
            showToast(`Role updated to ${newRole.toUpperCase()}`, 'success');
        }
    } catch (err) {
        showToast(err.message || 'Failed to update user role', 'error');
        loadAdminUsers();
    }
}

async function handleDeleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const res = await apiRequest(`/admin/users/${userId}`, 'DELETE', null, true);
        if (res.success) {
            showToast('User account deleted successfully', 'success');
            loadAdminUsers();
        }
    } catch (err) {
        showToast(err.message || 'Failed to delete user', 'error');
    }
}

// 6. Event-Specific Detailed Analytics (/admin/event-details.html?id=...)
async function loadEventSpecificAnalytics() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
        showToast('No event specified for analytics', 'error');
        return;
    }

    try {
        const res = await apiRequest(`/admin/events/${eventId}/stats`, 'GET', null, true);
        if (res.success && res.event) {
            const e = res.event;
            const s = res.stats;

            const orgName = (e.organizerUser && e.organizerUser.name) ? e.organizerUser.name : 'Unknown Organizer';
            const orgEmail = (e.organizerUser && e.organizerUser.email) ? ` (${e.organizerUser.email})` : '';
            if (document.getElementById('evt-stat-organizer-name')) {
                document.getElementById('evt-stat-organizer-name').textContent = `${orgName}${orgEmail}`;
            }

            document.getElementById('evt-stat-title').textContent = e.title;
            document.getElementById('evt-stat-capacity').textContent = s.totalCapacity;
            document.getElementById('evt-stat-sold').textContent = s.ticketsSold;
            document.getElementById('evt-stat-available').textContent = s.availableTickets;
            document.getElementById('evt-stat-revenue').textContent = formatINR(s.revenue);

            renderEventBookingsTable(res.bookings || []);
        }
    } catch (err) {
        showToast('Failed to load event analytics', 'error');
    }
}

function renderEventBookingsTable(bookings) {
    const tbody = document.getElementById('event-bookings-tbody');
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No bookings recorded for this event yet</td></tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b => `
        <tr>
            <td>${b.user ? b.user.name : 'Unknown'}</td>
            <td>${b.ticketCount} ticket(s)</td>
            <td style="font-weight:700; color:var(--success);">${formatINR(b.amount)}</td>
            <td>${formatDate(b.bookingDate)}</td>
        </tr>
    `).join('');
}

function renderEventCapacityChart(ticketsSold, availableTickets) {
    const canvas = document.getElementById('eventCapacityChart');
    if (canvas && window.Chart) {
        new Chart(canvas, {
            type: 'pie',
            data: {
                labels: ['Tickets Sold', 'Tickets Available'],
                datasets: [{
                    data: [ticketsSold, availableTickets],
                    backgroundColor: ['#6366f1', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#f8fafc' } }
                }
            }
        });
    }
}
