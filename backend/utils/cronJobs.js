import cron from 'node-cron';
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";

// Run every day at midnight (00:00) - Check subscription expiry
cron.schedule('0 0 * * *', async () => {
    console.log('Running subscription expiry check...');
    try {
        const now = new Date();

        // Step 1: Get all unique user IDs from Payment collection
        const allUserIds = await Payment.distinct("user_id");

        let usersToDeactivate = [];

        // Step 2: Check if each user has any active (non-expired) subscription
        for (const userId of allUserIds) {
            const hasActiveSubscription = await Payment.exists({
                user_id: userId,
                subscription_expiry: { $gt: now }
            });

            if (!hasActiveSubscription) {
                usersToDeactivate.push(userId);
            }
        }

        // Step 3: Deactivate users with no active subscriptions
        if (usersToDeactivate.length > 0) {
            const result = await User.updateMany(
                { _id: { $in: usersToDeactivate }, is_active: true },
                { 
                    $set: { 
                        is_active: false,
                        subscription_status: 'expired'
                    } 
                }
            );
            console.log(`Deactivated ${result.modifiedCount} users with no active subscriptions.`);
        } else {
            console.log('No users need to be deactivated.');
        }

    } catch (error) {
        console.error('Error running subscription expiry check:', error);
    }
});

// Run on the first day of every month at 00:01 - Reset monthly submission counts
cron.schedule('1 0 1 * *', async () => {
    console.log('Running monthly submission count reset...');
    try {
        const now = new Date();
        
        // Reset monthly submission count for all users
        const result = await User.updateMany(
            {}, // Update all users
            {
                $set: {
                    monthly_submission_count: 0,
                    last_submission_reset: now
                }
            }
        );
        
        console.log(`Reset monthly submission count for ${result.modifiedCount} users.`);
        
    } catch (error) {
        console.error('Error running monthly submission reset:', error);
    }
});
