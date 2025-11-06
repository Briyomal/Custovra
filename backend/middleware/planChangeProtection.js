import { Form } from "../models/Form.js";
import { getUserPlanLimits } from "./checkSubscriptionLimits.js";

/**
 * Helper function to compare plans and determine if it's an upgrade or downgrade
 * @param {string} fromPlanName - Name of the previous plan
 * @param {string} toPlanName - Name of the new plan
 * @returns {Object} - Comparison result
 */
const comparePlans = (fromPlanName, toPlanName) => {
  // For manual plans, we'll use a simple approach based on common plan names
  // This is a simplified version since we don't have predefined plan limits anymore
  
  // Normalize plan names to lowercase and remove extra spaces
  const normalizePlanName = (name) => {
    if (!name) return 'basic';
    return name.toLowerCase().replace(/\s+/g, '').trim();
  };

  const normalizedFrom = normalizePlanName(fromPlanName);
  const normalizedTo = normalizePlanName(toPlanName);

  // Simple mapping for common plan names to "tiers"
  const planTiers = {
    // Basic tier
    'basic': 1,
    'bronze': 1,
    
    // Standard tier
    'standard': 2,
    'silver': 2,
    
    // Premium tier
    'premium': 3,
    'gold': 3,
    'platinum': 3,
    'diamond': 3,
    
    // Enterprise tier (if exists)
    'enterprise': 4,
    'business': 4
  };

  const fromTier = planTiers[normalizedFrom] || 1;
  const toTier = planTiers[normalizedTo] || 1;

  return {
    isUpgrade: toTier > fromTier,
    isDowngrade: toTier < fromTier,
    isSamePlan: toTier === fromTier,
    fromTier,
    toTier
  };
};

/**
 * Middleware to handle automatic plan downgrade protection
 * This can be used in webhook handlers when subscription changes occur
 */

export const handlePlanChangeProtection = async (userId, previousPlanName = null, autoHandle = false) => {
    try {
        console.log(`Checking plan change protection for user ${userId}...`);
        console.log(`Previous plan: ${previousPlanName}, autoHandle: ${autoHandle}`);

        // Get current plan limits
        const { error, limits, planName } = await getUserPlanLimits(userId);
        
        if (error) {
            console.error(`Error getting plan limits for user ${userId}:`, error);
            return { success: false, error };
        }

        console.log(`User ${userId} current plan: ${planName}, form limit: ${limits.formLimit}`);

        // If no previous plan provided, we can't determine if it's upgrade/downgrade
        if (!previousPlanName) {
            console.log('No previous plan name provided, skipping plan change protection');
            return { 
                success: true, 
                requiresAction: false,
                message: 'No previous plan information available'
            };
        }

        // Compare plans to determine if it's an upgrade or downgrade
        const planComparison = comparePlans(previousPlanName, planName);
        console.log('🔍 DETAILED Plan comparison result:');
        console.log('  - previousPlanName:', previousPlanName);
        console.log('  - planName:', planName);
        console.log('  - isUpgrade:', planComparison.isUpgrade);
        console.log('  - isDowngrade:', planComparison.isDowngrade);
        console.log('  - isSamePlan:', planComparison.isSamePlan);
        console.log('  - fromLimit:', planComparison.fromLimit);
        console.log('  - toLimit:', planComparison.toLimit);

        // Get user's current active forms
        const activeForms = await Form.find({
            user_id: userId,
            is_active: true
        }).sort({ createdAt: -1 }); // Most recent first

        // Get user's locked forms (for potential unlocking)
        const lockedForms = await Form.find({
            user_id: userId,
            is_active: false,
            lockedAt: { $exists: true }
        }).sort({ createdAt: -1 });

        const currentFormCount = activeForms.length;
        const newPlanLimit = limits.formLimit;
        const totalFormsCount = currentFormCount + lockedForms.length;

        console.log(`User ${userId} has ${currentFormCount} active forms, ${lockedForms.length} locked forms, new plan allows ${newPlanLimit}`);

        // Handle upgrades (can unlock some forms)
        if (planComparison.isUpgrade && currentFormCount < newPlanLimit && lockedForms.length > 0) {
            const canUnlock = Math.min(newPlanLimit - currentFormCount, lockedForms.length);
            
            if (autoHandle) {
                // Auto-unlock the most recent locked forms
                const formsToUnlock = lockedForms.slice(0, canUnlock);
                
                if (formsToUnlock.length > 0) {
                    await Form.updateMany(
                        { 
                            _id: { $in: formsToUnlock.map(f => f._id) },
                            user_id: userId 
                        },
                        { 
                            $set: { is_active: true, is_locked: false },
                            $unset: { lockedAt: "", lockReason: "" }
                        }
                    );
                    
                    console.log(`Auto-unlocked ${formsToUnlock.length} forms for user ${userId}`);
                }
                
                return {
                    success: true,
                    requiresAction: true,
                    autoHandled: true,
                    isUpgrade: true,
                    planName,
                    previousPlanName,
                    activeForms: currentFormCount + formsToUnlock.length,
                    unlockedForms: formsToUnlock.length,
                    message: `Plan upgraded to ${planName}. Automatically unlocked ${formsToUnlock.length} form(s). You now have ${currentFormCount + formsToUnlock.length} active forms.`,
                    details: {
                        unlockedForms: formsToUnlock.map(f => ({ id: f._id, name: f.form_name }))
                    }
                };
            } else {
                // Return info for potential unlocking (frontend can show notification)
                return {
                    success: true,
                    requiresAction: false,
                    isUpgrade: true,
                    planName,
                    previousPlanName,
                    activeForms: currentFormCount,
                    canUnlockForms: canUnlock,
                    message: `Plan upgraded to ${planName}. You can now activate ${canUnlock} more form(s).`
                };
            }
        }

        // Handle downgrades (need to lock excess forms)
        if (planComparison.isDowngrade && currentFormCount > newPlanLimit) {
            const excessFormCount = currentFormCount - newPlanLimit;
            console.log(`🔴 DOWNGRADE DETECTED for user ${userId}:`);
            console.log(`  - Current active forms: ${currentFormCount}`);
            console.log(`  - New plan limit: ${newPlanLimit}`);
            console.log(`  - Excess forms: ${excessFormCount}`);
            console.log(`  - autoHandle: ${autoHandle}`);
            console.log(`  - Need to handle ${excessFormCount} forms`);

            if (autoHandle) {
                // Auto-lock the oldest forms (keep the most recent ones active)
                const formsToKeep = activeForms.slice(0, newPlanLimit);
                const formsToLock = activeForms.slice(newPlanLimit);

                if (formsToLock.length > 0) {
                    const lockResult = await Form.updateMany(
                        { 
                            _id: { $in: formsToLock.map(f => f._id) },
                            user_id: userId 
                        },
                        { 
                            is_locked: true,
                            lockedAt: new Date(),
                            lockReason: `Auto-locked due to plan change to ${planName} (limit: ${newPlanLimit} forms)`
                        }
                    );

                    console.log(`Auto-locked ${lockResult.modifiedCount} forms for user ${userId}`);
                }

                return {
                    success: true,
                    requiresAction: true,
                    autoHandled: true,
                    isDowngrade: true,
                    planName,
                    previousPlanName,
                    activeForms: formsToKeep.length,
                    lockedForms: formsToLock.length,
                    message: `Plan changed to ${planName}. Automatically kept ${formsToKeep.length} most recent forms active and locked ${formsToLock.length} older forms.`,
                    details: {
                        keptForms: formsToKeep.map(f => ({ id: f._id, name: f.form_name })),
                        lockedForms: formsToLock.map(f => ({ id: f._id, name: f.form_name }))
                    }
                };
            } else {
                // Return info for manual form selection
                return {
                    success: true,
                    requiresAction: true,
                    autoHandled: false,
                    isDowngrade: true,
                    planName,
                    previousPlanName,
                    currentPlan: planName,
                    newPlanLimit,
                    currentFormCount,
                    excessFormCount,
                    activeForms: activeForms.map(form => ({
                        _id: form._id,
                        form_name: form.form_name,
                        form_note: form.form_note,
                        form_type: form.form_type,
                        // Support both createdAt (new format) and created_at (old format)
                        created_at: form.createdAt || form.created_at,
                        submissionCount: form.submissionCount || 0
                    })),
                    message: `Your ${planName} plan allows only ${newPlanLimit} active form(s). You currently have ${currentFormCount}. Please select which forms will remain active and which will be locked.`
                };
            }
        }

        // No action needed - either same plan or forms fit within limits
        console.log(`🟡 No plan change protection needed for user ${userId}`);
        console.log(`🔍 Final analysis:`);
        console.log(`  - planComparison.isDowngrade: ${planComparison.isDowngrade}`);
        console.log(`  - currentFormCount: ${currentFormCount}`);
        console.log(`  - newPlanLimit: ${newPlanLimit}`);
        console.log(`  - currentFormCount > newPlanLimit: ${currentFormCount > newPlanLimit}`);
        
        if (planComparison.isDowngrade && currentFormCount <= newPlanLimit) {
            console.log(`🟠 DOWNGRADE BUT NO ACTION NEEDED: User has ${currentFormCount} forms, new plan allows ${newPlanLimit}`);
        }
        return { 
            success: true, 
            requiresAction: false,
            planName,
            previousPlanName,
            isUpgrade: planComparison.isUpgrade,
            isDowngrade: planComparison.isDowngrade,
            isSamePlan: planComparison.isSamePlan,
            message: planComparison.isSamePlan ? 
                'No action required - same plan selected' : 
                'No action required - current forms fit within new plan limits'
        };

    } catch (error) {
        console.error(`Error handling plan change protection for user ${userId}:`, error);
        return { 
            success: false, 
            error: 'Failed to handle plan change protection',
            details: error.message 
        };
    }
};

/**
 * Express middleware wrapper for plan change protection
 * Can be used in routes that handle plan changes
 */
export const planChangeProtectionMiddleware = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { previousPlanName } = req.body;

        if (!userId) {
            return next(); // Skip if no user ID
        }

        const result = await handlePlanChangeProtection(userId, previousPlanName);
        
        // Add result to request for controller to access
        req.planChangeResult = result;
        
        next();

    } catch (error) {
        console.error('Error in plan change protection middleware:', error);
        // Don't fail the request, just log and continue
        req.planChangeResult = { success: false, error: error.message };
        next();
    }
};