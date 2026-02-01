import { getUserUsageStats, getUserPlanLimits } from '../middleware/checkSubscriptionLimits.js';
import { ManualPlan } from '../models/ManualPlan.js';
import { Subscription } from '../models/Subscription.js';
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
        // Get all active manual plans
        const plans = await ManualPlan.find({ is_active: true });
        
        // Format plans for frontend
        const subscriptionPlans = {};
        plans.forEach(plan => {
            subscriptionPlans[plan.name.toLowerCase().replace(/\s+/g, '_')] = {
                name: plan.name,
                formLimit: plan.form_limit,
                submissionLimit: plan.submission_limit,
                description: plan.description,
                features: plan.features
            };
        });
        
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
        
        // Get all subscriptions for this user
        const allSubscriptions = await Subscription.find({ user_id: userId })
            .sort({ created_at: -1 });
        
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
                allSubscriptions: allSubscriptions.map(s => ({
                    id: s._id,
                    plan_name: s.plan_name,
                    status: s.status,
                    start_date: s.subscription_start,
                    end_date: s.subscription_end,
                    billing_period: s.billing_period,
                    amount: s.amount,
                    provider: s.external_provider
                })),
                detectedPlan: {
                    planName,
                    limits,
                    activeSubscription: activePayment ? {
                        id: activePayment._id,
                        plan: activePayment.plan_name,
                        status: activePayment.status,
                        end_date: activePayment.subscription_end
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