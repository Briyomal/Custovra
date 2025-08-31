import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";

/**
 * Manual Cron Job Test
 * Tests the daily subscription expiry check functionality
 */

export const testCronJobManually = async () => {
    console.log('\n🕐 TESTING CRON JOB FUNCTIONALITY');
    console.log('=====================================');
    
    try {
        const now = new Date();
        console.log(`Current time: ${now.toISOString()}`);

        // Step 1: Get all unique user IDs from Payment collection
        const allUserIds = await Payment.distinct("user_id");
        console.log(`📊 Found ${allUserIds.length} users with payment records`);

        let usersToDeactivate = [];
        let activeSubscriptions = 0;

        // Step 2: Check if each user has any active (non-expired) subscription
        for (const userId of allUserIds) {
            const hasActiveSubscription = await Payment.exists({
                user_id: userId,
                subscription_expiry: { $gt: now }
            });

            if (!hasActiveSubscription) {
                usersToDeactivate.push(userId);
                console.log(`❌ User ${userId} has no active subscription`);
            } else {
                activeSubscriptions++;
                console.log(`✅ User ${userId} has active subscription`);
            }
        }

        console.log(`\n📈 Summary:`);
        console.log(`- Total users: ${allUserIds.length}`);
        console.log(`- Active subscriptions: ${activeSubscriptions}`);
        console.log(`- Users to deactivate: ${usersToDeactivate.length}`);

        // Step 3: Show what would be deactivated (without actually doing it)
        if (usersToDeactivate.length > 0) {
            console.log(`\n🔄 Would deactivate ${usersToDeactivate.length} users:`);
            
            for (const userId of usersToDeactivate) {
                const user = await User.findById(userId);
                if (user) {
                    console.log(`- ${user.email} (Active: ${user.is_active}, Status: ${user.subscription_status})`);
                }
            }

            // Uncomment the following lines to actually perform the deactivation
            /*
            const result = await User.updateMany(
                { _id: { $in: usersToDeactivate }, is_active: true },
                { 
                    $set: { 
                        is_active: false,
                        subscription_status: 'expired'
                    } 
                }
            );
            console.log(`✅ Deactivated ${result.modifiedCount} users`);
            */
            
            console.log('\n⚠️  Note: Users were NOT actually deactivated. Remove comments in code to perform actual deactivation.');
        } else {
            console.log('\n✅ No users need to be deactivated.');
        }

        return {
            success: true,
            totalUsers: allUserIds.length,
            activeSubscriptions,
            usersToDeactivate: usersToDeactivate.length
        };

    } catch (error) {
        console.error('❌ Cron job test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Test subscription expiry scenarios
export const createTestExpiryScenarios = async () => {
    console.log('\n🧪 CREATING TEST EXPIRY SCENARIOS');
    console.log('=================================');
    
    const testUsers = [];
    const testPayments = [];
    
    try {
        // Scenario 1: User with expired subscription
        const expiredUser = new User({
            email: 'expired-test@example.com',
            password: 'hashedpassword123',
            name: 'Expired Test User',
            is_active: true,
            subscription_status: 'active'
        });
        await expiredUser.save();
        testUsers.push(expiredUser._id);

        const expiredPayment = new Payment({
            user_id: expiredUser._id,
            subscription_id: 'sub_expired_test_123',
            plan: 'basic',
            amount: 999,
            subscription_expiry: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        });
        await expiredPayment.save();
        testPayments.push(expiredPayment._id);

        // Scenario 2: User with active subscription
        const activeUser = new User({
            email: 'active-test@example.com',
            password: 'hashedpassword123',
            name: 'Active Test User',
            is_active: true,
            subscription_status: 'active'
        });
        await activeUser.save();
        testUsers.push(activeUser._id);

        const activePayment = new Payment({
            user_id: activeUser._id,
            subscription_id: 'sub_active_test_123',
            plan: 'premium',
            amount: 2999,
            subscription_expiry: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days from now
        });
        await activePayment.save();
        testPayments.push(activePayment._id);

        // Scenario 3: User with subscription expiring soon
        const soonExpireUser = new User({
            email: 'soon-expire-test@example.com',
            password: 'hashedpassword123',
            name: 'Soon Expire Test User',
            is_active: true,
            subscription_status: 'active'
        });
        await soonExpireUser.save();
        testUsers.push(soonExpireUser._id);

        const soonExpirePayment = new Payment({
            user_id: soonExpireUser._id,
            subscription_id: 'sub_soon_expire_test_123',
            plan: 'standard',
            amount: 1999,
            subscription_expiry: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
        });
        await soonExpirePayment.save();
        testPayments.push(soonExpirePayment._id);

        console.log('✅ Created test scenarios:');
        console.log(`- Expired user: ${expiredUser.email}`);
        console.log(`- Active user: ${activeUser.email}`);
        console.log(`- Soon to expire user: ${soonExpireUser.email}`);

        return {
            success: true,
            testUsers,
            testPayments,
            scenarios: {
                expired: expiredUser._id,
                active: activeUser._id,
                soonExpire: soonExpireUser._id
            }
        };

    } catch (error) {
        console.error('❌ Failed to create test scenarios:', error);
        
        // Cleanup on error
        if (testUsers.length > 0) {
            await User.deleteMany({ _id: { $in: testUsers } });
        }
        if (testPayments.length > 0) {
            await Payment.deleteMany({ _id: { $in: testPayments } });
        }
        
        return {
            success: false,
            error: error.message
        };
    }
};

// Cleanup test expiry scenarios
export const cleanupTestScenarios = async (testUsers = [], testPayments = []) => {
    console.log('\n🧹 CLEANING UP TEST SCENARIOS');
    console.log('=============================');
    
    try {
        if (testUsers.length > 0) {
            await User.deleteMany({ _id: { $in: testUsers } });
            console.log(`✅ Deleted ${testUsers.length} test users`);
        }

        if (testPayments.length > 0) {
            await Payment.deleteMany({ _id: { $in: testPayments } });
            console.log(`✅ Deleted ${testPayments.length} test payments`);
        }

        // Also cleanup any test users by email pattern
        const deletedUsers = await User.deleteMany({ email: { $regex: /-test@example\.com$/ } });
        const deletedPayments = await Payment.deleteMany({ subscription_id: { $regex: /test/ } });
        
        console.log(`✅ Additional cleanup: ${deletedUsers.deletedCount} users, ${deletedPayments.deletedCount} payments`);

        return { success: true };
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        return { success: false, error: error.message };
    }
};