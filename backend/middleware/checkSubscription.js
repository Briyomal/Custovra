import { User } from '../models/User.js';
import { ManualSubscription } from '../models/ManualSubscription.js';

const checkSubscription = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Allow access to billing-related routes even when subscription has expired
        // These routes should always be accessible so users can manage their subscriptions
        const billingRoutes = [
            '/api/billing/subscription-details',
            '/api/billing/payment-history',
            '/api/billing/available-plans',
            '/api/billing/payment-methods',
            '/api/billing/create-customer-portal-session',
            '/api/billing/setup-intent',
            '/api/subscriptions/checkout-session',
            '/api/subscriptions/check-plan-change',
            '/api/subscriptions/update-plan',
            '/api/subscriptions/toggle-auto-renewal',
            '/api/subscriptions/renew-previous-plan',
            '/api/subscriptions/complete-update',
            '/api/manual-billing/subscription-details',
            '/api/manual-billing/payment-history',
            '/api/manual-billing/available-plans',
            '/api/manual-billing/payment-request',
            '/api/manual-billing/pending-payments',
            '/billing',
            '/api/usage/stats'
        ];
        
        const currentRoute = req.originalUrl;
        const isBillingRoute = billingRoutes.some(route => currentRoute.includes(route));
        
        // Check manual subscription
        let manualSubscription = null;
        if (user.subscription_plan_id) {
            manualSubscription = await ManualSubscription.findOne({
                user_id: userId,
                status: 'active'
            });
        }
        
        // Check if user has any active subscription
        const now = new Date();
        const hasActiveSubscription = manualSubscription && manualSubscription.subscription_end > now;
        
        // If we have an active manual subscription, update user status
        if (hasActiveSubscription) {
            // Manual subscription is active
            user.is_active = true;
            user.subscription_status = 'active';
            await user.save();
        } else if (user.is_active) {
            // No active subscription but user is marked as active, deactivate them
            user.is_active = false;
            user.subscription_status = 'expired';
            await user.save();

            // Redirect or block access based on route
            if (!isBillingRoute && req.originalUrl !== '/billing') {
                return res.status(403).json({ 
                    message: 'Subscription expired. Please renew to continue.',
                    redirectTo: '/billing'
                });
            }
        }
        
        next(); // Proceed if subscription is valid or user is accessing a billing route
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: error.message });
    }

};

export default checkSubscription;