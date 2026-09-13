const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventsphere_secret_key_2026_super_secure_jwt');
            
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User account no longer exists' });
            }
            return next();
        } catch (error) {
            console.error('[AuthMiddleware] JWT Token verification failed:', error.message);
            return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no authentication token provided' });
    }
};

const optionalAuth = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventsphere_secret_key_2026_super_secure_jwt');
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Ignore error for optional authentication
        }
    }
    next();
};

module.exports = { protect, optionalAuth };
