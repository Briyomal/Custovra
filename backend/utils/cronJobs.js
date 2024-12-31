import cron from 'node-cron';
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";

// Run every 5 minutes
cron.schedule('0 0 * * *', async () => {
    console.log('Running subscription expiry check...');
    try {
        const now = new Date();

        // Find all payments where subscription_expiry is in the past
        const expiredPayments = await Payment.find({
            subscription_expiry: { $lt: now }
        });

        // Extract user IDs from expired payments
        const expiredUserIds = expiredPayments.map(payment => payment.user_id);

        if (expiredUserIds.length > 0) {
            // Update users whose subscriptions have expired
            const result = await User.updateMany(
                { _id: { $in: expiredUserIds }, is_active: true },
                { $set: { is_active: false } }
            );

            console.log(`Deactivated ${result.nModified} users with expired subscriptions.`);
        } else {
            console.log('No users with expired subscriptions to deactivate.');
        }
    } catch (error) {
        console.error('Error running subscription expiry check:', error);
    }
});
