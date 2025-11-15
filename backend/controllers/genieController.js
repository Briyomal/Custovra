
import genieClient from "../utils/genieClient.js";
import { ManualPlan } from "../models/ManualPlan.js";
import { GeniePayment } from "../models/GeniePayment.js";
import { GenieSubscription } from "../models/GenieSubscription.js";
import { User } from "../models/User.js";
import { Form } from "../models/Form.js";


const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173"; // Fallback URL in case environment variable is not set
// Get user's Genie payment history
export const getGeniePaymentHistory = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        // Get Genie payments for this user
        const geniePayments = await GeniePayment.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(20);

        // Format payment history
        const paymentHistory = geniePayments.map(payment => ({
            id: payment._id,
            source: 'genie',
            amount: payment.amount,
            currency: 'lkr',
            status: payment.payment_status,
            date: payment.created_at,
            plan: payment.plan_name,
            description: `${payment.plan_name} (${payment.billing_period})`,
            billing_period: payment.billing_period,
            payment_method: payment.payment_method,
            transaction_id: payment.transaction_id
        }));

        // Sort by date (newest first)
        const sortedPayments = paymentHistory
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, data: sortedPayments });
    } catch (error) {
        console.error('Error getting Genie payment history:', error);
        res.status(500).json({ error: 'Failed to get Genie payment history.' });
    }
};

// Test endpoint to verify Genie payment integration
export const testGeniePaymentIntegration = async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: "Genie payment integration is ready",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing Genie payment integration:', error);
    res.status(500).json({ error: 'Failed to test Genie payment integration.' });
  }
};

// Webhook handler for Genie payment notifications
export const handleGeniePaymentWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log("Genie Payment Webhook received:", event);
        
        // Verify webhook signature if available
        // const signature = req.headers['x-genie-signature'];
        // if (!verifyWebhookSignature(event, signature)) {
        //     return res.status(400).json({ error: 'Invalid webhook signature' });
        // }
        
        // Handle different event types
        switch (event.type) {
            case 'payment.success':
                await handlePaymentSuccess(event.data);
                break;
            case 'payment.failed':
                await handlePaymentFailed(event.data);
                break;
            case 'payment.cancelled':
                await handlePaymentCancelled(event.data);
                break;
            default:
                console.log('Unhandled Genie payment event type:', event.type);
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling Genie payment webhook:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
};


export const createGeniePaymentRequest = async (req, res) => {
 try {
        const userId = req.userId;
        const { planId, billingPeriod, formSelection } = req.body;

        console.log("Request Body:", req.body);
        console.log('Payment Transaction ID:', req.transaction_id);

        console.log('Creating Genie payment request with data:', { planId, billingPeriod, userId, formSelection });

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

        // Get user details for customer creation
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check if this is an upgrade by looking at form selection data
        const isUpgrade = formSelection && typeof formSelection === 'object' && formSelection.isUpgrade;

        // If this is an upgrade, cancel the current subscription immediately
        if (isUpgrade) {
            const currentSubscription = await GenieSubscription.findOne({
                user_id: userId,
                status: 'active'
            });

            if (currentSubscription) {
                // Mark current subscription as cancelled
                currentSubscription.status = 'cancelled';
                currentSubscription.cancelled_at = new Date();
                await currentSubscription.save();
                console.log('Cancelled current subscription for upgrade:', currentSubscription._id);
            }
        }

        // Create customer in Genie if not exists
        let customerId = null;
        let customerResponse = null;
        
        try {
            customerResponse = await genieClient.post("/public-customers/", {
                name: user.name,
                email: user.email,
                billingEmail: user.email
            });
            customerId = customerResponse.data.id;
            console.log("Created Genie customer with ID:", customerId);
        } catch (customerError) {
            console.error("Error creating Genie customer:", customerError.response?.data || customerError.message);
            // If customer already exists, we'll use the payment link approach instead
        }

        // Parse form selection data if it exists
        let parsedFormSelection = null;
        if (formSelection) {
            try {
                // If it's already an object, use it directly
                if (typeof formSelection === 'object') {
                    parsedFormSelection = formSelection;
                } else {
                    // If it's a string, parse it
                    parsedFormSelection = JSON.parse(formSelection);
                }
            } catch (parseError) {
                console.error('Error parsing form selection data:', parseError);
                parsedFormSelection = null;
            }
        }

        // Create payment request in our system with pending status
        const paymentData = {
            user_id: userId,
            plan_id: planId,
            plan_name: plan.name,
            amount: amount,
            payment_method: 'genie_card',
            payment_status: 'pending', // Start with pending status
            billing_period: billingPeriod,
            subscription_start: startDate,
            subscription_end: endDate,
            // Store form selection data for processing after payment confirmation
            form_selection: parsedFormSelection,
            customer_id: customerId
        };

        const newPayment = new GeniePayment(paymentData);
        await newPayment.save();

        // Create a payment link or card payment request
        let paymentUrl = null;
        let transactionId = null;
        let errorMessage = null;
        
        try {
            if (customerId) {
                // Try to create a card payment request first
                try {
                    const paymentResponse = await genieClient.post("/connect/v1/payments/card", {
                        amount: amount * 100, // Convert to cents for Genie API
                        currency: "LKR",
                        customer: {
                            id: customerId
                        },
                        cardOnFile: true, // enables recurring setup
                        redirectUrl: "https://inanimate-maritza-arousingly.ngrok-free.dev/api/genie/billing-redirect",
                    });
                    
                    paymentUrl = paymentResponse.data.url;
                    transactionId = paymentResponse.data.id;
                    console.log("Successfully created card payment request");
                } catch (cardPaymentError) {
                    console.error("Error creating card payment request:", cardPaymentError.response?.data || cardPaymentError.message);
                    errorMessage = cardPaymentError.response?.data?.message || cardPaymentError.message;
                    // If card payment fails, fall back to transaction (payment link) with full customer details
                    console.log("Falling back to transaction (payment link) creation with full customer details");
                    try {
                        const transactionResponse = await genieClient.post("/public/v2/transactions", {
                            amount: amount * 100, // Convert to cents for Genie API
                            currency: "LKR",
                            localId: `payment_${newPayment._id}`,
                            customer: {
                                name: user.name,
                                email: user.email,
                                billingEmail: user.email
                            },
                                redirectUrl: "https://inanimate-maritza-arousingly.ngrok-free.dev/api/genie/billing-redirect",
                            });
                        
                        paymentUrl = transactionResponse.data.url;
                        transactionId = transactionResponse.data.id;
                    } catch (transactionError) {
                        console.error("Error creating transaction (payment link):", transactionError.response?.data || transactionError.message);
                        // If both attempts fail, we'll handle it in the outer catch block
                        throw transactionError;
                    }
                }
            } else {
                // If we don't have a customer ID, create a transaction (payment link) with customer details
                try {
                    const transactionResponse = await genieClient.post("/public/v2/transactions", {
                        amount: amount * 100, // Convert to cents for Genie API
                        currency: "LKR",
                        localId: `payment_${newPayment._id}`,
                        customer: {
                            name: user.name,
                            email: user.email,
                            billingEmail: user.email
                        },
                        redirectUrl: "https://inanimate-maritza-arousingly.ngrok-free.dev/api/genie/billing-redirect",
                    });
                    
                    paymentUrl = transactionResponse.data.url;
                    transactionId = transactionResponse.data.id;
                } catch (transactionError) {
                    console.error("Error creating transaction (payment link) without customer ID:", transactionError.response?.data || transactionError.message);
                    errorMessage = transactionError.response?.data?.message || transactionError.message;
                    // Re-throw to be handled by the outer catch block
                    throw transactionError;
                }
            }
            
            // Update payment with transaction details
            newPayment.transaction_id = transactionId;
            newPayment.payment_url = paymentUrl;
            await newPayment.save();
            
        } catch (paymentError) {
            console.error("Error creating Genie payment:", paymentError.response?.data || paymentError.message);
            errorMessage = paymentError.response?.data?.message || paymentError.message;
            // We'll still return the payment request but without the payment URL
        }

        // If we don't have a payment URL, return an error
        if (!paymentUrl) {
            return res.status(500).json({ 
                success: false, 
                error: errorMessage || 'Failed to create payment link. Please contact support.',
                data: {
                    payment: newPayment,
                    paymentUrl: null
                }
            });
        }

        // Fetch the updated payment object to ensure it includes the payment_url field
        const updatedPayment = await GeniePayment.findById(newPayment._id);

        res.json({ 
            success: true, 
            data: {
                payment: updatedPayment || newPayment,
                paymentUrl: paymentUrl
            },
            message: 'Payment request created successfully. Redirecting to payment page.'
        });
    } catch (error) {
        console.error('Error creating Genie payment request:', error);
        res.status(500).json({ error: 'Failed to create Genie payment request.' });
    }
};

export const handleRedirect = async (req, res) => {
    console.log("Redirect hit");
    const { transactionId, state } = req.query;

    if (!transactionId || !state) {
        return res.redirect(`${CLIENT_URL}/billing?paymentStatus=error&message=${encodeURIComponent('Invalid payment response')}`);
    }

    try {
        const payment = await GeniePayment.findOne({ transaction_id: transactionId });
        if (!payment) {
            return res.redirect(`${CLIENT_URL}/billing?paymentStatus=error&message=${encodeURIComponent('Payment record not found')}`);
        }

        if (state === "SUCCESS") {
            payment.payment_status = "completed";
            await payment.save();
            return res.redirect(`${CLIENT_URL}/billing?paymentStatus=success&message=${encodeURIComponent('Payment completed')}`);
        } else if (state === "CANCELLED") {
            payment.payment_status = "cancelled";
            await payment.save();
            return res.redirect(`${CLIENT_URL}/billing?paymentStatus=cancelled&message=${encodeURIComponent('Payment cancelled')}`);
        } else {
            return res.redirect(`${CLIENT_URL}/billing?paymentStatus=error&message=${encodeURIComponent('Unknown payment state')}`);
        }
    } catch (err) {
        console.error(err);
        return res.redirect(`${CLIENT_URL}/billing?paymentStatus=error&message=${encodeURIComponent('Server error')}`);
    }
};

// Process form selection after payment completion
export const processFormSelectionAfterGeniePayment = async (userId, formSelection) => {
    try {
        console.log('Processing form selection after Genie payment completion for user:', userId, 'formSelection:', formSelection);
        
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
            
            // Update the Genie subscription with selected forms
            const genieSubscription = await GenieSubscription.findOne({ 
                user_id: userId, 
                status: 'active' 
            });
            
            if (genieSubscription) {
                const existingSelectedForms = genieSubscription.forms_selected || [];
                const updatedSelectedForms = [...new Set([...existingSelectedForms, ...selectedFormIds])];
                genieSubscription.forms_selected = updatedSelectedForms;
                await genieSubscription.save();
                console.log('Updated Genie subscription with selected forms:', updatedSelectedForms);
            }
            
            return { 
                success: true, 
                message: `Successfully unlocked ${selectedFormIds.length} form(s) after payment completion.`,
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
            
            // Update the Genie subscription with selected forms
            const genieSubscription = await GenieSubscription.findOne({ 
                user_id: userId, 
                status: 'active' 
            });
            
            if (genieSubscription) {
                genieSubscription.forms_selected = selectedFormIds;
                await genieSubscription.save();
                console.log('Updated Genie subscription with selected forms:', selectedFormIds);
            }
            
            // Count forms that should be locked (the excess forms)
            const lockedFormCount = Math.max(0, allActiveForms.length - newPlanLimit);
            
            return { 
                success: true, 
                message: `Successfully updated form status after payment completion. ${selectedFormIds.length} form(s) kept active, ${lockedFormCount} form(s) locked.`,
                activeForms: selectedFormIds.length,
                lockedForms: lockedFormCount
            };
        }
    } catch (error) {
        console.error('Error processing form selection after Genie payment completion:', error);
        return { success: false, error: 'Failed to process form selection after Genie payment completion' };
    }
};

// Handle successful payment
const handlePaymentSuccess = async (paymentData) => {
    try {
        console.log('Processing successful Genie payment:', paymentData);
        
        // Find the payment record
        const payment = await GeniePayment.findOne({ 
            transaction_id: paymentData.id 
        });
        
        if (!payment) {
            console.log('Payment record not found for transaction:', paymentData.id);
            return;
        }
        
        // Update payment status
        payment.payment_status = 'completed';
        await payment.save();
        
        // Get plan details
        const plan = await ManualPlan.findById(payment.plan_id);
        if (!plan) {
            console.log('Plan not found for payment:', payment._id);
            return;
        }
        
        // Check if this is an upgrade by looking at form selection data
        const isUpgrade = payment.form_selection && payment.form_selection.isUpgrade;
        
        // Create or update subscription
        let subscription = await GenieSubscription.findOne({ 
            user_id: payment.user_id,
            status: 'active'
        });
        
        // Track if this is an upgrade/downgrade
        let isUpgradeOrDowngrade = false;
        let previousPlanId = null;
        
        if (!subscription) {
            // Create new subscription for new user
            subscription = new GenieSubscription({
                user_id: payment.user_id,
                plan_id: payment.plan_id,
                plan_name: payment.plan_name,
                billing_period: payment.billing_period,
                amount: payment.amount,
                status: 'active',
                subscription_start: payment.subscription_start,
                subscription_end: payment.subscription_end,
                auto_renew: true, // Default to auto-renew
                customer_id: payment.customer_id,
                transaction_id: payment.transaction_id,
                last_payment_id: payment._id
            });
        } else {
            // This is an upgrade/downgrade or renewal
            isUpgradeOrDowngrade = true;
            previousPlanId = subscription.plan_id;
            
            // Store previous plan info for audit trail
            subscription.previous_plan_id = subscription.plan_id;
            subscription.upgrade_reason = isUpgrade ? 'immediate_upgrade' : 'plan_change';
            
            // For immediate upgrades, cancel current subscription and create new one
            if (isUpgrade) {
                // Mark current subscription as cancelled
                subscription.status = 'cancelled';
                subscription.cancelled_at = new Date();
                await subscription.save();
                
                // Create a new subscription with the upgraded plan
                subscription = new GenieSubscription({
                    user_id: payment.user_id,
                    plan_id: payment.plan_id,
                    plan_name: payment.plan_name,
                    billing_period: payment.billing_period,
                    amount: payment.amount,
                    status: 'active',
                    subscription_start: payment.subscription_start,
                    subscription_end: payment.subscription_end,
                    auto_renew: true, // Default to auto-renew
                    customer_id: payment.customer_id,
                    transaction_id: payment.transaction_id,
                    last_payment_id: payment._id,
                    previous_plan_id: previousPlanId,
                    upgrade_reason: 'immediate_upgrade'
                });
            } else {
                // For regular renewals, update existing subscription
                subscription.plan_id = payment.plan_id;
                subscription.plan_name = payment.plan_name;
                subscription.billing_period = payment.billing_period;
                subscription.amount = payment.amount;
                subscription.subscription_start = payment.subscription_start;
                subscription.subscription_end = payment.subscription_end;
                subscription.customer_id = payment.customer_id;
                subscription.transaction_id = payment.transaction_id;
                subscription.last_payment_id = payment._id;
                
                // Add to renewal history for recurring payments
                subscription.renewal_history.push({
                    payment_id: payment._id,
                    date: new Date()
                });
            }
        }
        
        await subscription.save();
        console.log('Successfully created/updated Genie subscription:', subscription._id);
        
        // Update user subscription status
        const user = await User.findById(payment.user_id);
        if (user) {
            user.subscription_plan = payment.plan_name;
            user.subscription_status = 'active';
            user.subscription_expiry = payment.subscription_end;
            user.is_active = true;
            await user.save();
        }
        
        // Process form selection if it exists
        if (payment.form_selection) {
            await processFormSelectionAfterGeniePayment(payment.user_id, payment.form_selection);
        }
        
        console.log('Successfully processed Genie payment and updated subscription');
    } catch (error) {
        console.error('Error processing successful Genie payment:', error);
    }
};

// Handle failed payment
const handlePaymentFailed = async (paymentData) => {
    try {
        console.log('Processing failed Genie payment:', paymentData);
        
        // Find the payment record
        const payment = await GeniePayment.findOne({ 
            transaction_id: paymentData.id 
        });
        
        if (!payment) {
            console.log('Payment record not found for transaction:', paymentData.id);
            return;
        }
        
        // Update payment status
        payment.payment_status = 'failed';
        await payment.save();
        
        console.log('Successfully updated payment status to failed');
    } catch (error) {
        console.error('Error processing failed Genie payment:', error);
    }
};

// Handle cancelled payment
const handlePaymentCancelled = async (paymentData) => {
    try {
        console.log('Processing cancelled Genie payment:', paymentData);
        
        // Find the payment record
        const payment = await GeniePayment.findOne({ 
            transaction_id: paymentData.id 
        });
        
        if (!payment) {
            console.log('Payment record not found for transaction:', paymentData.id);
            return;
        }
        
        // Update payment status
        payment.payment_status = 'cancelled';
        await payment.save();
        
        console.log('Successfully updated payment status to cancelled');
    } catch (error) {
        console.error('Error processing cancelled Genie payment:', error);
    }
};

// Process recurring payment for auto-renewing subscriptions
export const processRecurringPayment = async (subscriptionId) => {
    try {
        console.log('Processing recurring payment for subscription:', subscriptionId);
        
        // Find the active subscription
        const subscription = await GenieSubscription.findById(subscriptionId)
            .populate('user_id')
            .populate('plan_id');
            
        if (!subscription || subscription.status !== 'active') {
            console.log('Subscription not found or not active:', subscriptionId);
            return { success: false, error: 'Subscription not found or not active' };
        }
        
        // Check if auto-renew is enabled
        if (!subscription.auto_renew) {
            console.log('Auto-renew is disabled for subscription:', subscriptionId);
            return { success: false, error: 'Auto-renew is disabled' };
        }
        
        // Get user and plan details
        const user = subscription.user_id;
        const plan = subscription.plan_id;
        
        if (!user || !plan) {
            console.log('User or plan not found for subscription:', subscriptionId);
            return { success: false, error: 'User or plan not found' };
        }
        
        // Calculate amount based on billing period
        const amount = subscription.billing_period === 'yearly' ? plan.price_yearly : plan.price_monthly;
        
        // Calculate new subscription dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        if (subscription.billing_period === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        
        // Create a new payment record for this recurring payment
        const paymentData = {
            user_id: user._id,
            plan_id: plan._id,
            plan_name: plan.name,
            amount: amount,
            payment_method: 'genie_card',
            payment_status: 'pending', // Start with pending status
            billing_period: subscription.billing_period,
            subscription_start: startDate,
            subscription_end: endDate,
            customer_id: subscription.customer_id
        };
        
        const newPayment = new GeniePayment(paymentData);
        await newPayment.save();
        
        // Try to charge the saved card token if available
        let paymentSuccess = false;
        let transactionId = null;
        
        if (subscription.card_token) {
            try {
                // Attempt to charge the saved card (this would be the Genie recurring payment API call)
                // Note: This is a placeholder - the actual implementation would depend on Genie's recurring payment API
                console.log('Attempting to charge saved card for user:', user._id);
                
                // For now, we'll simulate a successful payment
                // In a real implementation, you would call Genie's recurring payment API here
                paymentSuccess = true;
                transactionId = `recurring_${newPayment._id}_${Date.now()}`;
                
                // Update payment status to completed
                newPayment.payment_status = 'completed';
                newPayment.transaction_id = transactionId;
                await newPayment.save();
                
                // Update subscription with new dates
                subscription.subscription_start = startDate;
                subscription.subscription_end = endDate;
                subscription.last_payment_id = newPayment._id;
                
                // Add to renewal history
                subscription.renewal_history.push({
                    payment_id: newPayment._id,
                    date: new Date()
                });
                
                await subscription.save();
                
                // Update user subscription expiry
                user.subscription_expiry = endDate;
                await user.save();
                
                console.log('Successfully processed recurring payment for subscription:', subscriptionId);
                return { success: true, payment: newPayment };
            } catch (error) {
                console.error('Error processing recurring payment:', error);
                // Update payment status to failed
                newPayment.payment_status = 'failed';
                await newPayment.save();
            }
        }
        
        // If we don't have a card token or charging failed, we need to notify the user
        if (!paymentSuccess) {
            console.log('Recurring payment requires manual intervention for subscription:', subscriptionId);
            // In a real implementation, you would send a notification to the user
            // to complete the payment manually or update their payment method
            return { success: false, error: 'Payment requires manual intervention', payment: newPayment };
        }
    } catch (error) {
        console.error('Error processing recurring payment:', error);
        return { success: false, error: 'Failed to process recurring payment' };
    }
};