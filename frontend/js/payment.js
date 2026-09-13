/* Payment Simulation Page Handler */

let checkoutSession = null;
let selectedPaymentMethod = 'UPI';

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    const sessionStr = sessionStorage.getItem('eventsphere_checkout');
    if (!sessionStr) {
        showToast('No active checkout session found', 'warning');
        setTimeout(() => window.location.href = '/events.html', 1500);
        return;
    }

    checkoutSession = JSON.parse(sessionStr);

    document.getElementById('pay-event-title').textContent = checkoutSession.eventTitle;
    document.getElementById('pay-ticket-count').textContent = `${checkoutSession.ticketCount} Ticket(s)`;
    document.getElementById('pay-total-amount').textContent = formatINR(checkoutSession.totalAmount);
    document.getElementById('pay-submit-btn-text').textContent = `Pay ${formatINR(checkoutSession.totalAmount)}`;

    setupPaymentMethodTabs();
    setupInputFormatting();
    setupPaymentSubmit();
});

function setupInputFormatting() {
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    const cardCvv = document.getElementById('card-cvv');

    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.substring(0, 16);
            e.target.value = value.replace(/(.{4})/g, '$1 ').trim();
        });
    }

    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
            } else {
                e.target.value = value;
            }
        });
    }

    if (cardCvv) {
        cardCvv.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    }
}

function setupPaymentMethodTabs() {
    const tabs = document.querySelectorAll('.payment-tab');
    const tabPanes = document.querySelectorAll('.payment-tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            selectedPaymentMethod = tab.getAttribute('data-method');
            
            const targetPane = document.getElementById(`pane-${selectedPaymentMethod.toLowerCase().replace(/[^a-z]/g, '')}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });
}

function setupPaymentSubmit() {
    const payForm = document.getElementById('payment-form');
    if (!payForm) return;

    payForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const upiId = document.getElementById('upi-id')?.value.trim();
        if (!upiId || !upiId.includes('@')) {
            showToast('Please enter a valid UPI ID (e.g. eventsphere@upi)', 'error');
            return;
        }

        const submitBtn = document.getElementById('payment-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Processing UPI Payment...</span>`;

        try {
            // Call Backend Booking API for UPI payment processing
            const response = await apiRequest('/bookings', 'POST', {
                eventId: checkoutSession.eventId,
                ticketCount: checkoutSession.ticketCount,
                paymentMethod: 'UPI'
            }, true);

            if (response.success && response.booking) {
                sessionStorage.removeItem('eventsphere_checkout');
                sessionStorage.setItem('eventsphere_recent_booking', JSON.stringify(response.booking));

                showToast('UPI Payment successful! Generating your digital ticket pass...', 'success');

                setTimeout(() => {
                    window.location.href = `/booking-success.html?id=${response.booking._id}`;
                }, 1200);
            }
        } catch (err) {
            showToast(err.message || 'Payment processing failed. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span id="pay-submit-btn-text">Pay ${formatINR(checkoutSession.totalAmount)}</span>`;
        }
    });
}
