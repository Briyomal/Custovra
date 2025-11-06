import { ManualPayment } from "../models/ManualPayment.js";
import { ManualSubscription } from "../models/ManualSubscription.js";
import { ManualPlan } from "../models/ManualPlan.js";
import { User } from "../models/User.js";
import { Form } from "../models/Form.js";
import { Payment } from "../models/Payment.js";

// Get current subscription details
export const getManualSubscriptionDetails = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Get user's manual subscription
        const subscription = await ManualSubscription.findOne({ user_id: userId })
            .populate('plan_id', 'name description features form_limit price_monthly price_yearly');

        // Get user's most recent payment
        const recentPayment = await ManualPayment.findOne({ user_id: userId })
            .sort({ created_at: -1 });

        // Get user's forms count
        const formCount = await Form.countDocuments({ user_id: userId });

        const subscriptionDetails = {
            subscription: subscription || null,
            payment: recentPayment || null,
            formCount: formCount,
            user: {
                name: user.name,
                email: user.email,
                subscription_plan: user.subscription_plan,
                subscription_status: user.subscription_status,
                subscription_expiry: user.subscription_expiry,
                is_active: user.is_active
            }
        };

        res.json({ success: true, data: subscriptionDetails });
    } catch (error) {
        console.error('Error getting subscription details:', error);
        res.status(500).json({ error: 'Failed to get subscription details: ' + error.message });
    }
};

// Get payment history
export const getManualPaymentHistory = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        // Get manual payments for this user
        const manualPayments = await ManualPayment.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(20);

        // Format payment history
        const paymentHistory = manualPayments.map(payment => ({
            id: payment._id,
            source: 'manual',
            amount: payment.amount,
            currency: 'lkr',
            status: payment.payment_status,
            date: payment.created_at,
            plan: payment.plan_name,
            description: `${payment.plan_name} (${payment.billing_period})`,
            billing_period: payment.billing_period,
            payment_method: payment.payment_method
        }));

        // Sort by date (newest first)
        const sortedPayments = paymentHistory
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, data: sortedPayments });
    } catch (error) {
        console.error('Error getting payment history:', error);
        res.status(500).json({ error: 'Failed to get payment history.' });
    }
};

// Get available subscription plans
export const getManualAvailablePlans = async (req, res) => {
    try {
        // Get all active manual plans
        const plans = await ManualPlan.find({ is_active: true });

        // Format plans for frontend
        const subscriptionPlans = plans.map(plan => ({
            id: plan._id,
            name: plan.name,
            description: plan.description,
            price_monthly: plan.price_monthly,
            price_yearly: plan.price_yearly,
            form_limit: plan.form_limit,
            submission_limit: plan.submission_limit,
            features: plan.features,
            is_active: plan.is_active
        })).sort((a, b) => a.price_monthly - b.price_monthly);

        res.json({ success: true, data: subscriptionPlans });
    } catch (error) {
        console.error('Error getting available plans:', error);
        res.status(500).json({ error: 'Failed to get available plans.' });
    }
};

// Create a new manual payment request
export const createManualPaymentRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { planId, billingPeriod, paymentMethod, paymentProof, formSelection } = req.body;

        console.log('Creating payment request with data:', { planId, billingPeriod, paymentMethod, userId, formSelection });

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        // Get plan details
        const plan = await ManualPlan.findById(planId);
        if (!plan) {
            console.log('Plan not found for ID:', planId);
            return res.status(404).json({ error: 'Plan not found.' });
        }

        console.log('Found plan:', plan.name);

        // Calculate amount
        const amount = billingPeriod === 'yearly' ? plan.price_yearly : plan.price_monthly;

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        if (billingPeriod === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Create payment request
        const paymentData = {
            user_id: userId,
            plan_id: planId,
            plan_name: plan.name,
            amount: amount,
            payment_method: paymentMethod,
            payment_proof: paymentProof,
            payment_status: 'pending',
            billing_period: billingPeriod,
            subscription_start: startDate,
            subscription_end: endDate,
            // Store form selection data for processing after payment approval
            form_selection: formSelection ? JSON.parse(formSelection) : null
        };

        const newPayment = new ManualPayment(paymentData);
        await newPayment.save();

        res.json({ 
            success: true, 
            data: newPayment,
            message: 'Payment request submitted successfully. Awaiting admin approval.' 
        });
    } catch (error) {
        console.error('Error creating payment request:', error);
        res.status(500).json({ error: 'Failed to create payment request.' });
    }
};

// Get user's pending payment requests
export const getUserPendingPayments = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        // Get pending payments for this user
        const pendingPayments = await ManualPayment.find({ 
            user_id: userId, 
            payment_status: 'pending' 
        }).sort({ created_at: -1 });

        res.json({ success: true, data: pendingPayments });
    } catch (error) {
        console.error('Error getting pending payments:', error);
        res.status(500).json({ error: 'Failed to get pending payments.' });
    }
};

// Cancel a pending payment request
export const cancelManualPaymentRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { paymentId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        // Find the payment and check ownership
        const payment = await ManualPayment.findOne({ 
            _id: paymentId, 
            user_id: userId,
            payment_status: 'pending'
        });

        if (!payment) {
            return res.status(404).json({ error: 'Pending payment request not found.' });
        }

        // Update payment status
        payment.payment_status = 'cancelled';
        await payment.save();

        res.json({ 
            success: true, 
            message: 'Payment request cancelled successfully.' 
        });
    } catch (error) {
        console.error('Error cancelling payment request:', error);
        res.status(500).json({ error: 'Failed to cancel payment request.' });
    }
};

// Process form selection after payment approval
export const processFormSelectionAfterPayment = async (userId, formSelection) => {
    try {
        console.log('Processing form selection after payment approval for user:', userId, 'formSelection:', formSelection);
        
        if (!formSelection || !formSelection.selectedFormIds || !Array.isArray(formSelection.selectedFormIds)) {
            console.log('No valid form selection data provided');
            return { success: true, message: 'No form selection to process' };
        }
        
        const { selectedFormIds, isUpgrade, targetPlanId } = formSelection;
        
        if (isUpgrade) {
            // For upgrades, unlock all selected forms
            const unlockResult = await Form.updateMany(
                { 
                    _id: { $in: selectedFormIds },
                    user_id: userId 
                },
                { 
                    is_locked: false,
                    $unset: { lockedAt: 1, lockReason: 1 } // Remove lock fields
                }
            );
            
            console.log('Unlock result for upgrade:', unlockResult);
            
            // Update the manual subscription with selected forms
            const manualSubscription = await ManualSubscription.findOne({ 
                user_id: userId, 
                status: 'active' 
            });
            
            if (manualSubscription) {
                const existingSelectedForms = manualSubscription.forms_selected || [];
                const updatedSelectedForms = [...new Set([...existingSelectedForms, ...selectedFormIds])];
                manualSubscription.forms_selected = updatedSelectedForms;
                await manualSubscription.save();
                console.log('Updated manual subscription with selected forms:', updatedSelectedForms);
            }
            
            return { 
                success: true, 
                message: `Successfully unlocked ${selectedFormIds.length} form(s) after payment approval.`,
                unlockedForms: selectedFormIds.length
            };
        } else {
            // For downgrades, lock/unlock forms based on selection
            // Get all user's active forms
            const allActiveForms = await Form.find({ 
                user_id: userId, 
                is_active: true 
            });
            
            // Check if we have more active forms than the new plan allows
            const targetPlan = await ManualPlan.findById(targetPlanId);
            if (!targetPlan) {
                throw new Error('Target plan not found');
            }
            
            const newPlanLimit = targetPlan.form_limit;
            
            // Lock the forms that are active but not selected
            const formsToLock = allActiveForms.filter(form => !selectedFormIds.includes(form._id.toString()));
            
            console.log('Forms to lock for downgrade:', formsToLock.map(f => ({ id: f._id, name: f.form_name })));
            
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
                        lockReason: `Locked due to downgrade to ${targetPlan.name} plan`
                    }
                );
                console.log('Lock result for downgrade:', lockResult);
            }
            
            // Unlock the selected forms (just in case they were locked)
            const unlockResult = await Form.updateMany(
                { 
                    _id: { $in: selectedFormIds },
                    user_id: userId 
                },
                { 
                    is_locked: false,
                    $unset: { lockedAt: 1, lockReason: 1 } // Remove lock fields
                }
            );
            
            console.log('Unlock result for downgrade:', unlockResult);
            
            // Update the manual subscription with selected forms
            const manualSubscription = await ManualSubscription.findOne({ 
                user_id: userId, 
                status: 'active' 
            });
            
            if (manualSubscription) {
                manualSubscription.forms_selected = selectedFormIds;
                await manualSubscription.save();
                console.log('Updated manual subscription with selected forms:', selectedFormIds);
            }
            
            // Count forms that should be locked (the excess forms)
            const lockedFormCount = Math.max(0, allActiveForms.length - newPlanLimit);
            
            return { 
                success: true, 
                message: `Successfully updated form status after payment approval. ${selectedFormIds.length} form(s) kept active, ${lockedFormCount} form(s) locked.`,
                activeForms: selectedFormIds.length,
                lockedForms: lockedFormCount
            };
        }
    } catch (error) {
        console.error('Error processing form selection after payment approval:', error);
        return { success: false, error: 'Failed to process form selection after payment approval' };
    }
};
