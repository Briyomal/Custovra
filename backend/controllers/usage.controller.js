import { getUserUsageStats, getUserPlanLimits } from '../middleware/checkSubscriptionLimits.js';
import { subscriptionPlans } from '../utils/subscriptionPlans.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';

/**
 * User Usage Statistics Controller
 * Provides API endpoints for checking subscription limits and usage
 */

// Get current user's usage statistics
export const getUserUsage = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        console.log('Getting usage stats for user:', userId);
        const { error, stats } = await getUserUsageStats(userId);
        console.log('Usage stats result:', { error, stats: !!stats });
        
        if (error) {
            console.error('Error getting user usage stats:', error);
            return res.status(400).json({
                success: false,
                error
            });
        }
        
        res.status(200).json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Error getting user usage:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching usage statistics: ' + error.message
        });
    }
};

// Get all subscription plans with their limits
export const getSubscriptionPlans = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: subscriptionPlans
        });
    } catch (error) {
        console.error('Error getting subscription plans:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching subscription plans'
        });
    }
};

// Check if user can perform a specific action
export const checkUserPermission = async (req, res) => {
    try {
        const userId = req.userId;
        const { action } = req.params; // 'create_form' or 'submit_form'
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        const { error, stats } = await getUserUsageStats(userId);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error
            });
        }
        
        let canPerform = false;
        let reason = '';
        
        switch (action) {
            case 'create_form':
                canPerform = stats.usage.forms.remaining > 0;
                reason = canPerform ? 'Permission granted' : `Form limit reached. Your ${stats.planName} plan allows ${stats.limits.formLimit} form(s).`;
                break;
                
            case 'submit_form':
                canPerform = stats.usage.submissions.remaining > 0;
                reason = canPerform ? 'Permission granted' : `Monthly submission limit reached. Your ${stats.planName} plan allows ${stats.limits.submissionLimit} submissions per month.`;
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action. Use \"create_form\" or \"submit_form\"'
                });
        }
        
        res.status(200).json({
            success: true,
            data: {
                canPerform,
                reason,
                usage: stats.usage,
                planName: stats.planName
            }
        });
        
    } catch (error) {
        console.error('Error checking user permission:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while checking permissions'
        });
    }
};

// Debug endpoint to help troubleshoot subscription detection issues
export const debugUserSubscription = async (req, res) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        // Get user info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Get all payments for this user
        const allPayments = await Payment.find({ user_id: userId })
            .sort({ subscription_expiry: -1 });
        
        // Get active payments
        const now = new Date();
        const activePayments = allPayments.filter(p => p.subscription_expiry > now);
        
        // Get current plan limits
        const { error, limits, planName, activePayment } = await getUserPlanLimits(userId);
        
        res.status(200).json({
            success: true,
            debug: {
                userId,
                userInfo: {
                    email: user.email,
                    subscription_plan: user.subscription_plan,
                    subscription_status: user.subscription_status,
                    subscription_expiry: user.subscription_expiry,
                    is_active: user.is_active
                },
                allPayments: allPayments.map(p => ({
                    plan: p.plan,
                    subscription_id: p.subscription_id,
                    subscription_expiry: p.subscription_expiry,
                    amount: p.amount,
                    payment_date: p.payment_date,
                    isExpired: p.subscription_expiry <= now
                })),
                activePayments: activePayments.map(p => ({
                    plan: p.plan,
                    subscription_id: p.subscription_id,
                    subscription_expiry: p.subscription_expiry
                })),
                detectedPlan: {
                    planName,
                    limits,
                    activePayment: activePayment ? {
                        plan: activePayment.plan,
                        subscription_expiry: activePayment.subscription_expiry
                    } : null
                },
                error
            }
        });
        
    } catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Server error in debug endpoint'
        });
    }
};