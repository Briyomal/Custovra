import { User } from "../models/User.js";
import { Form } from "../models/Form.js";
import { Submission } from "../models/Submission.js";
import { Subscription } from "../models/Subscription.js";
import { fetchMeterUsageFromPolar } from "../services/polarMeter.service.js";
 

/**
 * Subscription Limits Middleware
 * Enforces form creation and monthly submission limits based on user's subscription plan
 */

// Helper function to get user's current plan limits
export const getUserPlanLimits = async (userId) => {
    try {
        const now = new Date();
        const user = await User.findById(userId);
        if (!user || !user.is_active) {
            return { error: "User not found or inactive", limits: null };
        }

        // Check for active or cancelled (but not yet expired) Polar Subscription
        // We sort by creation date desc to get the most recent valid one
        const activeSubscription = await Subscription.findOne({
            user_id: userId,
            status: { $in: ['active', 'trialing', 'cancelled'] },
            subscription_end: { $gt: now }
        }).sort({ created_at: -1 });

        if (activeSubscription) {
             const limits = {
                formLimit: activeSubscription.form_limit || 0,  // Limits come from Polar meter/benefits
                submissionLimit: activeSubscription.submission_limit || 0,  // Limits come from Polar meter/benefits
                imageUpload: activeSubscription.features?.image_upload || false,
                employeeManagement: activeSubscription.features?.employee_management || false
            };

            const planName = activeSubscription.plan_name || 'Active Plan';
            
            // console.log(`User ${userId} has active subscription: ${planName}`, limits); // Optional debug

            return {
                error: null,
                limits,
                planName: planName,
                user,
                activePayment: activeSubscription
            };
        }

        // If no active subscription, no access (must subscribe)
        const limits = {
            formLimit: 0,
            submissionLimit: 0,
            imageUpload: false,
            employeeManagement: false
        };

        return {
            error: null,
            limits,
            planName: 'No Plan',
            user,
            activePayment: null
        };
    } catch (error) {
        console.error("Error getting user plan limits:", error);
        return { error: "Database error: " + error.message, limits: null };
    }
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

        // NEW: Instead of blocking, allow creation but flag overage
        const includedForms = limits.formLimit;
        const willExceedLimit = currentFormCount >= includedForms;

        // Add info to request for controller to use
        // Note: Overage pricing is handled by Polar metered billing, not hardcoded here
        req.userPlan = {
            limits,
            planName,
            formUsage: {
                current: currentFormCount,
                included: includedForms,
                willBeOverage: willExceedLimit,
                overageCount: willExceedLimit ? (currentFormCount - includedForms + 1) : 0
                // overageCost removed - Polar handles metered billing automatically
            }
        };

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

        // Fetch Polar meter data for the form owner (source of truth for metered billing)
        const polarMeterData = await fetchMeterUsageFromPolar(formOwnerId);

        let submissionLimit, currentSubmissionCount;

        if (polarMeterData && polarMeterData.submissions) {
            // Use Polar's data (source of truth for metered billing)
            // credited_units = included submissions in plan
            // consumed_units = current usage
            submissionLimit = polarMeterData.submissions.included;
            currentSubmissionCount = polarMeterData.submissions.current;
            console.log(`✅ checkSubmissionLimit using Polar data: ${currentSubmissionCount}/${submissionLimit}`);
        } else {
            // Fallback to database counts if Polar API fails
            console.log('⚠️ checkSubmissionLimit falling back to database counts');

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            const formOwnerForms = await Form.find({
                user_id: formOwnerId,
                is_active: true
            }).select('_id');

            const formOwnerFormIds = formOwnerForms.map(f => f._id);

            currentSubmissionCount = await Submission.countDocuments({
                form_id: { $in: formOwnerFormIds },
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            });

            submissionLimit = limits.submissionLimit || 1000;
        }

        const remaining = submissionLimit - currentSubmissionCount;

        if (remaining <= 0) {
            // BLOCK submission - limit reached
            return res.status(403).json({
                success: false,
                error: `Submission limit reached. The form owner has used all ${submissionLimit} available submissions this month.`,
                limit: {
                    current: currentSubmissionCount,
                    limit: submissionLimit,
                    remaining: 0,
                    planName,
                    resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
                    message: 'Your monthly submission limit will reset on your next billing date. Additional submissions are automatically charged at $2 per 1,000 submissions.'
                }
            });
        }

        // Add usage info to request
        req.formOwner = {
            userId: formOwnerId,
            plan: { limits, planName },
            submissionUsage: {
                current: currentSubmissionCount,
                limit: submissionLimit,
                remaining
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
        const { error, limits, planName, user, activePayment } = await getUserPlanLimits(userId);

        if (error) {
            console.error('Error in getUserPlanLimits:', error);
            return { error, stats: null };
        }

        // Fetch meter usage from Polar API (source of truth for billing)
        const polarMeterData = await fetchMeterUsageFromPolar(userId);

        let formCount, submissionCount, includedSubmissions, submissionsOverage;

        if (polarMeterData) {
            // Use Polar's meter data (matches what customer sees in Polar portal)
            console.log('✅ Using Polar meter data for usage stats');
            formCount = polarMeterData.forms.current;
            submissionCount = polarMeterData.submissions.current;
            includedSubmissions = polarMeterData.submissions.included;
            submissionsOverage = polarMeterData.submissions.overage;

            const stats = {
                planName,
                limits,
                usage: {
                    forms: {
                        current: polarMeterData.forms.current,
                        included: polarMeterData.forms.included,
                        overage: polarMeterData.forms.overage,
                        maximum: limits.formLimit,
                        remaining: Math.max(0, polarMeterData.forms.included - polarMeterData.forms.current)
                    },
                    submissions: {
                        current: polarMeterData.submissions.current,
                        included: polarMeterData.submissions.included,
                        used: polarMeterData.submissions.current,
                        overage: polarMeterData.submissions.overage,
                        maximum: limits.submissionLimit,
                        remaining: Math.max(0, polarMeterData.submissions.included - polarMeterData.submissions.current),
                        resetDate: polarMeterData.periodEnd || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
                    }
                },
                meterData: polarMeterData,
                source: 'polar_api' // Indicate data source
            };

            return { error: null, stats };

        } else {
            // Fallback to database counts if Polar API fails
            console.log('⚠️ Falling back to database counts for usage stats');

            // Get form count (only active forms)
            formCount = await Form.countDocuments({
                user_id: userId,
                is_active: true
            });

            // Get current month's submission count for all ACTIVE forms owned by this user
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            // Get all ACTIVE forms owned by this user
            const userForms = await Form.find({
                user_id: userId,
                is_active: true
            }).select('_id');

            const userFormIds = userForms.map(f => f._id);

            // Count submissions to all ACTIVE forms owned by this user this month
            submissionCount = await Submission.countDocuments({
                form_id: { $in: userFormIds },
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            });

            // Extract meter data from subscription (for Polar metered billing)
            const meterData = activePayment ? {
                forms_overage: activePayment.meter_usage_current_cycle?.forms_overage || 0,
                submissions_used: activePayment.meter_usage_current_cycle?.submissions_used || 0,
                last_reset_date: activePayment.meter_usage_current_cycle?.last_reset_date || null,
                purchased_submission_packs: activePayment.purchased_submission_packs || 0
            } : null;

            // Calculate included submissions (base limit + purchased packs)
            includedSubmissions = limits.submissionLimit + (meterData?.purchased_submission_packs || 0) * 1000;

            // Calculate overage for submissions (submissions beyond included amount)
            submissionsOverage = Math.max(0, submissionCount - includedSubmissions);

            const stats = {
                planName,
                limits,
                usage: {
                    forms: {
                        current: formCount,
                        included: limits.formLimit,
                        overage: meterData ? meterData.forms_overage : Math.max(0, formCount - limits.formLimit),
                        maximum: limits.formLimit,
                        remaining: Math.max(0, limits.formLimit - formCount)
                    },
                    submissions: {
                        current: submissionCount,
                        included: includedSubmissions,
                        used: meterData ? meterData.submissions_used : submissionCount,
                        overage: submissionsOverage,
                        maximum: limits.submissionLimit,
                        remaining: Math.max(0, includedSubmissions - submissionCount),
                        resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
                    }
                },
                meterData,
                source: 'database_fallback'
            };

            return { error: null, stats };
        }

    } catch (error) {
        console.error("Error getting user usage stats:", error);
        return { error: "Database error: " + error.message, stats: null };
    }
};