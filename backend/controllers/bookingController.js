const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { generateTicketId, generateTransactionId } = require('../utils/generateTicket');

// @desc    Create a new booking (reserve tickets & payment simulation)
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = async (req, res) => {
    try {
        const { eventId, ticketCount, paymentMethod } = req.body;

        const quantity = Number(ticketCount);
        if (!eventId || isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Please provide a valid event ID and ticket quantity (minimum 1 ticket)' });
        }

        // Fetch event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'This event has been cancelled and tickets cannot be booked' });
        }

        // Check if event has already passed
        const eventDateTime = new Date(event.date);
        if (eventDateTime < new Date()) {
            return res.status(400).json({ success: false, message: 'This event has already taken place or started' });
        }

        // Verify requested capacity
        if (quantity > event.availableTickets) {
            if (event.availableTickets === 0) {
                return res.status(400).json({ success: false, message: 'Sorry, this event is SOLD OUT!' });
            }
            return res.status(400).json({
                success: false,
                message: `Only ${event.availableTickets} ticket${event.availableTickets > 1 ? 's are' : ' is'} available for booking.`
            });
        }

        // Calculate fees strictly on the backend
        const ticketPrice = event.ticketPrice;
        const subtotal = ticketPrice * quantity;
        const bookingFee = subtotal > 0 ? 50 : 0;
        const taxAmount = Math.round(subtotal * 0.18); // 18% GST
        const totalAmount = subtotal + bookingFee + taxAmount;

        // Atomic update to avoid race condition overbooking
        const updatedEvent = await Event.findOneAndUpdate(
            { _id: eventId, availableTickets: { $gte: quantity } },
            { $inc: { availableTickets: -quantity } },
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(400).json({
                success: false,
                message: 'Unable to reserve tickets due to high demand. Please try again.'
            });
        }

        // Generate identifiers
        const ticketId = generateTicketId();
        const transactionId = generateTransactionId();

        // Create booking record
        const booking = await Booking.create({
            user: req.user._id,
            event: eventId,
            ticketCount: quantity,
            ticketPrice,
            subtotal,
            bookingFee,
            taxAmount,
            amount: totalAmount,
            paymentStatus: 'Paid',
            bookingStatus: 'Confirmed',
            paymentMethod: paymentMethod || 'UPI',
            transactionId,
            ticketId
        });

        // Populate event details before returning
        await booking.populate('event', 'title date time venue location image category organizer');

        res.status(201).json({
            success: true,
            message: 'Booking completed successfully!',
            booking
        });
    } catch (error) {
        console.error('[bookingController] createBooking error:', error);
        res.status(500).json({ success: false, message: 'Failed to complete ticket booking', error: error.message });
    }
};

// @desc    Get logged-in user's bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('event', 'title date time location venue image category status ticketPrice')
            .sort({ bookingDate: -1 });

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error('[bookingController] getMyBookings error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving your bookings' });
    }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('event')
            .populate('user', 'name email phone');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking record not found' });
        }

        // Authorization check: User can view their own booking; Admin can view any
        if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
        }

        res.json({
            success: true,
            booking
        });
    } catch (error) {
        console.error('[bookingController] getBookingById error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving booking details' });
    }
};

// @desc    Cancel booking and restore ticket capacity
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('event');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Authorization check
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
        }

        if (booking.bookingStatus === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
        }

        // Check 24-hour rule for non-admin users
        if (req.user.role !== 'admin' && booking.event) {
            const eventDate = new Date(booking.event.date);
            const now = new Date();
            const hoursDifference = (eventDate - now) / (1000 * 60 * 60);

            if (hoursDifference < 24) {
                return res.status(400).json({
                    success: false,
                    message: 'Cancellations are only permitted up to 24 hours prior to the event date.'
                });
            }
        }

        // Update booking statuses
        booking.bookingStatus = 'Cancelled';
        booking.paymentStatus = 'Refunded';
        await booking.save();

        // Restore available tickets to event inventory
        if (booking.event) {
            await Event.findByIdAndUpdate(booking.event._id, {
                $inc: { availableTickets: booking.ticketCount }
            });
        }

        res.json({
            success: true,
            message: 'Booking cancelled successfully. Demo refund has been initiated.',
            booking
        });
    } catch (error) {
        console.error('[bookingController] cancelBooking error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel booking', error: error.message });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking
};
