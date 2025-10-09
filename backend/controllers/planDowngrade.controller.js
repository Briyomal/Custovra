import { Form } from "../models/Form.js";
import { User } from "../models/User.js";
import { getUserPlanLimits } from "../middleware/checkSubscriptionLimits.js";
import { subscriptionPlans } from "../utils/subscriptionPlans.js";

/**
 * Plan Downgrade Protection Controller
 * Handles user plan downgrades and form limit enforcement
 */

// Check if user needs to manage forms due to plan downgrade
export const checkDowngradeImpact = async (req, res) => {
    try {
        const userId = req.userId;

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

        // Get user's current active forms
        const activeForms = await Form.find({
            user_id: userId,
            is_active: true
        }).sort({ createdAt: -1 }); // Most recent first

        const currentFormCount = activeForms.length;
        const newPlanLimit = limits.formLimit;
        const isDowngrade = currentFormCount > newPlanLimit;

        if (!isDowngrade) {
            return res.status(200).json({
                success: true,
                data: {
                    requiresAction: false,
                    currentPlan: planName,
                    currentFormCount,
                    newPlanLimit,
                    message: "No action required - your current forms fit within the new plan limits."
                }
            });
        }

        // User has more forms than the new plan allows
        const excessFormCount = currentFormCount - newPlanLimit;

        return res.status(200).json({
            success: true,
            data: {
                requiresAction: true,
                currentPlan: planName,
                currentFormCount,
                newPlanLimit,
                excessFormCount,
                activeForms: activeForms.map(form => ({
                    _id: form._id,
                    form_name: form.form_name,
                    form_note: form.form_note,
                    form_type: form.form_type,
                    // Support both createdAt (new format) and created_at (old format)
                    created_at: form.createdAt || form.created_at,
                    submissionCount: form.submission_count || 0
                })),
                message: `Your ${planName} plan allows only ${newPlanLimit} active form(s). You currently have ${currentFormCount}. Please select which ${newPlanLimit} form(s) to keep active.`
            }
        });

    } catch (error) {
        console.error("Error checking downgrade impact:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while checking downgrade impact"
        });
    }
};

// Handle user's form selection during downgrade
export const handleFormSelection = async (req, res) => {
    try {
        const userId = req.userId;
        const { selectedFormIds } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required"
            });
        }

        if (!selectedFormIds || !Array.isArray(selectedFormIds)) {
            return res.status(400).json({
                success: false,
                error: "Selected form IDs are required and must be an array"
            });
        }

        const { error, limits, planName } = await getUserPlanLimits(userId);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error
            });
        }

        const newPlanLimit = limits.formLimit;

        if (selectedFormIds.length > newPlanLimit) {
            return res.status(400).json({
                success: false,
                error: `You can only select ${newPlanLimit} form(s) for your ${planName} plan.`
            });
        }

        // Verify all selected forms belong to the user
        const selectedForms = await Form.find({
            _id: { $in: selectedFormIds },
            user_id: userId
        });

        if (selectedForms.length !== selectedFormIds.length) {
            return res.status(403).json({
                success: false,
                error: "One or more selected forms do not belong to you"
            });
        }

        // Get all user's forms
        const allUserForms = await Form.find({ user_id: userId });

        // Deactivate all forms first
        await Form.updateMany(
            { user_id: userId },
            { 
                is_active: false,
                lockedAt: new Date(),
                lockReason: `Locked due to downgrade to ${planName} plan`
            }
        );

        // Reactivate only selected forms
        const result = await Form.updateMany(
            { 
                _id: { $in: selectedFormIds },
                user_id: userId 
            },
            { 
                is_active: true,
                $unset: { lockedAt: 1, lockReason: 1 } // Remove lock fields
            }
        );

        // Count forms affected
        const lockedFormCount = allUserForms.length - selectedFormIds.length;

        return res.status(200).json({
            success: true,
            data: {
                message: `Successfully updated form status. ${selectedFormIds.length} form(s) kept active, ${lockedFormCount} form(s) locked.`,
                activeForms: selectedFormIds.length,
                lockedForms: lockedFormCount,
                updatedForms: result.modifiedCount
            }
        });

    } catch (error) {
        console.error("Error handling form selection:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while updating form status"
        });
    }
};

// Auto-handle downgrade (keep most recent forms active)
export const autoHandleDowngrade = async (req, res) => {
    try {
        const userId = req.userId;

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

        const newPlanLimit = limits.formLimit;

        // Get user's forms ordered by creation date (most recent first)
        const userForms = await Form.find({
            user_id: userId,
            is_active: true
        }).sort({ createdAt: -1 });

        if (userForms.length <= newPlanLimit) {
            return res.status(200).json({
                success: true,
                data: {
                    message: "No action needed - current forms fit within plan limits",
                    activeForms: userForms.length,
                    planLimit: newPlanLimit
                }
            });
        }

        // Keep only the most recent forms within the plan limit
        const formsToKeep = userForms.slice(0, newPlanLimit);
        const formsToLock = userForms.slice(newPlanLimit);

        // Deactivate excess forms
        if (formsToLock.length > 0) {
            await Form.updateMany(
                { 
                    _id: { $in: formsToLock.map(f => f._id) },
                    user_id: userId 
                },
                { 
                    is_active: false,
                    lockedAt: new Date(),
                    lockReason: `Auto-locked due to downgrade to ${planName} plan (${newPlanLimit} form limit)`
                }
            );
        }

        return res.status(200).json({
            success: true,
            data: {
                message: `Successfully updated forms. Kept ${formsToKeep.length} most recent form(s) active, locked ${formsToLock.length} older form(s).`,
                activeForms: formsToKeep.length,
                lockedForms: formsToLock.length,
                planName,
                planLimit: newPlanLimit,
                keptForms: formsToKeep.map(form => ({
                    _id: form._id,
                    form_name: form.form_name,
                    // Support both createdAt (new format) and created_at (old format)
                    created_at: form.createdAt || form.created_at
                }))
            }
        });

    } catch (error) {
        console.error("Error auto-handling downgrade:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while auto-handling downgrade"
        });
    }
};

// Get current user's locked forms
export const getLockedForms = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required"
            });
        }

        const lockedForms = await Form.find({
            user_id: userId,
            is_active: false,
            lockedAt: { $exists: true }
        }).sort({ lockedAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                lockedForms: lockedForms.map(form => ({
                    _id: form._id,
                    form_name: form.form_name,
                    form_type: form.form_type,
                    // Support both createdAt (new format) and created_at (old format)
                    created_at: form.createdAt || form.created_at,
                    lockedAt: form.lockedAt,
                    lockReason: form.lockReason
                })),
                count: lockedForms.length
            }
        });

    } catch (error) {
        console.error("Error getting locked forms:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while getting locked forms"
        });
    }
};