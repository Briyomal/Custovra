import { User } from '../models/User.js';

const checkSubscription = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if subscription has expired
        if (user.subscription_expiry && new Date() > new Date(user.subscription_expiry)) {
            user.is_active = false;
            await user.save();

            // Redirect or block access based on route
            if (req.originalUrl !== '/subscription') {
                return res
                    .status(403)
                    .json({ message: 'Subscription expired. Please renew to continue.' });
            }
        }
        next(); // Proceed if subscription is valid or user is on the subscription page
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