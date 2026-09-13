const organizerOnly = (req, res, next) => {
    if (req.user && req.user.role === 'organiser') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: '403 Forbidden: Only Organisers can create events'
    });
};

const organizerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'organiser' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: '403 Forbidden: Organiser or Admin privileges required for this operation'
    });
};

module.exports = { organizerOnly, organizerOrAdmin };
