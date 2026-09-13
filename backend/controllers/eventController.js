const Event = require('../models/Event');
const Booking = require('../models/Booking');

// @desc    Get all events with search, filtering, and sorting
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
    try {
        const { query, category, location, status, minPrice, maxPrice, sort } = req.query;

        let filter = {};

        // Organisers only see events created by themselves in management catalog
        if (req.user && req.user.role === 'organiser') {
            filter.organizerUser = req.user._id;
        }

        // Search in title, description, or location/venue
        if (query && query.trim() !== '') {
            const regex = new RegExp(query.trim(), 'i');
            filter.$or = [
                { title: regex },
                { description: regex },
                { location: regex },
                { venue: regex }
            ];
        }

        // Category filter
        if (category && category !== 'All' && category !== '') {
            filter.category = category;
        }

        // Location filter
        if (location && location !== 'All' && location !== '') {
            filter.location = new RegExp(location, 'i');
        }

        // Status filter (default to Upcoming if not specified)
        if (status) {
            filter.status = status;
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.ticketPrice = {};
            if (minPrice) filter.ticketPrice.$gte = Number(minPrice);
            if (maxPrice) filter.ticketPrice.$lte = Number(maxPrice);
        }

        // Sorting
        let sortOption = { date: 1 }; // Default upcoming first
        if (sort === 'date_desc') sortOption = { date: -1 };
        if (sort === 'price_asc') sortOption = { ticketPrice: 1 };
        if (sort === 'price_desc') sortOption = { ticketPrice: -1 };
        if (sort === 'newest') sortOption = { createdAt: -1 };

        const events = await Event.find(filter).sort(sortOption);

        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error('[eventController] getEvents error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving events', error: error.message });
    }
};

// @desc    Get single event details
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const ticketsSold = event.totalTickets - event.availableTickets;

        res.json({
            success: true,
            event,
            stats: {
                ticketsSold,
                availableTickets: event.availableTickets,
                isSoldOut: event.availableTickets <= 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error retrieving event details' });
    }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
    try {
        const { title, description, category, location, venue, date, time, ticketPrice, totalTickets, organizer } = req.body;

        if (!title || !description || !category || !location || !venue || !date || !time || ticketPrice === undefined || totalTickets === undefined) {
            return res.status(400).json({ success: false, message: 'Please fill in all required event details' });
        }

        if (Number(ticketPrice) < 0) {
            return res.status(400).json({ success: false, message: 'Ticket price cannot be negative' });
        }

        if (Number(totalTickets) <= 0) {
            return res.status(400).json({ success: false, message: 'Total tickets must be greater than 0' });
        }

        const event = await Event.create({
            title,
            description,
            category,
            location,
            venue,
            date,
            time,
            ticketPrice: Number(ticketPrice),
            totalTickets: Number(totalTickets),
            availableTickets: Number(totalTickets),
            organizer: organizer || (req.user ? req.user.name : 'EventSphere Experiences'),
            organizerUser: req.user ? req.user._id : undefined,
            status: 'Upcoming'
        });

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        console.error('[eventController] createEvent error:', error);
        res.status(500).json({ success: false, message: 'Failed to create event', error: error.message });
    }
};

// @desc    Update existing event
// @route   PUT /api/events/:id
// @access  Private/Organiser or Admin
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Ownership check for Organiser role
        if (req.user && req.user.role === 'organiser') {
            if (event.organizerUser && !event.organizerUser.equals(req.user._id)) {
                return res.status(403).json({ success: false, message: 'Forbidden: You can only edit events created by you' });
            }
        }

        const { title, description, category, location, venue, date, time, ticketPrice, totalTickets, status, organizer } = req.body;

        const ticketsSold = event.totalTickets - event.availableTickets;

        // Capacity update safety check
        if (totalTickets !== undefined) {
            const newTotal = Number(totalTickets);
            if (newTotal < ticketsSold) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot set total capacity to ${newTotal}. ${ticketsSold} tickets have already been sold for this event.`
                });
            }
            // Recalculate available tickets
            event.availableTickets = newTotal - ticketsSold;
            event.totalTickets = newTotal;
        }

        if (title) event.title = title;
        if (description) event.description = description;
        if (category) event.category = category;
        if (location) event.location = location;
        if (venue) event.venue = venue;
        if (date) event.date = date;
        if (time) event.time = time;
        if (ticketPrice !== undefined) event.ticketPrice = Number(ticketPrice);
        if (status) event.status = status;
        if (organizer) event.organizer = organizer;

        await event.save();

        res.json({
            success: true,
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        console.error('[eventController] updateEvent error:', error);
        res.status(500).json({ success: false, message: 'Failed to update event' });
    }
};

// @desc    Delete or cancel event
// @route   DELETE /api/events/:id
// @access  Private/Organiser or Admin
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Ownership check for Organiser role
        if (req.user && req.user.role === 'organiser') {
            if (event.organizerUser && !event.organizerUser.equals(req.user._id)) {
                return res.status(403).json({ success: false, message: 'Forbidden: You can only delete events created by you' });
            }
        }

        // Check if event has active bookings
        const bookingCount = await Booking.countDocuments({ event: event._id });

        if (bookingCount > 0) {
            event.status = 'Cancelled';
            await event.save();
            return res.json({
                success: true,
                message: 'This event has existing bookings and cannot be physically deleted. It has been marked as Cancelled.',
                event
            });
        }

        await Event.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Event deleted permanently'
        });
    } catch (error) {
        console.error('[eventController] deleteEvent error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
};

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};
