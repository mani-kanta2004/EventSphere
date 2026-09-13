/* Booking Summary Page Handler */

let bookingData = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    const qty = parseInt(urlParams.get('qty')) || 1;

    if (!eventId) {
        showToast('Invalid booking request', 'error');
        setTimeout(() => window.location.href = '/events.html', 1500);
        return;
    }

    try {
        const res = await apiRequest(`/events/${eventId}`);
        if (res.success && res.event) {
            const event = res.event;

            if (qty > event.availableTickets) {
                showToast(`Only ${event.availableTickets} tickets are available`, 'error');
                setTimeout(() => window.location.href = `/event-details.html?id=${eventId}`, 1500);
                return;
            }

            renderBookingSummary(event, qty);
        }
    } catch (err) {
        showToast('Failed to prepare booking summary', 'error');
    }
});

function renderBookingSummary(event, qty) {
    const subtotal = event.ticketPrice * qty;
    const bookingFee = subtotal > 0 ? 50 : 0;
    const taxAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + bookingFee + taxAmount;

    bookingData = {
        eventId: event._id,
        eventTitle: event.title,
        ticketCount: qty,
        ticketPrice: event.ticketPrice,
        subtotal,
        bookingFee,
        taxAmount,
        totalAmount
    };

    const categoryIcons = { 'Music':'🎵', 'Concert':'🎤', 'Technology':'💻', 'Sports':'⚽', 'Business':'💼', 'Comedy':'🎭', 'Workshop':'🎨', 'Cultural':'🪔', 'Other':'🌟' };
    const cat = event.category || 'Other';
    const icon = categoryIcons[cat] || '🌟';

    document.getElementById('summary-event-title').textContent = event.title;
    document.getElementById('summary-event-date').textContent = `${formatDate(event.date)} at ${event.time}`;
    document.getElementById('summary-event-venue').textContent = `${event.venue}, ${event.location}`;
    
    const catBadge = document.getElementById('summary-category-badge');
    if (catBadge) {
        catBadge.className = `badge badge-${cat.toLowerCase()}`;
        catBadge.textContent = `${icon} ${cat}`;
    }

    document.getElementById('summary-ticket-count').textContent = `${qty} Ticket${qty > 1 ? 's' : ''}`;
    document.getElementById('summary-ticket-price').textContent = `${formatINR(event.ticketPrice)} x ${qty}`;
    document.getElementById('summary-subtotal').textContent = formatINR(subtotal);
    document.getElementById('summary-booking-fee').textContent = formatINR(bookingFee);
    document.getElementById('summary-tax').textContent = formatINR(taxAmount);
    document.getElementById('summary-total-amount').textContent = formatINR(totalAmount);

    const proceedBtn = document.getElementById('proceed-to-payment-btn');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            // Save temporary checkout session
            sessionStorage.setItem('eventsphere_checkout', JSON.stringify(bookingData));
            window.location.href = `/payment.html`;
        });
    }
}
