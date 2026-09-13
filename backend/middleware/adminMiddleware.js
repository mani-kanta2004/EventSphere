const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: '403 Forbidden: Admin privileges required for this operation'
    });
};

module.exports = { adminOnly };
