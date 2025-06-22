import { stripe } from "../utils/stripe.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";

//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Handle Stripe webhook events
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
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
            
                case 'customer.subscription.deleted':
            try {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                const user = await User.findOne({ stripeCustomerId: customerId });
                if (user) {
                    user.is_active = false;
                    await user.save();
                    console.log("User deactivated due to subscription cancellation.");
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

                const user = await User.findOne({ stripeCustomerId: customerId });
                if (user) {
                    user.subscription_plan = subscriptionId;
                    user.is_active = subscription.status === 'active';
                    await user.save();

                    // Optional: Update expiry in latest Payment
                    await Payment.updateOne(
                        { user_id: user._id, subscription_id: subscriptionId },
                        { $set: { subscription_expiry: endDate } }
                    );
                    console.log("User and payment info updated from subscription.updated.");
                }
            } catch (err) {
                console.error("Error handling subscription.updated:", err);
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
        // Update user details
        user.subscription_plan = subscriptionId || "default_plan"; // Default plan if subscriptionId is null
        //user.subscription_expiry = subscriptionExpiry;
        user.stripeCustomerId = customerId,
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

        // Step 1: Get Stripe customer details (to access metadata)
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata?.userId;

        if (!userId) {
            console.warn("No userId in Stripe customer metadata.");
            return;
        }

        // Step 2: Get dates
        const payment_date = new Date(invoice.created * 1000);
        const subscription_expiry = new Date(invoice.lines.data[0].period.end * 1000);
        const amount = invoice.amount_paid / 100;

        // Step 3: Get plan name from Stripe price
        const plan = invoice.lines.data[0]?.price?.nickname || "default";

        // Step 4: Upsert Payment record
        await Payment.findOneAndUpdate(
            { user_id: userId, subscription_id: subscriptionId },
            {
                plan,
                amount,
                payment_date,
                subscription_expiry,
                updated_at: new Date(),
            },
            { upsert: true, new: true }
        );

        // Step 5: Update user subscription status
        await User.findByIdAndUpdate(userId, {
            is_active: true,
            subscription_plan: subscriptionId,
            subscription_expiry,
        });

        console.log(`✅ Payment recorded and user ${userId} updated`);
    } catch (error) {
        console.error("❌ Error handling invoice.payment_succeeded:", error);
    }
};

