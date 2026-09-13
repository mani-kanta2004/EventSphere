require('dotenv').config({ path: __dirname + '/.env' });
const connectDB = require('./config/db');
const User = require('./models/User');

const createAdmin = async () => {
    try {
        await connectDB();
        
        const adminEmail = 'admin@eventsphere.com';
        const adminPassword = 'Admin@123';

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log(`[Admin] Default admin account already exists: ${adminEmail}`);
            admin.role = 'admin';
            admin.password = adminPassword;
            await admin.save();
            console.log(`[Admin] Admin password reset to default (${adminPassword})`);
        } else {
            admin = await User.create({
                name: 'EventSphere Admin',
                email: adminEmail,
                password: adminPassword,
                phone: '+91 98765 43210',
                role: 'admin'
            });
            console.log(`[Admin] Successfully created new Admin account: ${adminEmail}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('[Admin] Error creating admin account:', error.message);
        process.exit(1);
    }
};

createAdmin();
