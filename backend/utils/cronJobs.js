import cron from 'node-cron';
import { User } from "../models/User.js";
import { GenieSubscription } from "../models/GenieSubscription.js";
import { sendSubscriptionExpiryReminderEmail } from "../email/emails.js";

// Run every day at midnight (00:00) - Check subscription expiry
cron.schedule('0 0 * * *', async () => {
    console.log('Running subscription expiry check...');
    try {
        const now = new Date();

        // Step 1: Get all admin user IDs (admins are always active)
        const adminUserIds = await User.distinct("_id", { role: "admin" });

        // Step 2: Get all user IDs with active subscriptions (single query instead of N queries)
        const usersWithActiveSubscriptions = await GenieSubscription.distinct("user_id", {
            subscription_end: { $gt: now },
            status: 'active'
        });

        // Step 3: Get all non-admin customer user IDs
        const allCustomerIds = await User.distinct("_id", { role: { $ne: "admin" } });

        // Step 4: Determine users to activate (admins + users with active subscriptions)
        const usersToActivate = [
            ...adminUserIds,
            ...usersWithActiveSubscriptions.filter(id =>
                !adminUserIds.some(adminId => adminId.equals(id))
            )
        ];

        // Step 5: Determine users to deactivate (customers without active subscriptions)
        const activeSubUserIdStrings = new Set(usersWithActiveSubscriptions.map(id => id.toString()));
        const usersToDeactivate = allCustomerIds.filter(id =>
            !activeSubUserIdStrings.has(id.toString())
        );

        // Step 6: Activate users with active subscriptions
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
            if (activateResult.modifiedCount > 0) {
                console.log(`Activated ${activateResult.modifiedCount} users with active subscriptions.`);
            }
        }

        // Step 7: Deactivate users with no active subscriptions
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
            if (deactivateResult.modifiedCount > 0) {
                console.log(`Deactivated ${deactivateResult.modifiedCount} users with no active subscriptions.`);
            }
        }

        // Step 8: Update expired subscriptions status
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

        // Log if no changes were needed
        const totalChanges = (usersToActivate.length > 0 ? 1 : 0) +
                           (usersToDeactivate.length > 0 ? 1 : 0) +
                           expiredSubscriptionsResult.modifiedCount;
        if (totalChanges === 0) {
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

// Run every day at 9:00 AM - Send subscription expiry reminder emails (3 days before expiry)
cron.schedule('0 9 * * *', async () => {
    console.log('Running subscription expiry reminder check...');
    try {
        const now = new Date();

        // Helper function to format date
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        let emailsSent = 0;

        // Find subscriptions expiring in ~3 days (between 2.5 and 3.5 days)
        const threeDayStart = new Date(now);
        threeDayStart.setDate(threeDayStart.getDate() + 2);
        threeDayStart.setHours(12, 0, 0, 0);

        const threeDayEnd = new Date(now);
        threeDayEnd.setDate(threeDayEnd.getDate() + 4);
        threeDayEnd.setHours(12, 0, 0, 0);

        const subscriptionsExpiring3Days = await GenieSubscription.find({
            status: 'active',
            subscription_end: { $gte: threeDayStart, $lt: threeDayEnd },
            expiry_reminder_sent: { $ne: true }
        }).populate('user_id', 'email name');

        for (const subscription of subscriptionsExpiring3Days) {
            if (subscription.user_id && subscription.user_id.email) {
                const sent = await sendSubscriptionExpiryReminderEmail({
                    email: subscription.user_id.email,
                    userName: subscription.user_id.name || 'Customer',
                    planName: subscription.plan_name,
                    billingPeriod: subscription.billing_period,
                    expiryDate: formatDate(subscription.subscription_end),
                    daysRemaining: 3
                });

                if (sent) {
                    await GenieSubscription.updateOne(
                        { _id: subscription._id },
                        { $set: { expiry_reminder_sent: true } }
                    );
                    emailsSent++;
                }
            }
        }

        if (emailsSent > 0) {
            console.log(`Sent ${emailsSent} subscription expiry reminder email(s).`);
        } else {
            console.log('No subscription expiry reminders to send.');
        }

    } catch (error) {
        console.error('Error running subscription expiry reminder check:', error);
    }
});
