const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

const fs = require('fs');

// Load environment variables from .env or backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const seedDatabase = require('./seed');
const Event = require('./models/Event');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files with automatic extension resolution
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath, { extensions: ['html', 'htm'] }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Fallback route for frontend HTML pages or direct URL navigation
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    const requestedPath = path.join(frontendPath, req.path);

    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
        return res.sendFile(requestedPath);
    }
    if (fs.existsSync(requestedPath + '.html') && fs.statSync(requestedPath + '.html').isFile()) {
        return res.sendFile(requestedPath + '.html');
    }
    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()) {
        const indexPath = path.join(requestedPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }

    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized 404 Error Handler for API
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const cluster = require('cluster');
const os = require('os');

const PORT = process.env.PORT || 5000;
const numWorkers = Math.min(os.cpus().length || 1, 4);

if (cluster.isMaster || cluster.isPrimary) {
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork({ IS_PRIMARY_WORKER: i === 0 ? 'true' : 'false' });
    }

    cluster.on('exit', () => {
        cluster.fork({ IS_PRIMARY_WORKER: 'false' });
    });
} else {
    const isFirstWorker = process.env.IS_PRIMARY_WORKER === 'true';

    const startServer = async () => {
        try {
            await connectDB(isFirstWorker);

            app.listen(PORT, () => {
                if (isFirstWorker) {
                    console.log(`Server listening on http://localhost:${PORT}`);
                }
            });
        } catch (err) {
            if (isFirstWorker) {
                console.error(`Failed to launch server:`, err.message);
            }
            process.exit(1);
        }
    };

    startServer();
}
