let currentEvents = [];
const knownCitiesSet = new Set(['Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Coimbatore']);

document.addEventListener('DOMContentLoaded', () => {
    fetchEvents(true);

    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-filter');
    const locationSelect = document.getElementById('location-filter');
    const sortSelect = document.getElementById('sort-filter');
    const searchForm = document.getElementById('filter-form');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            fetchEvents();
        });
    }

    if (categorySelect) categorySelect.addEventListener('change', () => fetchEvents());
    if (locationSelect) locationSelect.addEventListener('change', () => fetchEvents());
    if (sortSelect) sortSelect.addEventListener('change', () => fetchEvents());

    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => fetchEvents(), 350);
        });
    }
});

async function fetchEvents(isInitialLoad = false) {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Loading events...</div>`;

    const query = document.getElementById('search-input')?.value || '';
    const category = document.getElementById('category-filter')?.value || '';
    const location = document.getElementById('location-filter')?.value || '';
    const sort = document.getElementById('sort-filter')?.value || 'date_asc';

    // On initial load, fetch all events first to discover all available cities in database
    if (isInitialLoad) {
        try {
            const allRes = await apiRequest('/events');
            if (allRes.success && allRes.events) {
                updateDynamicCityList(allRes.events);
            }
        } catch (err) {}
    }

    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category && category !== 'All') params.append('category', category);
    if (location && location !== 'All') params.append('location', location);
    if (sort) params.append('sort', sort);

    try {
        const res = await apiRequest(`/events?${params.toString()}`);
        currentEvents = res.events || [];
        updateDynamicCityList(currentEvents);
        updateDynamicCategoryList(currentEvents);
        renderEventCards(currentEvents);
    } catch (err) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Failed to load events. Please try again.</div>`;
    }
}

const knownCategoriesSet = new Set(['Music', 'Concert', 'Technology', 'Sports', 'Business', 'Comedy', 'Workshop', 'Cultural']);

function updateDynamicCategoryList(events) {
    const categorySelect = document.getElementById('category-filter');
    if (!categorySelect) return;

    const currentSelected = categorySelect.value || 'All';

    if (events && Array.isArray(events)) {
        events.forEach(e => {
            if (e.category && e.category.trim() !== '' && e.category.trim() !== 'Other') {
                knownCategoriesSet.add(e.category.trim());
            }
        });
    }

    const sortedCategories = Array.from(knownCategoriesSet).sort();

    let optionsHtml = `<option value="All">All Categories</option>`;
    sortedCategories.forEach(cat => {
        optionsHtml += `<option value="${cat}" ${currentSelected === cat ? 'selected' : ''}>${cat}</option>`;
    });

    categorySelect.innerHTML = optionsHtml;
}

function updateDynamicCityList(events) {
    const locationSelect = document.getElementById('location-filter');
    if (!locationSelect) return;

    const currentSelected = locationSelect.value || 'All';

    if (events && Array.isArray(events)) {
        events.forEach(e => {
            if (e.location && e.location.trim() !== '') {
                knownCitiesSet.add(e.location.trim());
            }
        });
    }

    const sortedCities = Array.from(knownCitiesSet).sort();

    let optionsHtml = `<option value="All">All Cities</option>`;
    sortedCities.forEach(city => {
        optionsHtml += `<option value="${city}" ${currentSelected === city ? 'selected' : ''}>${city}</option>`;
    });

    locationSelect.innerHTML = optionsHtml;
}

const categoryIcons = {
    'Music': '🎵',
    'Concert': '🎤',
    'Technology': '💻',
    'Sports': '⚽',
    'Business': '💼',
    'Comedy': '🎭',
    'Workshop': '🎨',
    'Cultural': '🪔',
    'Other': '🌟'
};

function renderEventCards(events) {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    if (!events || events.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 0.5rem;">No Events Found</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">We couldn't find any events matching your search criteria.</p>
                <button onclick="resetFilters()" class="btn btn-secondary btn-sm">Clear All Filters</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = events.map(event => {
        const cat = event.category || 'Other';
        const icon = categoryIcons[cat] || '🌟';
        const bannerClass = `banner-${cat.toLowerCase()}`;
        const categoryClass = `badge-${cat.toLowerCase()}`;
        const isSoldOut = event.availableTickets <= 0;

        return `
            <div class="event-card">
                <div class="event-card-banner ${bannerClass}">
                    <span class="badge ${categoryClass}">${cat}</span>
                    <span class="category-icon-bg">${icon}</span>
                </div>
                <div class="event-card-body">
                    <h3 class="event-card-title">${event.title}</h3>
                    <div class="event-card-meta">
                        <div class="meta-item">📍 ${event.location} • ${event.venue}</div>
                        <div class="meta-item">📅 ${formatDate(event.date)} at ${event.time}</div>
                    </div>
                    <div class="event-card-footer">
                        <div>
                            <div class="event-price">${formatINR(event.ticketPrice)}</div>
                            <div class="available-count">${isSoldOut ? '<strong style="color:var(--danger)">SOLD OUT</strong>' : `${event.availableTickets} tickets left`}</div>
                        </div>
                        <a href="/event-details.html?id=${event._id}" class="btn ${isSoldOut ? 'btn-secondary' : 'btn-primary'} btn-sm">
                            ${isSoldOut ? 'View Details' : 'Book Now'}
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function resetFilters() {
    if (document.getElementById('search-input')) document.getElementById('search-input').value = '';
    if (document.getElementById('category-filter')) document.getElementById('category-filter').value = 'All';
    if (document.getElementById('location-filter')) document.getElementById('location-filter').value = 'All';
    if (document.getElementById('sort-filter')) document.getElementById('sort-filter').value = 'date_asc';
    fetchEvents();
}
