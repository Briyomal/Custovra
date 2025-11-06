// controllers/SubscriptionController.js

import { Subscription } from "../models/Subscription.js";
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { handlePlanChangeProtection } from '../middleware/planChangeProtection.js';

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Fetch all subscription plans
export const getAllSubscriptions = async (req, res) => {
    try {
        const products = await stripe.products.list({
            active: true,
        });

        const prices = await stripe.prices.list({
            active: true,
            expand: ['data.product'],
        });

        // Combine product and price data
        const subscriptionPlans = prices.data
            .filter((price) => price.type === 'recurring')
            .map((price) => ({
                id: price.id,
                product: price.product,
                unit_amount: price.unit_amount,
                currency: price.currency,
                interval: price.recurring.interval,
            }));

        res.status(200).json(subscriptionPlans);
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        res.status(500).json({ error: error.message });
    }
};

// Check plan change requirements (for modal display) without updating Stripe
export const checkPlanChangeRequirements = async (req, res) => {
    try {
        const { priceId, planName } = req.body;
        console.log("🔍 Checking plan change requirements:", req.body);

        if (!priceId || !planName) {
            return res.status(400).json({ error: "Price ID and plan name are required" });
        }

        if (!req.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const userIdString = req.userId.toString();
        const user = await User.findById(userIdString);
        
        if (!user.stripeCustomerId) {
            return res.status(400).json({ error: "User has no Stripe customer ID" });
        }

        // Check if user has an existing active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length === 0) {
            // No active subscription - will create new one
            return res.status(200).json({
                success: true,
                requiresFormSelection: false,
                isNewSubscription: true,
                message: "This will create a new subscription"
            });
        }

        const currentSubscription = subscriptions.data[0];
        const currentPriceId = currentSubscription.items.data[0].price.id;

        // Check if trying to switch to the same plan
        if (currentPriceId === priceId) {
            return res.status(400).json({ 
                error: "You are already subscribed to this plan",
                current: true 
            });
        }

        // Get current plan info
        const previousPrice = await stripe.prices.retrieve(currentPriceId);
        const previousProduct = await stripe.products.retrieve(previousPrice.product);
        const previousPlanName = previousProduct.name;

        console.log(`🔄 Plan change check: ${previousPlanName} → ${planName}`);
        console.log('🔍 DEBUG: Plan names for comparison:');
        console.log('  - previousPlanName:', previousPlanName);
        console.log('  - planName:', planName);
        console.log('  - userIdString:', userIdString);

        // Check what this plan change would require
        // We need to simulate what the plan limits would be AFTER the change
        // Using default plan limits since subscriptionPlans.js was removed
        const targetPlanLimits = {
            formLimit: 10, // Default value
            submissionLimit: 1000 // Default value
        };
        
        console.log('🎯 Target plan info:');
        console.log('  - Target plan name:', planName);
        console.log('  - Target plan limits:', targetPlanLimits);
        
        // Get user's current active forms to check against target plan limits
        const { Form } = await import('../models/Form.js');
        const activeForms = await Form.find({
            user_id: userIdString,
            is_active: true
        }).sort({ createdAt: -1 });
        
        const currentFormCount = activeForms.length;
        const targetPlanLimit = targetPlanLimits.formLimit;
        
        console.log('📊 Form count analysis:');
        console.log('  - Current active forms:', currentFormCount);
        console.log('  - Target plan limit:', targetPlanLimit);
        console.log('  - Forms exceed limit:', currentFormCount > targetPlanLimit);
        
        // Use plan comparison to determine upgrade/downgrade
        // Using simple comparison since subscriptionPlans.js was removed
        const planComparison = {
            isUpgrade: false,
            isDowngrade: false,
            isSamePlan: true
        };
        
        console.log('🔍 CORRECTED Plan comparison:');
        console.log('  - previousPlanName:', previousPlanName);
        console.log('  - targetPlanName:', planName);
        console.log('  - isUpgrade:', planComparison.isUpgrade);
        console.log('  - isDowngrade:', planComparison.isDowngrade);
        console.log('  - isSamePlan:', planComparison.isSamePlan);

        // Check for same plan (should return error)
        if (planComparison.isSamePlan) {
            console.log(`🚫 Same plan detected: ${previousPlanName} = ${planName}`);
            return res.status(400).json({ 
                error: "You are already subscribed to this plan",
                current: true 
            });
        }
        
        // ALWAYS show modal for downgrades (even if no forms need to be locked)
        // This ensures users are aware of the downgrade and can confirm it
        if (planComparison.isDowngrade) {
            console.log(`📦 Downgrade detected: ${previousPlanName} → ${planName} - showing modal`);
            
            // Determine if action is required (forms need to be selected/locked)
            const requiresAction = currentFormCount > targetPlanLimit;
            const excessFormCount = Math.max(0, currentFormCount - targetPlanLimit);
            
            console.log(`🔍 Modal data preparation:`);
            console.log('  - requiresAction:', requiresAction);
            console.log('  - excessFormCount:', excessFormCount);
            
            return res.status(200).json({
                success: true,
                requiresFormSelection: true,
                isDowngrade: true,
                currentPlan: previousPlanName,
                targetPlan: planName,
                planChangeInfo: {
                    success: true,
                    requiresAction: requiresAction,
                    isDowngrade: true,
                    planName: planName.toLowerCase(),
                    previousPlanName: previousPlanName,
                    currentPlan: planName,
                    newPlanLimit: targetPlanLimit,
                    currentFormCount: currentFormCount,
                    excessFormCount: excessFormCount,
                    activeForms: activeForms.map(form => ({
                        _id: form._id,
                        form_name: form.form_name,
                        form_note: form.form_note,
                        form_type: form.form_type,
                        created_at: form.createdAt || form.created_at,
                        submissionCount: form.submissionCount || 0
                    })),
                    message: requiresAction ? 
                        `Your ${planName} plan allows only ${targetPlanLimit} active form(s). You currently have ${currentFormCount}. Please select which forms will remain active and which will be locked.` :
                        `Confirm downgrade from ${previousPlanName} to ${planName}. All your forms will remain active.`
                },
                subscriptionInfo: {
                    subscriptionId: currentSubscription.id,
                    itemId: currentSubscription.items.data[0].id,
                    priceId: priceId,
                    planName: planName,
                    previousPlanName: previousPlanName
                },
                message: requiresAction ?
                    `Switching from ${previousPlanName} to ${planName} requires form selection` :
                    `Confirm downgrade from ${previousPlanName} to ${planName}`
            });
        }

        // For upgrades or non-conflicting changes, no form selection needed
        return res.status(200).json({
            success: true,
            requiresFormSelection: false,
            isUpgrade: planComparison.isUpgrade,
            isDowngrade: planComparison.isDowngrade,
            isSamePlan: planComparison.isSamePlan,
            currentPlan: previousPlanName,
            targetPlan: planName,
            planChangeInfo: {
                success: true,
                requiresAction: false,
                isUpgrade: planComparison.isUpgrade,
                isDowngrade: planComparison.isDowngrade,
                isSamePlan: planComparison.isSamePlan,
                planName: planName.toLowerCase(),
                previousPlanName: previousPlanName,
                message: planComparison.isSamePlan ? 
                    'No action required - same plan selected' : 
                    `Ready to upgrade from ${previousPlanName} to ${planName}`
            },
            subscriptionInfo: {
                subscriptionId: currentSubscription.id,
                itemId: currentSubscription.items.data[0].id,
                priceId: priceId,
                planName: planName,
                previousPlanName: previousPlanName
            },
            message: planComparison.isSamePlan ?
                'You are already subscribed to this plan' :
                planComparison.isUpgrade ? 
                    `Ready to upgrade from ${previousPlanName} to ${planName}` :
                    `Ready to change from ${previousPlanName} to ${planName}`
        });

    } catch (error) {
        console.error("Error checking plan change requirements:", error);
        res.status(500).json({ error: error.message });
    }
};

// Update/Modify existing subscription
export const updateSubscriptionPlan = async (req, res) => {
    try {
        const { priceId, planName, selectedFormIds, formsPreSelected } = req.body;
        console.log("Updating subscription plan:", req.body);

        if (!priceId) {
            return res.status(400).json({ error: "Price ID is required" });
        }

        if (!req.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const userIdString = req.userId.toString();
        const user = await User.findById(userIdString);
        
        if (!user.stripeCustomerId) {
            return res.status(400).json({ error: "User has no Stripe customer ID" });
        }

        // Check if user has an existing active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length === 0) {
            // No active subscription - create new one
            return createCheckoutSession(req, res);
        }

        const currentSubscription = subscriptions.data[0];
        const currentPriceId = currentSubscription.items.data[0].price.id;

        // Check if trying to switch to the same plan
        if (currentPriceId === priceId) {
            return res.status(400).json({ 
                error: "You are already subscribed to this plan",
                current: true 
            });
        }

        // Store previous plan info for downgrade protection
        const previousPrice = await stripe.prices.retrieve(currentPriceId);
        const previousProduct = await stripe.products.retrieve(previousPrice.product);
        const previousPlanName = previousProduct.name;

        console.log(`Checking plan change from ${previousPlanName} to ${planName}`);

        // If forms were pre-selected (modal-first flow), handle the form selection first
        if (formsPreSelected && selectedFormIds) {
            console.log('🔄 Modal-first flow detected - handling form selection before Stripe update');
            
            // Import the form handling functions
            const { Form } = await import('../models/Form.js');
            
            // Verify all selected forms belong to the user
            const selectedForms = await Form.find({
                _id: { $in: selectedFormIds },
                user_id: userIdString
            });

            if (selectedForms.length !== selectedFormIds.length) {
                return res.status(403).json({
                    error: "One or more selected forms do not belong to you"
                });
            }

            // Get target plan limits to validate selection
            // Using default plan limits since subscriptionPlans.js was removed
            const targetPlanLimits = {
                formLimit: 10, // Default value
                submissionLimit: 1000 // Default value
            };
            
            if (selectedFormIds.length > targetPlanLimits.formLimit) {
                return res.status(400).json({
                    error: `You can only select ${targetPlanLimits.formLimit} form(s) for your ${planName} plan.`
                });
            }

            console.log(`🔒 Locking forms: ${selectedFormIds.length} forms will remain active`);
            
            // Get all user's forms
            const allUserForms = await Form.find({ user_id: userIdString });

            // Lock excess forms (set is_locked: true, keep is_active status unchanged)
            const formsToLock = allUserForms.filter(form => !selectedFormIds.includes(form._id.toString()));
            
            if (formsToLock.length > 0) {
                await Form.updateMany(
                    { 
                        _id: { $in: formsToLock.map(f => f._id) },
                        user_id: userIdString 
                    },
                    { 
                        is_locked: true,
                        lockedAt: new Date(),
                        lockReason: `Locked due to downgrade to ${planName} plan`
                    }
                );
            }

            // Unlock selected forms (set is_locked: false, keep is_active status unchanged)
            const result = await Form.updateMany(
                { 
                    _id: { $in: selectedFormIds },
                    user_id: userIdString 
                },
                { 
                    is_locked: false,
                    $unset: { lockedAt: 1, lockReason: 1 } // Remove lock fields
                }
            );

            const lockedFormCount = formsToLock.length;
            console.log(`✅ Form locking completed: ${selectedFormIds.length} unlocked, ${lockedFormCount} locked`);
        } else {
            // IMPORTANT: Check for downgrades BEFORE updating Stripe subscription
            // This prevents webhook auto-handling from interfering with manual selection
            const preliminaryCheck = await handlePlanChangeProtection(userIdString, previousPlanName, false);
            console.log('🔍 Preliminary check result:', preliminaryCheck);
            
            // DEBUG: Log all relevant values for troubleshooting
            console.log('🐛 DEBUG VALUES:');
            console.log('  preliminaryCheck.success:', preliminaryCheck.success);
            console.log('  preliminaryCheck.isDowngrade:', preliminaryCheck.isDowngrade);
            console.log('  preliminaryCheck.requiresAction:', preliminaryCheck.requiresAction);
            console.log('  preliminaryCheck.autoHandled:', preliminaryCheck.autoHandled);
            
            // Check if this is a downgrade that requires manual intervention
            if (preliminaryCheck.success && preliminaryCheck.isDowngrade && preliminaryCheck.requiresAction) {
                console.log(`🚫 DOWNGRADE DETECTED - STOPPING STRIPE UPDATE`);
                console.log(`📊 User has ${preliminaryCheck.currentFormCount} forms, new plan allows ${preliminaryCheck.newPlanLimit}`);
                console.log(`🛡️ Returning dialog data - NO Stripe subscription update will occur`);
                
                // This is a downgrade that requires user intervention
                // Return the downgrade info WITHOUT updating Stripe yet
                return res.status(200).json({
                    success: true,
                    requiresFormSelection: true,
                    subscriptionNotUpdated: true,
                    planChangeProtection: preliminaryCheck,
                    message: `Plan change requires form selection. Please select which forms will remain active and which will be locked.`,
                    // Include Stripe update info for when user completes selection
                    pendingUpdate: {
                        subscriptionId: currentSubscription.id,
                        itemId: currentSubscription.items.data[0].id,
                        priceId: priceId,
                        planName: planName,
                        previousPlanName: previousPlanName
                    }
                });
            }
        }

        console.log(`⬆️ PROCEEDING WITH STRIPE UPDATE - Forms handled, updating subscription`);
        console.log(`🔄 Updating subscription from ${previousPlanName} to ${planName}`);

        // Update the subscription with new price
        const updatedSubscription = await stripe.subscriptions.update(
            currentSubscription.id,
            {
                items: [
                    {
                        id: currentSubscription.items.data[0].id,
                        price: priceId,
                    },
                ],
                proration_behavior: 'create_prorations', // Handle prorations for immediate changes
                metadata: {
                    planName,
                    userId: userIdString,
                    previousPlan: previousPlanName,
                    formsPreSelected: formsPreSelected ? 'true' : 'false'
                }
            }
        );

        // IMMEDIATELY update Payment record for instant UI refresh
        // This ensures the frontend gets updated plan info without waiting for webhooks
        try {
            const { Payment } = await import('../models/Payment.js');
            const subscriptionExpiry = new Date(updatedSubscription.current_period_end * 1000);
            
            await Payment.findOneAndUpdate(
                { user_id: userIdString, subscription_id: updatedSubscription.id },
                {
                    plan: planName,
                    subscription_expiry: subscriptionExpiry,
                    updated_at: new Date(),
                },
                { upsert: true, new: true }
            );
            
            console.log(`✅ Payment record updated immediately for plan change to ${planName}`);
        } catch (paymentUpdateError) {
            console.warn('Failed to update payment record immediately:', paymentUpdateError);
            // Don't fail the request if payment update fails - webhook will handle it
        }

        // For upgrades, handle form unlocking (only if not in modal-first flow)
        if (!formsPreSelected) {
            const preliminaryCheck = await handlePlanChangeProtection(userIdString, previousPlanName, false);
            if (preliminaryCheck.success && preliminaryCheck.isUpgrade) {
                const upgradeResult = await handlePlanChangeProtection(userIdString, previousPlanName, true);
                console.log(`Upgrade processed:`, upgradeResult);
            }
        }
        
        console.log(`Subscription updated successfully:`, {
            subscriptionId: updatedSubscription.id,
            newPlan: planName,
            previousPlan: previousPlanName,
            formsPreSelected
        });

        res.status(200).json({ 
            success: true,
            subscription: updatedSubscription,
            message: `Successfully updated to ${planName} plan`
        });

    } catch (error) {
        console.error("Error updating subscription plan:", error);
        res.status(500).json({ error: error.message });
    }
};

// Complete subscription update after form selection (for downgrades)
export const completeSubscriptionUpdate = async (req, res) => {
    try {
        const { pendingUpdate, selectedFormIds } = req.body;
        console.log("Completing subscription update after form selection:", req.body);

        if (!pendingUpdate || !selectedFormIds) {
            return res.status(400).json({ error: "Pending update info and selected form IDs are required" });
        }

        if (!req.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const userIdString = req.userId.toString();

        // Import axios for internal API calls
        const axios = (await import('axios')).default;

        // First, handle the form selection
        const formSelectionResponse = await axios.post(
            `${process.env.SERVER_URL || 'http://localhost:5000'}/api/plan-downgrade/handle-form-selection`,
            { selectedFormIds },
            { 
                headers: { 
                    'Authorization': req.headers.authorization,
                    'Cookie': req.headers.cookie 
                }
            }
        );

        if (!formSelectionResponse.data.success) {
            return res.status(400).json({ error: formSelectionResponse.data.error });
        }

        // Now update the Stripe subscription
        const updatedSubscription = await stripe.subscriptions.update(
            pendingUpdate.subscriptionId,
            {
                items: [
                    {
                        id: pendingUpdate.itemId,
                        price: pendingUpdate.priceId,
                    },
                ],
                proration_behavior: 'create_prorations',
                metadata: {
                    planName: pendingUpdate.planName,
                    userId: userIdString,
                    previousPlan: pendingUpdate.previousPlanName,
                    formsPreSelected: 'true' // Flag to prevent webhook auto-handling
                }
            }
        );

        console.log(`Subscription update completed after form selection`);

        res.status(200).json({ 
            success: true,
            subscription: updatedSubscription,
            formSelection: formSelectionResponse.data.data,
            message: `Successfully updated to ${pendingUpdate.planName} plan and managed forms`
        });

    } catch (error) {
        console.error("Error completing subscription update:", error);
        res.status(500).json({ error: error.message });
    }
};

// Create checkout session for new subscriptions
export const createCheckoutSession = async (req, res) => {
    try {
        const { priceId, planName } = req.body;  // Price ID passed from frontend
        console.log("plan Data: ", req.body);
       

        if (!priceId) {
            return res.status(400).json({ error: "Price ID is required" });
        }

        // Ensure the user is authenticated (if using authentication)
        if (!req.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        // Convert userId to string if it's not already
        const userIdString = req.userId.toString();  // Ensure this is a string
        //console.log("user info: " + userIdString);
        // Create a new checkout session
        const user = await User.findById(userIdString);
        const stripeCustomerId = user.stripeCustomerId;
        
        // ✅ Update Stripe customer with userId in metadata
        await stripe.customers.update(stripeCustomerId, {
            metadata: {
                userId: userIdString
            }
        });


        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',  // Subscription mode
            line_items: [
                {
                    price: priceId,  // Price ID selected by user
                    quantity: 1,
                },
            ],
            success_url: `${process.env.CLIENT_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,  // Redirect after successful payment
            cancel_url: `${process.env.CLIENT_URL}/billing`,  // Redirect if user cancels
            customer: stripeCustomerId,
            metadata: {
                planName,
                userId: userIdString,  // Add userId as a string
            },
        });
        // Return the session URL to the frontend
        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: error.message });
    }
};


// Get a subscription by ID
export const getSubscriptionById = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
        res.status(200).json(subscription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new subscription
export const createSubscription = async (req, res) => {
    try {
        const newSubscription = new Subscription(req.body);
        await newSubscription.save();
        res.status(201).json(newSubscription);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a subscription
export const updateSubscription = async (req, res) => {
    try {
        const updatedSubscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedSubscription) return res.status(404).json({ message: 'Subscription not found' });
        res.status(200).json(updatedSubscription);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a subscription
export const deleteSubscription = async (req, res) => {
    try {
        const deletedSubscription = await Subscription.findByIdAndDelete(req.params.id);
        if (!deletedSubscription) return res.status(404).json({ message: 'Subscription not found' });
        res.status(200).json({ message: 'Subscription deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const selectPlan = async (req, res) => {
    const { userId, subscriptionId, paymentDetails } = req.body;

    console.log("req in select Plan", req)

    try {
        // Fetch the selected subscription
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription plan not found' });
        }

        // Calculate subscription expiry date (30 days from now)
        const subscriptionExpiry = new Date();
        subscriptionExpiry.setDate(subscriptionExpiry.getDate() + 30);

        // Save payment details
        const payment = new Payment({
            user_id: userId,
            subscription_id: subscriptionId,
            amount: subscription.price,
            payment_status: paymentDetails.status,
            payment_date: new Date(),
        });
        await payment.save();

        // Update user's subscription details
        await User.findByIdAndUpdate(userId, {
            subscription_id: subscriptionId,
            subscription_expiry: subscriptionExpiry,
            is_active: true,
        });

        res.status(200).json({ message: 'Subscription activated successfully', subscriptionExpiry });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle auto-renewal for subscription
export const toggleAutoRenewal = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const userIdString = req.userId.toString();
        const user = await User.findById(userIdString);
        
        if (!user.stripeCustomerId) {
            return res.status(400).json({ error: "User has no Stripe customer ID" });
        }

        // Check if user has an existing active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length === 0) {
            return res.status(400).json({ error: "No active subscription found" });
        }

        const currentSubscription = subscriptions.data[0];
        
        // Check if trying to ENABLE auto-renewal (cancelAtPeriodEnd will be false)
        const enablingAutoRenewal = currentSubscription.cancel_at_period_end;
        
        if (enablingAutoRenewal) {
            // Check if user has a default payment method
            try {
                const customer = await stripe.customers.retrieve(user.stripeCustomerId);
                const hasDefaultPaymentMethod = customer.invoice_settings?.default_payment_method || customer.default_source;
                
                if (!hasDefaultPaymentMethod) {
                    return res.status(400).json({ 
                        error: "A default payment method is required to enable auto-renewal. Please add a payment method first.",
                        requiresPaymentMethod: true
                    });
                }
            } catch (customerError) {
                console.warn('Could not retrieve customer payment method info:', customerError.message);
                // Continue with the operation even if we can't verify payment method
            }
        }
        
        // Toggle the cancel_at_period_end flag
        const cancelAtPeriodEnd = !currentSubscription.cancel_at_period_end;
        
        // Update the subscription
        const updatedSubscription = await stripe.subscriptions.update(
            currentSubscription.id,
            {
                cancel_at_period_end: cancelAtPeriodEnd
            }
        );

        // Update user record
        await User.findByIdAndUpdate(userIdString, {
            subscription_status: cancelAtPeriodEnd ? 'canceling' : 'active'
        });

        res.status(200).json({
            success: true,
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
            message: cancelAtPeriodEnd 
                ? "Auto-renewal has been disabled. Your subscription will end at the end of the current period." 
                : "Auto-renewal has been enabled."
        });

    } catch (error) {
        console.error("Error toggling auto-renewal:", error);
        res.status(500).json({ error: error.message });
    }
};

// Renew previous subscription plan
export const renewPreviousPlan = async (req, res) => {
    try {
        const { previousPlan } = req.body;
        console.log("Renewing previous plan:", previousPlan);

        if (!previousPlan) {
            return res.status(400).json({ error: "Previous plan information is required" });
        }

        if (!req.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const userIdString = req.userId.toString();
        const user = await User.findById(userIdString);
        
        if (!user.stripeCustomerId) {
            return res.status(400).json({ error: "User has no Stripe customer ID" });
        }

        // Get available plans from Stripe
        const products = await stripe.products.list({
            active: true,
        });

        const prices = await stripe.prices.list({
            active: true,
            expand: ['data.product'],
        });

        // Find a price that matches the previous plan name
        // We'll look for a plan with a similar name and the same interval if available
        let matchingPrice = null;
        
        // First try to find an exact match by plan name
        for (const price of prices.data) {
            if (price.product.name.toLowerCase().includes(previousPlan.plan.toLowerCase()) && 
                price.type === 'recurring') {
                matchingPrice = price;
                break;
            }
        }
        
        // If no exact match, find any recurring plan
        if (!matchingPrice) {
            matchingPrice = prices.data.find(price => price.type === 'recurring');
        }
        
        if (!matchingPrice) {
            return res.status(400).json({ error: "No available subscription plans found" });
        }

        // Check if user has a payment method
        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
        });

        if (paymentMethods.data.length === 0) {
            return res.status(400).json({ 
                error: "Please add a payment method before renewing your plan.",
                requiresPaymentMethod: true
            });
        }

        // Create checkout session for the matching plan
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: matchingPrice.id,
                    quantity: 1,
                },
            ],
            customer: user.stripeCustomerId,
            success_url: `${process.env.CLIENT_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/billing`,
            metadata: {
                userId: userIdString,
                planName: matchingPrice.product.name,
                isRenewal: true
            }
        });

        res.status(200).json({ 
            success: true,
            redirectUrl: session.url,
            message: "Redirecting to payment..."
        });

    } catch (error) {
        console.error("Error renewing previous plan:", error);
        res.status(500).json({ error: error.message });
    }
};
