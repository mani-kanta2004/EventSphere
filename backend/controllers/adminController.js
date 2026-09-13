const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get dashboard high-level statistics
// @route   GET /api/admin/dashboard
// @access  Private/Organiser or Admin
const getDashboardStats = async (req, res) => {
    try {
        const isOrganiser = req.user && req.user.role === 'organiser';

        let eventFilter = {};
        if (isOrganiser) {
            eventFilter.organizerUser = req.user._id;
        }

        const totalEvents = await Event.countDocuments(eventFilter);
        const totalUsers = isOrganiser ? 0 : await User.countDocuments({ role: 'user' });
        const totalOrganisers = isOrganiser ? 0 : await User.countDocuments({ role: 'organiser' });

        // Get event IDs owned by this user if organiser
        let eventIds = [];
        if (isOrganiser) {
            const orgEvents = await Event.find({ organizerUser: req.user._id }).select('_id');
            eventIds = orgEvents.map(e => e._id);
        }

        let bookingMatch = { paymentStatus: 'Paid' };
        if (isOrganiser) {
            bookingMatch.event = { $in: eventIds };
        }

        const totalBookingsFilter = isOrganiser ? { event: { $in: eventIds } } : {};
        const totalBookings = await Booking.countDocuments(totalBookingsFilter);

        // Calculate total tickets sold & total revenue
        const paidBookingsAggregation = await Booking.aggregate([
            { $match: bookingMatch },
            {
                $group: {
                    _id: null,
                    totalTicketsSold: { $sum: '$ticketCount' },
                    totalRevenue: { $sum: '$amount' }
                }
            }
        ]);

        const totalTicketsSold = paidBookingsAggregation.length > 0 ? paidBookingsAggregation[0].totalTicketsSold : 0;
        const totalRevenue = paidBookingsAggregation.length > 0 ? paidBookingsAggregation[0].totalRevenue : 0;

        const upcomingEventsFilter = {
            ...eventFilter,
            status: 'Upcoming',
            date: { $gte: new Date() }
        };
        const upcomingEvents = await Event.countDocuments(upcomingEventsFilter);

        // Recent 5 bookings
        const recentBookingsFilter = isOrganiser ? { event: { $in: eventIds } } : {};
        const recentBookings = await Booking.find(recentBookingsFilter)
            .sort({ bookingDate: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('event', 'title date');

        res.json({
            success: true,
            stats: {
                totalEvents,
                totalUsers,
                totalOrganisers,
                totalBookings,
                totalTicketsSold,
                totalRevenue,
                upcomingEvents
            },
            recentBookings
        });
    } catch (error) {
        console.error('[adminController] getDashboardStats error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving dashboard statistics' });
    }
};

// @desc    Get all bookings with filtering options
// @route   GET /api/admin/bookings
// @access  Private/Organiser or Admin
const getAllBookings = async (req, res) => {
    try {
        const { eventId, paymentStatus, bookingStatus, date } = req.query;
        const isOrganiser = req.user && req.user.role === 'organiser';

        let filter = {};

        if (isOrganiser) {
            const orgEvents = await Event.find({ organizerUser: req.user._id }).select('_id');
            const eventIds = orgEvents.map(e => e._id);
            filter.event = { $in: eventIds };
        }

        if (eventId && eventId.trim() !== '') filter.event = eventId;
        if (paymentStatus && paymentStatus !== 'All') filter.paymentStatus = paymentStatus;
        if (bookingStatus && bookingStatus !== 'All') filter.bookingStatus = bookingStatus;

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            filter.bookingDate = { $gte: startOfDay, $lte: endOfDay };
        }

        const bookings = await Booking.find(filter)
            .populate('user', 'name email phone')
            .populate('event', 'title date location venue ticketPrice')
            .sort({ bookingDate: -1 });

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error('[adminController] getAllBookings error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve bookings list' });
    }
};

// @desc    Get all registered users (All users, organisers, admins)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        const usersWithStats = await Promise.all(users.map(async (user) => {
            const bookingCount = await Booking.countDocuments({ user: user._id });
            const totalSpentAggregation = await Booking.aggregate([
                { $match: { user: user._id, paymentStatus: 'Paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalSpent = totalSpentAggregation.length > 0 ? totalSpentAggregation[0].total : 0;

            return {
                ...user.toObject(),
                bookingCount,
                totalSpent
            };
        }));

        res.json({
            success: true,
            count: usersWithStats.length,
            users: usersWithStats
        });
    } catch (error) {
        console.error('[adminController] getAllUsers error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve users' });
    }
};

// @desc    Update user role (Admin feature)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!role || !['user', 'organiser', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: `User role updated to ${role.toUpperCase()}`,
            user
        });
    } catch (error) {
        console.error('[adminController] updateUserRole error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user role' });
    }
};

// @desc    Delete user account (Admin feature)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (targetUser.role === 'admin') {
            return res.status(400).json({ success: false, message: 'Admin accounts cannot be deleted' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('[adminController] deleteUser error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};

// @desc    Get event-specific detailed statistics
// @route   GET /api/admin/events/:id/stats
// @access  Private/Admin
const getEventStats = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizerUser', 'name email phone');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const bookings = await Booking.find({ event: event._id })
            .populate('user', 'name email phone')
            .sort({ bookingDate: -1 });

        const revenueAggregation = await Booking.aggregate([
            { $match: { event: event._id, paymentStatus: 'Paid' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    ticketsSold: { $sum: '$ticketCount' }
                }
            }
        ]);

        const revenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;
        const ticketsSold = event.totalTickets - event.availableTickets;

        res.json({
            success: true,
            event,
            stats: {
                totalCapacity: event.totalTickets,
                ticketsSold,
                availableTickets: event.availableTickets,
                revenue,
                totalBookingsCount: bookings.length
            },
            bookings
        });
    } catch (error) {
        console.error('[adminController] getEventStats error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve event statistics' });
    }
};

// @desc    Get data for admin dashboard analytics charts
// @route   GET /api/admin/analytics
// @access  Private/Organiser or Admin
const getAnalyticsData = async (req, res) => {
    try {
        const isOrganiser = req.user && req.user.role === 'organiser';

        let bookingMatch = { paymentStatus: 'Paid' };

        if (isOrganiser) {
            const orgEvents = await Event.find({ organizerUser: req.user._id }).select('_id');
            const eventIds = orgEvents.map(e => e._id);
            bookingMatch.event = { $in: eventIds };
        }

        // 1. Revenue by Top Events
        const revenueByEvent = await Booking.aggregate([
            { $match: bookingMatch },
            {
                $group: {
                    _id: '$event',
                    revenue: { $sum: '$amount' },
                    ticketsSold: { $sum: '$ticketCount' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 8 },
            {
                $lookup: {
                    from: 'events',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'eventInfo'
                }
            },
            { $unwind: '$eventInfo' },
            {
                $project: {
                    title: '$eventInfo.title',
                    category: '$eventInfo.category',
                    revenue: 1,
                    ticketsSold: 1
                }
            }
        ]);

        // 2. Sales by Category
        const ticketsByCategory = await Booking.aggregate([
            { $match: bookingMatch },
            {
                $lookup: {
                    from: 'events',
                    localField: 'event',
                    foreignField: '_id',
                    as: 'eventDetails'
                }
            },
            { $unwind: '$eventDetails' },
            {
                $group: {
                    _id: '$eventDetails.category',
                    totalTickets: { $sum: '$ticketCount' },
                    totalRevenue: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            revenueByEvent,
            ticketsByCategory
        });
    } catch (error) {
        console.error('[adminController] getAnalyticsData error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve analytics data' });
    }
};

module.exports = {
    getDashboardStats,
    getAllBookings,
    getAllUsers,
    getEventStats,
    getAnalyticsData,
    updateUserRole,
    deleteUser
};
