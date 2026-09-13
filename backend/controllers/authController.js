const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to sign JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'eventsphere_secret_key_2026_super_secure_jwt', {
        expiresIn: '30d'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
        const role = req.body.role && ['user', 'organiser', 'admin'].includes(req.body.role) ? req.body.role : 'user';

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists' });
        }

        const user = await User.create({
            name: name.trim(),
            email,
            phone: phone.trim(),
            password,
            role
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('[authController] registerUser error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { password } = req.body;
        const email = req.body.email ? req.body.email.trim().toLowerCase() : '';

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('[authController] loginUser error:', error);
        res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { name, phone, password } = req.body;

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (password && password.trim() !== '') {
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            }
            user.password = password;
        }

        // Save updated user (pre-save hook hashes password if modified)
        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('[authController] updateProfile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile
};
