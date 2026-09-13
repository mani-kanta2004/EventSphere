const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Event description is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location (City) is required'],
        trim: true
    },
    venue: {
        type: String,
        required: [true, 'Venue address is required'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Event date is required']
    },
    time: {
        type: String,
        required: [true, 'Event time is required']
    },
    ticketPrice: {
        type: Number,
        required: [true, 'Ticket price is required'],
        min: [0, 'Ticket price cannot be negative']
    },
    totalTickets: {
        type: Number,
        required: [true, 'Total tickets count is required'],
        min: [1, 'Total tickets must be at least 1']
    },
    availableTickets: {
        type: Number,
        required: true
    },
    organizer: {
        type: String,
        default: 'EventSphere Experiences'
    },
    organizerUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Completed', 'Cancelled'],
        default: 'Upcoming'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-set availableTickets to totalTickets on initial creation if not explicitly set
eventSchema.pre('validate', function (next) {
    if (this.isNew && this.availableTickets === undefined) {
        this.availableTickets = this.totalTickets;
    }
    next();
});

module.exports = mongoose.model('Event', eventSchema);
