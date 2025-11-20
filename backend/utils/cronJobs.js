import cron from 'node-cron';
import { User } from "../models/User.js";
import { GenieSubscription } from "../models/GenieSubscription.js";

// Run every day at midnight (00:00) - Check subscription expiry
cron.schedule('* * * * *', async () => {
    console.log('Running subscription expiry check...');
    try {
        const now = new Date();

        // Step 1: Get all unique user IDs from GenieSubscription collection
        const genieUserIds = await GenieSubscription.distinct("user_id");
        
        // Step 2: Get all user IDs that might need status updates
        // This includes users with Genie subscriptions and potentially users without any subscriptions
        const allUserIds = await User.distinct("_id");
        
        let usersToDeactivate = [];
        let usersToActivate = [];

        // Step 3: Check each user's subscription status
        for (const userId of allUserIds) {
            // Check for active Genie subscription
            const hasActiveGenieSubscription = await GenieSubscription.exists({
                user_id: userId,
                subscription_end: { $gt: now },
                status: 'active'
            });

            // If user has any active subscriptions, they should be active
            if (hasActiveGenieSubscription) {
                usersToActivate.push(userId);
            } else {
                // If user has no active subscriptions, they should be deactivated
                usersToDeactivate.push(userId);
            }
        }

        // Step 4: Activate users with active subscriptions
        if (usersToActivate.length > 0) {
            const activateResult = await User.updateMany(
                { _id: { $in: usersToActivate }, is_active: false },
                { 
                    $set: { 
                        is_active: true,
                        subscription_status: 'active'
                    } 
                }
            );
            console.log(`Activated ${activateResult.modifiedCount} users with active subscriptions.`);
        }

        // Step 5: Deactivate users with no active subscriptions
        if (usersToDeactivate.length > 0) {
            const deactivateResult = await User.updateMany(
                { _id: { $in: usersToDeactivate }, is_active: true },
                { 
                    $set: { 
                        is_active: false,
                        subscription_status: 'expired'
                    } 
                }
            );
            console.log(`Deactivated ${deactivateResult.modifiedCount} users with no active subscriptions.`);
        }

        // Step 6: Update expired subscriptions status
        const expiredSubscriptionsResult = await GenieSubscription.updateMany(
            { 
                subscription_end: { $lt: now },
                status: 'active'
            },
            { 
                $set: { 
                    status: 'expired'
                } 
            }
        );
        if (expiredSubscriptionsResult.modifiedCount > 0) {
            console.log(`Updated ${expiredSubscriptionsResult.modifiedCount} expired subscriptions to 'expired' status.`);
        }

        if (usersToActivate.length === 0 && usersToDeactivate.length === 0 && expiredSubscriptionsResult.modifiedCount === 0) {
            console.log('No users or subscriptions need status updates.');
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