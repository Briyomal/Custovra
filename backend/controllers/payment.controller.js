
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import { handlePlanChangeProtection } from "../middleware/planChangeProtection.js";

//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Handle Stripe webhook events
export const handleStripeWebhook = async (req, res) => {
  /*  const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Your Stripe Webhook secret

    if (!endpointSecret) {
        console.error('Stripe webhook secret is not configured in environment variables');
        return res.status(500).send('Webhook secret not configured');
    }

    let event;

    try {
        // Use raw request body for Stripe signature verification
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Received event: ${event.type}`);

    // Process the event
    switch (event.type) {
        case 'checkout.session.completed':
            try {
                const session = event.data.object;
                await handleSubscriptionCompleted(session);
            } catch (err) {
                console.error('Error handling checkout.session.completed:', err);
            }
            break;

        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            await handlePaymentSucceeded(invoice);
            break;

        case 'invoice.payment_failed':
            try {
                const invoice = event.data.object;
                const customerId = invoice.customer;
                const subscriptionId = invoice.subscription;

                // Get the user ID from Customer
                const customer = await stripe.customers.retrieve(customerId);
                const userId = customer.metadata?.userId;

                if (userId) {
                    await User.findByIdAndUpdate(userId, {
                        subscription_status: 'past_due',
                        is_active: false, // Deactivate user on payment failure
                    });
                    console.log(`✅ User ${userId} marked as past_due due to payment failure`);
                }
            } catch (err) {
                console.error('❌ Error handling invoice.payment_failed:', err);
            }
            break;

        case 'customer.subscription.deleted':
            try {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                const user = await User.findOne({ stripeCustomerId: customerId });
                if (user) {
                    user.is_active = false;
                    user.subscription_status = 'canceled';
                    await user.save();
                    console.log("User deactivated and marked as canceled due to subscription deletion.");
                }
            } catch (err) {
                console.error("Error handling subscription.deleted:", err);
            }
            break;

        case 'customer.subscription.updated':
            try {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const subscriptionId = subscription.id;
                const endDate = new Date(subscription.current_period_end * 1000);
                const status = subscription.status;

                // Fetch price and product info
                const priceId = subscription.items.data[0]?.price?.id;
                const price = await stripe.prices.retrieve(priceId);
                const productId = price.product;

                // Map product ID to plan name
                const productMap = {
                    'prod_RFhrLxBtwAHvvP': 'Basic',
                    'prod_RFhs1FDL0JH7ko': 'Standard',
                    'prod_RFhsbfQkCmzsik': 'Premium',
                };

                const planName = productMap[productId] || 'default';
                const previousPlan = subscription.metadata?.previousPlan;

                // Get the user ID from Customer
                const customer = await stripe.customers.retrieve(customerId);
                const userId = customer.metadata?.userId;

                if (!userId) {
                    console.warn("No userId found in customer.metadata during subscription.updated.");
                    return;
                }

                // Update User record
                await User.findByIdAndUpdate(userId, {
                    subscription_plan: subscriptionId,
                    subscription_expiry: endDate,
                    subscription_status: status,
                    is_active: status === 'active',
                });

                // Update Payment record
                await Payment.findOneAndUpdate(
                    { user_id: userId, subscription_id: subscriptionId },
                    {
                        plan: planName,
                        subscription_expiry: endDate,
                        updated_at: new Date(),
                    },
                    { upsert: true }
                );

                // Trigger downgrade protection if this is a plan change (auto-handle in webhooks)
                // Skip if forms were pre-selected (to avoid conflict with manual selection)
                if (previousPlan && previousPlan !== planName) {
                    const formsPreSelected = subscription.metadata?.formsPreSelected === 'true';
                    
                    if (formsPreSelected) {
                        console.log(`✅ Skipping auto-handling for user ${userId} - forms were pre-selected`);
                    } else {
                        console.log(`⚠️ Plan change detected: ${previousPlan} → ${planName} for user ${userId}`);
                        
                        // SAFETY CHECK: If this is a downgrade, NEVER auto-handle from webhook
                        // The frontend should handle downgrade selection manually
                        // Using simple comparison since subscriptionPlans.js was removed
                        const planComparison = {
                            isUpgrade: false,
                            isDowngrade: false,
                            isSamePlan: true
                        };
                        
                        if (planComparison.isDowngrade) {
                            console.log(`🚫 WEBHOOK SAFETY: Detected downgrade ${previousPlan} → ${planName} - NOT auto-handling`);
                            console.log(`⚠️ This suggests the API call updated Stripe before showing dialog!`);
                        } else {
                            // Only auto-handle upgrades or same-plan changes
                            const protectionResult = await handlePlanChangeProtection(userId, previousPlan, true);
                            
                            if (protectionResult.requiresAction) {
                                console.log(`Plan change protection triggered for user ${userId}:`, protectionResult.message);
                            }
                        }
                    }
                }

                console.log(`✅ User and payment info updated from subscription.updated to plan ${planName}`);
            } catch (err) {
                console.error("❌ Error handling subscription.updated:", err);
            }
            break;


        default:
            console.log(`Unhandled event type: ${event.type}`);
            console.log(event);
    }

    res.status(200).send('Event received');
};

// Helper function to handle 'checkout.session.completed' event
export const handleSubscriptionCompleted = async (session) => {

    console.log("🔥 Full Session Data:", session); // Debugging

    const userId = session.metadata?.userId || null; // Metadata must include userId
    const customerId = session.customer;
    const subscriptionId = session.subscription || null;
    const planName = session.metadata?.planName || "default_plan"; // Ensure planName is not undefined
    if (!userId) {
        console.error("User ID is missing.");
        return;
    }
    try {
        // Find the user and update their subscription status
        const user = await User.findById(userId);
        if (!user) {
            console.log(`User not found with userId: ${userId}`);
            return;
        }
        // Get subscription details from Stripe
        let subscriptionExpiry = null;
        if (subscriptionId) {
            try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                subscriptionExpiry = new Date(subscription.current_period_end * 1000);
            } catch (error) {
                console.error('Error retrieving subscription:', error);
            }
        }

        // Update user details
        user.subscription_plan = subscriptionId || "default_plan"; // Default plan if subscriptionId is null
        user.subscription_expiry = subscriptionExpiry;
        user.subscription_status = 'active';
        user.stripeCustomerId = customerId;
        user.is_active = true;
        await user.save();

        console.log("Subscription updated successfully for user:", userId);
    } catch (error) {
        console.error("Error in subscription update:", error);
    }
};

// Helper function to handle 'invoice.payment_succeeded'
const handlePaymentSucceeded = async (invoice) => {
    try {
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        // Fetch latest Checkout Session (where your metadata is stored)
        const sessions = await stripe.checkout.sessions.list({
            subscription: subscriptionId,
            limit: 1,
        });

        if (!sessions.data.length) {
            throw new Error("No checkout session found.");
        }

        const session = sessions.data[0];
        const metadata = session.metadata || {};

        const userId = metadata.userId;
        const planName = metadata.planName || "default";

        if (!userId) {
            console.warn("❌ No userId found in Checkout Session metadata.");
            return;
        }

        const line = invoice.lines.data[0];
        const amount = line?.amount_total / 100 || invoice.amount_paid / 100;
        const payment_date = new Date(invoice.created * 1000);
        const subscription_expiry = new Date(line.period.end * 1000);

        // Save or update payment
        await Payment.findOneAndUpdate(
            { user_id: userId, subscription_id: subscriptionId },
            {
                plan: planName,
                amount,
                payment_date,
                subscription_expiry,
                updated_at: new Date(),
            },
            { upsert: true, new: true }
        );

        // Update user
        await User.findByIdAndUpdate(userId, {
            is_active: true,
            subscription_plan: subscriptionId,
            subscription_expiry,
            subscription_status: 'active',
        });

        console.log(`✅ Payment saved and user ${userId} updated`);
    } catch (error) {
        console.error("❌ Error handling invoice.payment_succeeded:", error);
    }
*/
};
