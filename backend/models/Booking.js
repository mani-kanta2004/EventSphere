const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    ticketCount: {
        type: Number,
        required: [true, 'Ticket count is required'],
        min: [1, 'Must book at least 1 ticket']
    },
    ticketPrice: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    bookingFee: {
        type: Number,
        default: 50
    },
    taxAmount: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Paid'
    },
    bookingStatus: {
        type: String,
        enum: ['Confirmed', 'Cancelled', 'Completed'],
        default: 'Confirmed'
    },
    paymentMethod: {
        type: String,
        enum: ['UPI', 'Credit/Debit Card', 'Net Banking', 'Demo Payment'],
        default: 'UPI'
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    bookingDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
