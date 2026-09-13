require('dotenv').config({ path: __dirname + '/.env' });
const connectDB = require('./config/db');
const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Booking');
const { sampleUsers, sampleEvents } = require('./utils/seedData');
const { generateTicketId, generateTransactionId } = require('./utils/generateTicket');

const seedDatabase = async () => {
    try {
        console.log('[Seed] Starting EventSphere database seeding process...');
        await connectDB();

        // Clear existing collections safely
        await User.deleteMany({});
        await Event.deleteMany({});
        await Booking.deleteMany({});

        console.log('[Seed] Cleared existing Users, Events, and Bookings.');

        // Insert Users (User.create will trigger password hashing pre-save hook)
        const createdUsers = [];
        for (const userData of sampleUsers) {
            const user = await User.create(userData);
            createdUsers.push(user);
        }
        console.log(`[Seed] Created ${createdUsers.length} users (1 Admin + 5 Sample Users).`);

        // Insert Events
        const createdEvents = await Event.insertMany(sampleEvents);
        console.log(`[Seed] Created ${createdEvents.length} events across major Indian cities.`);
        console.log('[Seed] Database seeding completed successfully!');
        
        if (require.main === module) {
            process.exit(0);
        }
    } catch (error) {
        console.error('[Seed] Error seeding database:', error);
        if (require.main === module) {
            process.exit(1);
        }
    }
};

if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
