/* Single Event Details & Ticket Quantity Selector */

let currentEvent = null;
let ticketQuantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
        showToast('No event specified', 'error');
        setTimeout(() => window.location.href = '/events.html', 1500);
        return;
    }

    try {
        const res = await apiRequest(`/events/${eventId}`);
        if (res.success && res.event) {
            currentEvent = res.event;
            renderEventDetails(res.event, res.stats);
        }
    } catch (err) {
        showToast('Failed to load event details', 'error');
    }
});

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

function renderEventDetails(event, stats) {
    document.title = `${event.title} - EventSphere`;

    const cat = event.category || 'Other';
    const icon = categoryIcons[cat] || '🌟';
    
    const bannerEl = document.getElementById('event-hero-banner');
    if (bannerEl) {
        bannerEl.className = `event-card-banner banner-${cat.toLowerCase()}`;
    }

    const iconBg = document.getElementById('event-icon-bg');
    if (iconBg) iconBg.textContent = icon;

    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-category').textContent = cat;
    document.getElementById('event-category').className = `badge badge-${cat.toLowerCase()}`;
    document.getElementById('event-organizer').textContent = event.organizer || 'EventSphere Experiences';
    document.getElementById('event-description').textContent = event.description;
    
    document.getElementById('event-date-time').textContent = `${formatDate(event.date)} at ${event.time}`;
    document.getElementById('event-location').textContent = `${event.location} - ${event.venue}`;
    
    document.getElementById('event-price').textContent = formatINR(event.ticketPrice);
    document.getElementById('available-tickets-count').textContent = event.availableTickets;

    const isSoldOut = event.availableTickets <= 0;
    const eventStart = getEventStartDateTime(event.date, event.time);
    const isPast = eventStart < new Date();

    const bookBtn = document.getElementById('proceed-book-btn');
    const qtyContainer = document.getElementById('qty-picker-container');

    if (isSoldOut || isPast || event.status === 'Cancelled') {
        if (qtyContainer) qtyContainer.style.display = 'none';
        if (bookBtn) {
            bookBtn.disabled = true;
            bookBtn.className = 'btn btn-secondary btn-block';
            if (event.status === 'Cancelled') bookBtn.textContent = 'EVENT CANCELLED';
            else if (isPast) bookBtn.textContent = 'EVENT COMPLETED';
            else bookBtn.textContent = 'SOLD OUT';
        }
        return;
    }

    // Setup quantity picker
    setupQuantityPicker(event.availableTickets, event.ticketPrice);
}

function setupQuantityPicker(maxTickets, ticketPrice) {
    ticketQuantity = 1;
    const qtyVal = document.getElementById('ticket-qty-val');
    const minusBtn = document.getElementById('qty-minus-btn');
    const plusBtn = document.getElementById('qty-plus-btn');
    const subtotalEl = document.getElementById('booking-subtotal');
    const bookBtn = document.getElementById('proceed-book-btn');

    const updateSubtotal = () => {
        if (qtyVal) qtyVal.textContent = ticketQuantity;
        if (subtotalEl) subtotalEl.textContent = formatINR(ticketQuantity * ticketPrice);
    };

    // Immediately calculate initial subtotal for 1 ticket on page load
    updateSubtotal();

    if (minusBtn) {
        minusBtn.addEventListener('click', () => {
            if (ticketQuantity > 1) {
                ticketQuantity--;
                updateSubtotal();
            }
        });
    }

    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            if (ticketQuantity < maxTickets && ticketQuantity < 10) {
                ticketQuantity++;
                updateSubtotal();
            } else if (ticketQuantity >= 10) {
                showToast('Maximum 10 tickets per booking permitted', 'warning');
            } else {
                showToast(`Only ${maxTickets} tickets available`, 'warning');
            }
        });
    }

    if (bookBtn) {
        bookBtn.addEventListener('click', () => {
            if (!requireAuth()) return;
            window.location.href = `/booking.html?eventId=${currentEvent._id}&qty=${ticketQuantity}`;
        });
    }
}
