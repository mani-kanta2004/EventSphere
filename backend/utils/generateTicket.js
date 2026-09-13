const crypto = require('crypto');

/**
 * Generate a unique Ticket ID
 * Example: EVT-2026-8F72K9
 */
const generateTicketId = () => {
    const year = new Date().getFullYear();
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `EVT-${year}-${randomStr}`;
};

/**
 * Generate a unique Transaction ID
 * Example: TXN-8F29KDJ72
 */
const generateTransactionId = () => {
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TXN-${randomStr}`;
};

/**
 * Generate a unique Booking Reference
 * Example: BK-2026-9A4B
 */
const generateBookingId = () => {
    const year = new Date().getFullYear();
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `BK-${year}-${randomStr}`;
};

module.exports = {
    generateTicketId,
    generateTransactionId,
    generateBookingId
};
