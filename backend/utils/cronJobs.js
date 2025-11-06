import cron from 'node-cron';
import { User } from "../models/User.js";
import { ManualSubscription } from "../models/ManualSubscription.js";

// Run every day at midnight (00:00) - Check subscription expiry
cron.schedule('* * * * *', async () => {
    console.log('Running subscription expiry check...');
    try {
        const now = new Date();

        // Step 1: Get all unique user IDs from ManualSubscription collection
        const manualUserIds = await ManualSubscription.distinct("user_id");
        
        let usersToDeactivate = [];
        let usersToActivate = [];

        // Step 2: Check each user's subscription status
        for (const userId of manualUserIds) {
            // Check for active manual subscription
            const hasActiveManualSubscription = await ManualSubscription.exists({
                user_id: userId,
                subscription_end: { $gt: now },
                status: 'active'
            });

            // If user has any active subscriptions, they should be active
            if (hasActiveManualSubscription) {
                usersToActivate.push(userId);
            } else {
                // If user has no active subscriptions, they should be deactivated
                usersToDeactivate.push(userId);
            }
        }

        // Step 3: Activate users with active subscriptions
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

        // Step 4: Deactivate users with no active subscriptions
        if (usersToDeactivate.length > 0) {
            const deactivateResult = await User.updateMany(
                { _id: { $in: usersToDeactivate }, is_active: true },
                { 
                    $set: { 
                        is_active: false,
                        subscription_status: 'cancelled'
                    } 
                }
            );
            console.log(`Deactivated ${deactivateResult.modifiedCount} users with no active subscriptions.`);
        }

        // Step 5: Update expired subscriptions status
        const expiredSubscriptionsResult = await ManualSubscription.updateMany(
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