const mongoose = require('mongoose');

const connectDB = async (showLog = true) => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventSphereDB';
        
        // Options with 3s server selection timeout so fallback triggers quickly if local mongo service isn't active
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 3000
        });
        
        if (showLog) {
            console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        }
        return conn;
    } catch (err) {
        if (showLog) {
            console.warn(`[Database] Primary MongoDB connection failed (${err.message}). Attempting MongoMemoryServer fallback...`);
        }
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create({
                instance: { dbName: 'eventSphereDB' }
            });
            const memoryUri = mongod.getUri();
            const memoryConn = await mongoose.connect(memoryUri);
            if (showLog) {
                console.log(`[Database] Connected to In-Memory MongoDB: ${memoryUri}`);
            }
            return memoryConn;
        } catch (fallbackErr) {
            console.error(`[Database] Critical Error: Failed to connect to MongoDB!`, fallbackErr.message);
            process.exit(1);
        }
    }
};

module.exports = connectDB;
