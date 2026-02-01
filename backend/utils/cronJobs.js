import cron from 'node-cron';
import { User } from "../models/User.js";
import { Subscription } from "../models/Subscription.js";
import { MeterEvent } from "../models/MeterEvent.js";
import { reportMeterUsage } from "../services/polarMeter.service.js";

// Run every day at midnight (00:00) - Check subscription expiry
cron.schedule('0 0 * * *', async () => {
    console.log('Running subscription expiry check...');
    try {
        const now = new Date();

        // Step 1: Get all user IDs that might need status updates
        const allUserIds = await User.distinct("_id");
        
        let usersToDeactivate = [];
        let usersToActivate = [];

        // Step 2: Check each user's subscription status
        for (const userId of allUserIds) {

            // Get user role
            const user = await User.findById(userId);
            // ---- KEEP ADMIN ACTIVE ----
            if (user && user.role === "admin") {
                usersToActivate.push(userId);
                continue; // skip subscription checks for admins
            }

            // Check for active Subscription (Polar/Manual)
            const hasActiveSubscription = await Subscription.exists({
                user_id: userId,
                subscription_end: { $gt: now },
                status: { $in: ['active', 'trialing', 'cancelled'] }
            });

            // If user has any active subscriptions, they should be active
            if (hasActiveSubscription) {
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
                        subscription_status: 'expired'
                    } 
                }
            );
            console.log(`Deactivated ${deactivateResult.modifiedCount} users with no active subscriptions.`);
        }

        // Step 5: Update expired subscriptions status in Subscription model
        const expiredSubscriptionsResult = await Subscription.updateMany(
            { 
                subscription_end: { $lt: now },
                status: { $in: ['active', 'trialing', 'cancelled'] }
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

// NOTE: Monthly submission reset cron job removed - Polar handles meter reset automatically

// Retry failed meter events every hour
cron.schedule('0 * * * *', async () => {
    console.log('Running meter event retry job...');
    try {
        const failedEvents = await MeterEvent.find({
            ingestion_status: 'failed',
            createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }).limit(100);

        if (failedEvents.length === 0) {
            console.log('No failed meter events to retry.');
            return;
        }

        console.log(`Found ${failedEvents.length} failed meter events to retry.`);
        let successCount = 0;
        let failCount = 0;

        for (const event of failedEvents) {
            try {
                // Extract meterId from metadata (stored when event was originally created)
                const meterId = event.metadata?.meterId;
                if (!meterId) {
                    console.error(`Event ${event._id} missing meterId in metadata, skipping.`);
                    failCount++;
                    continue;
                }

                await reportMeterUsage(
                    meterId,
                    event.user_id,
                    event.event_name,
                    event.quantity || 1,
                    event.metadata
                );
                successCount++;
            } catch (error) {
                console.error(`Retry failed for event ${event._id}:`, error.message);
                failCount++;
            }
        }

        console.log(`Meter event retry complete: ${successCount} succeeded, ${failCount} failed.`);

    } catch (error) {
        console.error('Error running meter event retry job:', error);
    }
});