import { User } from '../models/User.js';

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
            '/api/subscriptions/complete-update'
        ];
        
        const currentRoute = req.originalUrl;
        const isBillingRoute = billingRoutes.some(route => currentRoute.includes(route));
        
        // Check if subscription has expired
        if (user.subscription_expiry && new Date() > new Date(user.subscription_expiry)) {
            user.is_active = false;
            await user.save();

            // Redirect or block access based on route
            if (!isBillingRoute && req.originalUrl !== '/billing') {
                return res
                    .status(403)
                    .json({ message: 'Subscription expired. Please renew to continue.' });
            }
        }
        next(); // Proceed if subscription is valid or user is accessing a billing route
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: error.message });
    }

};
/*
router.get('/dashboard', checkSubscription, (req, res) => {
    res.json({ message: 'Welcome to your dashboard' });
  });
*/
export default checkSubscription;