const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllBookings, getAllUsers, getEventStats, getAnalyticsData, updateUserRole, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { organizerOrAdmin } = require('../middleware/organizerMiddleware');

// Routes accessible by both Organisers & Admins
router.get('/dashboard', protect, organizerOrAdmin, getDashboardStats);
router.get('/bookings', protect, organizerOrAdmin, getAllBookings);
router.get('/events/:id/stats', protect, organizerOrAdmin, getEventStats);
router.get('/analytics', protect, organizerOrAdmin, getAnalyticsData);

// Admin-only management endpoints
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
