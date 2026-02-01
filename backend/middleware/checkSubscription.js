import { Subscription } from "../models/Subscription.js";

const checkSubscription = async (req, res, next) => {
    try {
        // Allow access to auth routes for all users
        const authRoutes = [
            '/api/auth/signup',
            '/api/auth/login',
            '/api/auth/logout',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
            '/api/auth/verify-email'
        ];
        
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
            '/billing',
            '/api/usage/stats',
            '/api/polar' // Whitelist all polar routes so user can interact with billing
        ];
        
        const currentRoute = req.originalUrl;
        
        // Check if the current route is an auth route or billing route
        const isAuthRoute = authRoutes.some(route => currentRoute.includes(route));
        const isBillingRoute = billingRoutes.some(route => currentRoute.includes(route));
        
        if (isAuthRoute || isBillingRoute) {
            return next();
        }
        
        // For all other routes, check subscription status
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        
        // Check for active Subscription
        const activeSubscription = await Subscription.findOne({
            user_id: userId,
            status: 'active'
        });
        
        // If subscription is active, allow access
        if (activeSubscription) {
            return next();
        }
        
        // If no active subscription, check if user has an expired subscription
        // This covers status='expired' or manually cancelled
        const expiredSubscription = await Subscription.findOne({
            user_id: userId,
            status: { $in: ['expired', 'cancelled'] }
        });
        
        if (expiredSubscription) {
            return res.status(403).json({
                message: "Subscription expired. Please renew your subscription to continue.",
                subscriptionExpired: true
            });
        }
        
        // If no subscription at all, deny access
        return res.status(403).json({
            message: "No active subscription. Please subscribe to access this feature.",
            noSubscription: true
        });
    } catch (error) {
        console.error("Error in checkSubscription middleware:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default checkSubscription;