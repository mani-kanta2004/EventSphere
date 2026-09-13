const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { organizerOnly, organizerOrAdmin } = require('../middleware/organizerMiddleware');

router.get('/', optionalAuth, getEvents);
router.get('/:id', getEventById);

// Organiser & Admin management endpoints
router.post('/', protect, organizerOnly, createEvent);
router.put('/:id', protect, organizerOrAdmin, updateEvent);
router.delete('/:id', protect, organizerOrAdmin, deleteEvent);

module.exports = router;
