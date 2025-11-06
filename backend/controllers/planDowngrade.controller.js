import { Form } from "../models/Form.js";
import { User } from "../models/User.js";
import { ManualPlan } from "../models/ManualPlan.js";
import { ManualSubscription } from "../models/ManualSubscription.js";
import { getUserPlanLimits } from "../middleware/checkSubscriptionLimits.js";

/**
 * Plan Downgrade Protection Controller
 * Handles user plan downgrades and form limit enforcement
 */

// Check if user needs to manage forms due to plan downgrade
export const checkDowngradeImpact = async (req, res) => {
    try {
        const userId = req.userId;
        const { targetPlanId } = req.query; // Get target plan ID from query parameters

        console.log('Checking downgrade impact for user:', userId, 'targetPlanId:', targetPlanId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required"
            });
        }

        // Get user's manual subscription
        const manualSubscription = await ManualSubscription.findOne({ 
            user_id: userId, 
            status: 'active' 
        }).populate('plan_id');

        if (!manualSubscription || !manualSubscription.plan_id) {
            return res.status(400).json({
                success: false,
                error: "Active manual subscription not found"
            });
        }

        // Get current plan limits from manual subscription
        const currentLimits = {
            formLimit: manualSubscription.plan_id.form_limit,
            submissionLimit: manualSubscription.plan_id.submission_limit
        };
        const currentPlanName = manualSubscription.plan_id.name;

        console.log('User current plan:', currentPlanName, 'limits:', currentLimits);

        // If targetPlanId is provided, get target plan limits
        let targetPlanLimits = currentLimits;
        let targetPlanName = currentPlanName;
        
        if (targetPlanId) {
            const targetPlan = await ManualPlan.findById(targetPlanId);
            if (targetPlan) {
                targetPlanLimits = {
                    formLimit: targetPlan.form_limit,
                    submissionLimit: targetPlan.submission_limit
                };
                targetPlanName = targetPlan.name;
                console.log('Target plan:', targetPlanName, 'limits:', targetPlanLimits);
            } else {
                console.log('Target plan not found for ID:', targetPlanId);
            }
        }

        // Get user's current active forms (all active forms, regardless of lock status)
        const activeForms = await Form.find({
            user_id: userId,
            is_active: true
        }).sort({ createdAt: -1 }); // Most recent first

        console.log('Found active forms for user:', userId, 'count:', activeForms.length);
        console.log('Active forms details:', activeForms.map(f => ({ id: f._id, name: f.form_name, isActive: f.is_active, isLocked: f.is_locked })));

        // Also get all user's forms for debugging
        const allUserForms = await Form.find({
            user_id: userId
        }).sort({ createdAt: -1 });
        
        console.log('All forms for user:', userId, 'count:', allUserForms.length);
        console.log('All forms details:', allUserForms.map(f => ({ id: f._id, name: f.form_name, isActive: f.is_active, isLocked: f.is_locked, lockedAt: f.lockedAt, lockReason: f.lockReason })));

        const currentFormCount = activeForms.length;
        const newPlanLimit = targetPlanLimits.formLimit;
        // Fix the downgrade detection logic
        // A downgrade occurs when the user has MORE active forms than the new plan allows
        const isDowngrade = currentFormCount > newPlanLimit;

        console.log('Current active forms:', currentFormCount, 'new plan limit:', newPlanLimit, 'is downgrade:', isDowngrade);

        // Additional debugging to check what the user actually has
        if (!isDowngrade && currentFormCount < newPlanLimit) {
            console.log('This is actually an upgrade, not a downgrade');
        } else if (!isDowngrade && currentFormCount === newPlanLimit) {
            console.log('This is the same plan level, no action needed');
        }

        if (!isDowngrade) {
            return res.status(200).json({
                success: true,
                data: {
                    requiresAction: false,
                    currentPlan: currentPlanName,
                    targetPlan: targetPlanName,
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
                currentPlan: currentPlanName,
                targetPlan: targetPlanName,
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
                message: `Your ${currentPlanName} plan allows ${currentFormCount} active form(s), but the new ${targetPlanName} plan only allows ${newPlanLimit} active form(s). Please select which ${newPlanLimit} form(s) will remain active and which ${excessFormCount} will be locked.`
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
        const { selectedFormIds, targetPlanId } = req.body;

        console.log('Handling form selection for user:', userId, 'selectedFormIds:', selectedFormIds, 'targetPlanId:', targetPlanId);

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

        // Get target plan limits
        let targetPlanLimits, targetPlanName;
        if (targetPlanId) {
            const targetPlan = await ManualPlan.findById(targetPlanId);
            if (targetPlan) {
                targetPlanLimits = {
                    formLimit: targetPlan.form_limit,
                    submissionLimit: targetPlan.submission_limit
                };
                targetPlanName = targetPlan.name;
                console.log('Target plan:', targetPlanName, 'limits:', targetPlanLimits);
            } else {
                console.log('Target plan not found for ID:', targetPlanId);
                return res.status(400).json({
                    success: false,
                    error: "Target plan not found"
                });
            }
        } else {
            // Fallback to current plan limits if targetPlanId not provided
            const { error, limits, planName } = await getUserPlanLimits(userId);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    error
                });
            }
            
            targetPlanLimits = limits;
            targetPlanName = planName;
        }

        const newPlanLimit = targetPlanLimits.formLimit;

        if (selectedFormIds.length > newPlanLimit) {
            return res.status(400).json({
                success: false,
                error: `You can only select ${newPlanLimit} form(s) for your ${targetPlanName} plan.`
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

        // Get user's manual subscription
        const manualSubscription = await ManualSubscription.findOne({ 
            user_id: userId, 
            status: 'active' 
        }).populate('plan_id');

        if (!manualSubscription) {
            return res.status(404).json({
                success: false,
                error: "Active manual subscription not found"
            });
        }

        console.log('User manual subscription:', manualSubscription);

        // Get all user's active forms (all active forms, regardless of lock status)
        const allActiveForms = await Form.find({ 
            user_id: userId, 
            is_active: true 
        });

        console.log('All active forms before processing:', allActiveForms.map(f => ({ id: f._id, name: f.form_name, isActive: f.is_active, isLocked: f.is_locked })));

        // Check if we have more active forms than the new plan allows
        // We need to lock forms if the user has more active forms than the new plan limit
        if (allActiveForms.length > newPlanLimit) {
            // Need to lock some forms
            // Lock the forms that are active but not selected
            const formsToLock = allActiveForms.filter(form => !selectedFormIds.includes(form._id.toString()));
            
            console.log('Forms to lock:', formsToLock.map(f => ({ id: f._id, name: f.form_name })));
            
            // Lock the unselected forms (set is_locked: true, keep is_active status unchanged)
            if (formsToLock.length > 0) {
                const lockResult = await Form.updateMany(
                    { 
                        _id: { $in: formsToLock.map(f => f._id) },
                        user_id: userId 
                    },
                    { 
                        is_locked: true,
                        lockedAt: new Date(),
                        lockReason: `Locked due to downgrade to ${targetPlanName} plan`
                    }
                );
                console.log('Lock result:', lockResult);
            }
        }

        // Unlock the selected forms
        const unlockResult = await Form.updateMany(
            { 
                _id: { $in: selectedFormIds },
                user_id: userId 
            },
            { 
                is_locked: false,
                $unset: { lockedAt: 1, lockReason: 1 } // Remove lock fields
                // Note: We don't change is_active status - forms remain in their current publication state
            }
        );
        
        console.log('Unlock result:', unlockResult);

        // Update the manual subscription with selected forms
        manualSubscription.forms_selected = selectedFormIds;
        await manualSubscription.save();
        console.log('Updated manual subscription with selected forms:', selectedFormIds);

        // Count forms that should be locked (the excess forms)
        const lockedFormCount = Math.max(0, allActiveForms.length - newPlanLimit);

        console.log('Form selection handled successfully. Active forms:', selectedFormIds.length, 'Locked forms:', lockedFormCount);

        // Verify the final state
        const finalActiveForms = await Form.find({ 
            user_id: userId, 
            is_active: true 
        });
        
        const finalLockedForms = await Form.find({ 
            user_id: userId, 
            is_locked: true
        });
        
        console.log('Final active forms:', finalActiveForms.map(f => ({ id: f._id, name: f.form_name })));
        console.log('Final locked forms:', finalLockedForms.map(f => ({ id: f._id, name: f.form_name, isLocked: f.is_locked, lockedAt: f.lockedAt, lockReason: f.lockReason })));

        return res.status(200).json({
            success: true,
            data: {
                message: `Successfully updated form status. ${selectedFormIds.length} form(s) kept active, ${lockedFormCount} form(s) locked.`,
                activeForms: selectedFormIds.length,
                lockedForms: lockedFormCount,
                updatedForms: unlockResult.modifiedCount
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
            const lockResult = await Form.updateMany(
                { 
                    _id: { $in: formsToLock.map(f => f._id) },
                    user_id: userId 
                },
                { 
                    is_locked: true,
                    lockedAt: new Date(),
                    lockReason: `Auto-locked due to downgrade to ${planName} plan (${newPlanLimit} form limit)`
                }
            );

            console.log(`Auto-locked ${lockResult.modifiedCount} forms for user ${userId}`);
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
            is_locked: true
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

// Get all user's forms (both locked and unlocked) for upgrade selection
export const getAllUserFormsForUpgrade = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required"
            });
        }

        // Get all user's forms sorted by creation date (most recent first)
        const allForms = await Form.find({
            user_id: userId,
            is_active: true
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                allForms: allForms.map(form => ({
                    _id: form._id,
                    form_name: form.form_name,
                    form_type: form.form_type,
                    // Support both createdAt (new format) and created_at (old format)
                    created_at: form.createdAt || form.created_at,
                    is_locked: form.is_locked,
                    lockedAt: form.lockedAt,
                    lockReason: form.lockReason
                })),
                count: allForms.length
            }
        });

    } catch (error) {
        console.error("Error getting all forms for upgrade:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while getting forms"
        });
    }
};

// Handle user's form selection during upgrade (unlock forms)
export const handleFormSelectionForUpgrade = async (req, res) => {
    try {
        const userId = req.userId;
        const { selectedFormIds, targetPlanId } = req.body;

        console.log('Handling form selection for upgrade for user:', userId, 'selectedFormIds:', selectedFormIds, 'targetPlanId:', targetPlanId);

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

        // Get target plan limits
        let targetPlanLimits, targetPlanName;
        if (targetPlanId) {
            const targetPlan = await ManualPlan.findById(targetPlanId);
            if (targetPlan) {
                targetPlanLimits = {
                    formLimit: targetPlan.form_limit,
                    submissionLimit: targetPlan.submission_limit
                };
                targetPlanName = targetPlan.name;
                console.log('Target plan:', targetPlanName, 'limits:', targetPlanLimits);
            } else {
                console.log('Target plan not found for ID:', targetPlanId);
                return res.status(400).json({
                    success: false,
                    error: "Target plan not found"
                });
            }
        } else {
            // Fallback to current plan limits if targetPlanId not provided
            const { error, limits, planName } = await getUserPlanLimits(userId);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    error
                });
            }
            
            targetPlanLimits = limits;
            targetPlanName = planName;
        }

        const newPlanLimit = targetPlanLimits.formLimit;

        if (selectedFormIds.length > newPlanLimit) {
            return res.status(400).json({
                success: false,
                error: `You can only select ${newPlanLimit} form(s) for your ${targetPlanName} plan.`
            });
        }

        // Verify all selected forms belong to the user (no need to check if they're locked for upgrades)
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

        // Get user's manual subscription
        const manualSubscription = await ManualSubscription.findOne({ 
            user_id: userId, 
            status: 'active' 
        }).populate('plan_id');

        if (!manualSubscription) {
            return res.status(404).json({
                success: false,
                error: "Active manual subscription not found"
            });
        }

        console.log('User manual subscription:', manualSubscription);

        // For upgrades, we want to unlock the selected forms (both previously locked and already unlocked)
        // Unlock the selected forms
        const unlockResult = await Form.updateMany(
            { 
                _id: { $in: selectedFormIds },
                user_id: userId 
            },
            { 
                is_locked: false,
                $unset: { lockedAt: 1, lockReason: 1 } // Remove lock fields
                // Note: We don't change is_active status during upgrade - forms remain in their current state
            }
        );
        
        console.log('Unlock result:', unlockResult);
        
        console.log('Unlock result:', unlockResult);

        // Update the manual subscription with selected forms (add to existing forms_selected or replace if needed)
        // For upgrades, we want to add the newly unlocked forms to the existing selected forms
        const existingSelectedForms = manualSubscription.forms_selected || [];
        const updatedSelectedForms = [...new Set([...existingSelectedForms, ...selectedFormIds])];
        manualSubscription.forms_selected = updatedSelectedForms;
        await manualSubscription.save();
        console.log('Updated manual subscription with selected forms:', updatedSelectedForms);

        // Count forms that were unlocked
        const unlockedFormCount = selectedFormIds.length;

        console.log('Form selection handled successfully for upgrade. Unlocked forms:', unlockedFormCount);

        // Verify the final state
        const finalActiveForms = await Form.find({ 
            user_id: userId, 
            is_active: true 
        });
        
        const finalLockedForms = await Form.find({ 
            user_id: userId, 
            is_locked: true
        });
        
        console.log('Final active forms:', finalActiveForms.map(f => ({ id: f._id, name: f.form_name })));
        console.log('Final locked forms:', finalLockedForms.map(f => ({ id: f._id, name: f.form_name, isLocked: f.is_locked, lockedAt: f.lockedAt, lockReason: f.lockReason })));

        return res.status(200).json({
            success: true,
            data: {
                message: `Successfully updated form status. ${selectedFormIds.length} form(s) unlocked.`,
                unlockedForms: selectedFormIds.length,
                updatedForms: unlockResult.modifiedCount
            }
        });

    } catch (error) {
        console.error("Error handling form selection for upgrade:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while updating form status for upgrade"
        });
    }
};

// Auto-handle upgrade (unlock locked forms up to plan limit)
export const autoHandleUpgrade = async (req, res) => {
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

        // Get user's locked forms ordered by lock date (most recent first)
        const lockedForms = await Form.find({
            user_id: userId,
            is_locked: true
        }).sort({ lockedAt: -1 });

        if (lockedForms.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    message: "No locked forms found to unlock",
                    unlockedForms: 0,
                    planLimit: newPlanLimit
                }
            });
        }

        // Unlock forms up to the plan limit
        const formsToUnlock = lockedForms.slice(0, newPlanLimit);

        // Unlock the forms
        if (formsToUnlock.length > 0) {
            await Form.updateMany(
                { 
                    _id: { $in: formsToUnlock.map(f => f._id) },
                    user_id: userId 
                },
                { 
                    is_locked: false,
                    $unset: { lockedAt: 1, lockReason: 1 } // Remove lock fields
                    // Note: We don't change is_active status - forms remain in their current publication state
                }
            );
        }

        // Get user's manual subscription and update forms_selected
        const manualSubscription = await ManualSubscription.findOne({ 
            user_id: userId, 
            status: 'active' 
        });

        if (manualSubscription) {
            // Add unlocked forms to existing selected forms
            const existingSelectedForms = manualSubscription.forms_selected || [];
            const unlockedFormIds = formsToUnlock.map(f => f._id.toString());
            const updatedSelectedForms = [...new Set([...existingSelectedForms, ...unlockedFormIds])];
            manualSubscription.forms_selected = updatedSelectedForms;
            await manualSubscription.save();
            console.log('Updated manual subscription with newly unlocked forms:', updatedSelectedForms);
        }

        return res.status(200).json({
            success: true,
            data: {
                message: `Successfully unlocked ${formsToUnlock.length} form(s).`,
                unlockedForms: formsToUnlock.length,
                planName,
                planLimit: newPlanLimit,
                unlockedFormsList: formsToUnlock.map(form => ({
                    _id: form._id,
                    form_name: form.form_name,
                    // Support both createdAt (new format) and created_at (old format)
                    created_at: form.createdAt || form.created_at,
                    lockedAt: form.lockedAt
                }))
            }
        });

    } catch (error) {
        console.error("Error auto-handling upgrade:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while auto-handling upgrade"
        });
    }
};
