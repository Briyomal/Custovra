import { User } from "../models/User.js";
import { Form } from "../models/Form.js";
import { Submission } from "../models/Submission.js";
import { Payment } from "../models/Payment.js";
import { subscriptionPlans } from "../utils/subscriptionPlans.js";

/**
 * Subscription Limits Middleware
 * Enforces form creation and monthly submission limits based on user's subscription plan
 */

// Helper function to get user's current plan limits
export const getUserPlanLimits = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.is_active) {
            return { error: "User not found or inactive", limits: null };
        }

        // Get the user's ACTIVE subscription from Payment model
        const now = new Date();
        const activePayment = await Payment.findOne({
            user_id: userId,
            subscription_expiry: { $gt: now } // Only get non-expired subscriptions
        }).sort({ subscription_expiry: -1 }); // Get the latest expiring active subscription

        let planName = 'basic'; // Default plan
        
        if (activePayment) {
            // Map the payment plan to our internal plan names
            planName = mapSubscriptionToPlan(activePayment.plan) || 'basic';
            console.log(`User ${userId} has active subscription:`, {
                plan: activePayment.plan,
                mappedPlan: planName,
                expiry: activePayment.subscription_expiry
            });
        } else {
            console.log(`User ${userId} has no active subscription, defaulting to basic plan`);
        }

        const limits = subscriptionPlans[planName];
        if (!limits) {
            console.error(`Invalid subscription plan: ${planName}`);
            return { error: "Invalid subscription plan", limits: null };
        }

        return { 
            error: null, 
            limits,
            planName,
            user,
            activePayment
        };
    } catch (error) {
        console.error("Error getting user plan limits:", error);
        return { error: "Database error: " + error.message, limits: null };
    }
};

// Helper function to map Stripe subscription to plan name
const mapSubscriptionToPlan = (subscriptionPlan) => {
    // This mapping should match your Stripe product IDs and plan names
    // Convert to lowercase for consistent comparison
    const planLower = subscriptionPlan?.toLowerCase() || '';
    
    const planMapping = {
        // Stripe Product IDs
        'prod_rfhrlxbtwahvvp': 'basic',
        'prod_rfhs1fdl0jh7ko': 'standard', 
        'prod_rfhsbfqkcmzsik': 'premium',
        
        // Plan names (case insensitive)
        'basic': 'basic',
        'standard': 'standard',
        'premium': 'premium',
        
        // Alternative naming
        'basic plan': 'basic',
        'standard plan': 'standard',
        'premium plan': 'premium',
        
        // Handle subscription IDs that might contain plan info
        // Add more mappings as needed based on your Stripe setup
    };
    
    // First try exact match
    if (planMapping[planLower]) {
        return planMapping[planLower];
    }
    
    // Try partial matching for plan names
    if (planLower.includes('standard')) return 'standard';
    if (planLower.includes('premium')) return 'premium';
    if (planLower.includes('basic')) return 'basic';
    
    // Default to basic if no match found
    console.warn(`Unknown subscription plan: ${subscriptionPlan}, defaulting to basic`);
    return 'basic';
};

// Middleware to check form creation limits
export const checkFormCreationLimit = async (req, res, next) => {
    try {
        const userId = req.userId; // Assuming this is set by auth middleware

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                error: "Authentication required" 
            });
        }

        const { error, limits, planName } = await getUserPlanLimits(userId);
        
        if (error) {
            return res.status(400).json({ 
                success: false, 
                error 
            });
        }

        // Count current forms for this user
        const currentFormCount = await Form.countDocuments({ 
            user_id: userId,
            is_active: true // Only count active forms
        });

        if (currentFormCount >= limits.formLimit) {
            return res.status(403).json({
                success: false,
                error: `Form creation limit exceeded. Your ${planName} plan allows ${limits.formLimit} form(s). You currently have ${currentFormCount} active forms.`,
                limit: {
                    current: currentFormCount,
                    maximum: limits.formLimit,
                    planName
                }
            });
        }

        // Add plan info to request for use in controller
        req.userPlan = { limits, planName };
        next();

    } catch (error) {
        console.error("Error checking form creation limit:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while checking form limits" 
        });
    }
};

// Middleware to check monthly submission limits
// Handles both authenticated (form owner) and public (form submitter) requests
export const checkSubmissionLimit = async (req, res, next) => {
    try {
        const { form_id } = req.body || req.params;

        // Get form first to determine the form owner
        const form = await Form.findById(form_id);
        if (!form) {
            return res.status(404).json({ 
                success: false, 
                error: "Form not found" 
            });
        }

        // For submission limits, we check against the form owner's plan
        // regardless of who is submitting (authenticated user or public user)
        const formOwnerId = form.user_id;
        
        const { error, limits, planName } = await getUserPlanLimits(formOwnerId);
        
        if (error) {
            return res.status(400).json({ 
                success: false, 
                error 
            });
        }

        // Get current month's submission count for the form owner
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of month

        // Count submissions to all ACTIVE forms owned by the form owner this month
        const formOwnerForms = await Form.find({ 
            user_id: formOwnerId,
            is_active: true 
        }).select('_id');
        
        const formOwnerFormIds = formOwnerForms.map(f => f._id);

        const currentSubmissionCount = await Submission.countDocuments({
            form_id: { $in: formOwnerFormIds },
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        if (currentSubmissionCount >= limits.submissionLimit) {
            return res.status(403).json({
                success: false,
                error: `Form submission limit exceeded. The form owner's ${planName} plan allows ${limits.submissionLimit} submissions per month. ${currentSubmissionCount} submissions have been used this month.`,
                limit: {
                    current: currentSubmissionCount,
                    maximum: limits.submissionLimit,
                    planName,
                    resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
                }
            });
        }

        // Add plan and usage info to request for the form owner
        req.formOwner = {
            userId: formOwnerId,
            plan: { limits, planName },
            submissionUsage: {
                current: currentSubmissionCount,
                remaining: limits.submissionLimit - currentSubmissionCount
            }
        };
        
        next();

    } catch (error) {
        console.error("Error checking submission limit:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while checking submission limits" 
        });
    }
};

// Utility function to get current usage stats for a user
export const getUserUsageStats = async (userId) => {
    try {
        const { error, limits, planName, user } = await getUserPlanLimits(userId);
        
        if (error) {
            console.error('Error in getUserPlanLimits:', error);
            return { error, stats: null };
        }

        // Get form count (only active forms)
        const formCount = await Form.countDocuments({ 
            user_id: userId,
            is_active: true 
        });

        // Get current month's submission count for all ACTIVE forms owned by this user
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of month

        // Get all ACTIVE forms owned by this user
        const userForms = await Form.find({ 
            user_id: userId,
            is_active: true 
        }).select('_id');
        
        const userFormIds = userForms.map(f => f._id);

        // Count submissions to all ACTIVE forms owned by this user this month
        const submissionCount = await Submission.countDocuments({
            form_id: { $in: userFormIds },
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        const stats = {
            planName,
            limits,
            usage: {
                forms: {
                    current: formCount,
                    maximum: limits.formLimit,
                    remaining: Math.max(0, limits.formLimit - formCount)
                },
                submissions: {
                    current: submissionCount,
                    maximum: limits.submissionLimit,
                    remaining: Math.max(0, limits.submissionLimit - submissionCount),
                    resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
                }
            }
        };

        return { error: null, stats };

    } catch (error) {
        console.error("Error getting user usage stats:", error);
        return { error: "Database error: " + error.message, stats: null };
    }
};