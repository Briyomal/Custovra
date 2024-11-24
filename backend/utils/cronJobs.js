import cron  from 'node-cron';
import { User } from "../models/User.js";

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        const users = await User.find({ subscription_expiry: { $lt: now }, is_active: true });

        for (const user of users) {
            user.is_active = false;
            await user.save();
        }

        console.log(`Deactivated ${users.length} users with expired subscriptions.`);
    } catch (error) {
        console.error('Error running subscription expiry check:', error);
    }
});