/* My Bookings History & Cancellation Handler */

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    fetchMyBookings();
});

async function fetchMyBookings() {
    const container = document.getElementById('my-bookings-container');
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-muted);">Loading your bookings...</div>`;

    try {
        const res = await apiRequest('/bookings/my', 'GET', null, true);
        if (res.success) {
            renderBookingsList(res.bookings || []);
        }
    } catch (err) {
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--danger);">Failed to load bookings.</div>`;
    }
}

function renderBookingsList(bookings) {
    const container = document.getElementById('my-bookings-container');
    if (!container) return;

    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 0.5rem;">No Bookings Found</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">You haven't booked any event tickets yet.</p>
                <a href="/events.html" class="btn btn-primary">Explore Events</a>
            </div>
        `;
        return;
    }

    const categoryIcons = { 'Music':'🎵', 'Concert':'🎤', 'Technology':'💻', 'Sports':'⚽', 'Business':'💼', 'Comedy':'🎭', 'Workshop':'🎨', 'Cultural':'🪔', 'Other':'🌟' };

    container.innerHTML = bookings.map(b => {
        const event = b.event || {};
        const cat = event.category || 'Other';
        const icon = categoryIcons[cat] || '🎟️';
        const isCancelled = b.bookingStatus === 'Cancelled';
        const isPast = new Date(event.date) < new Date();

        return `
            <div class="booking-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.5rem; display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
                <div style="display: flex; gap: 1.25rem; align-items: center; min-width: 280px;">
                    <div class="badge badge-${cat.toLowerCase()}" style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; font-size: 2rem; border-radius: var(--radius-md); font-weight: normal;">
                        ${icon}
                    </div>
                    <div>
                        <span class="badge ${isCancelled ? 'badge-cancelled' : 'badge-upcoming'}">${b.bookingStatus}</span>
                        <h4 style="margin: 0.4rem 0 0.2rem; font-size: 1.15rem;">${event.title || 'Event Title'}</h4>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">📅 ${formatDate(event.date)} at ${event.time}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">📍 ${event.venue}, ${event.location}</div>
                    </div>
                </div>

                <div style="text-align: right; min-width: 180px;">
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${b.ticketCount} Ticket(s)</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--success); margin: 0.3rem 0;">${formatINR(b.amount)}</div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <a href="/booking-success.html?id=${b._id}" class="btn btn-secondary btn-sm">View Ticket</a>
                        ${!isCancelled && !isPast ? `<button onclick="handleCancelBooking('${b._id}')" class="btn btn-danger btn-sm">Cancel</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function handleCancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? Tickets will be returned to inventory and a demo refund will be issued.')) {
        return;
    }

    try {
        const res = await apiRequest(`/bookings/${bookingId}/cancel`, 'PUT', null, true);
        if (res.success) {
            showToast(res.message || 'Booking cancelled successfully', 'success');
            fetchMyBookings();
        }
    } catch (err) {
        showToast(err.message || 'Failed to cancel booking', 'error');
    }
}
