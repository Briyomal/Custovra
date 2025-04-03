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
        // Retrieve the subscription ID and customer ID from the invoice
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        // Fetch the latest session associated with this subscription
        const sessions = await stripe.checkout.sessions.list({
            subscription: subscriptionId,
            limit: 1, // Only fetch the latest session
        });

        if (sessions.data.length === 0) {
            throw new Error("No checkout session found for the subscription.");
        }

        const session = sessions.data[0]; // Get the latest session
        const metadata = session.metadata; // Access metadata passed in checkout.session.completed

        // Extract metadata and relevant fields
        const userId = metadata.userId;
        const planName = metadata.planName;

        // Retrieve payment dates from the invoice
        const payment_date = new Date(invoice.created * 1000); // Invoice creation time
        const subscription_expiry = new Date(invoice.lines.data[0].period.end * 1000); // Subscription end date

        const amount = invoice.lines.data[0].amount; //Amount of the invoice

        // Save payment record
        const payment = new Payment({
            user_id: userId,
            subscription_id: subscriptionId,
            plan: planName,
            amount: amount,
            payment_date: payment_date,
            subscription_expiry: subscription_expiry,
        });

        await payment.save();
        console.log("Payment record saved successfully.");
    } catch (error) {
        console.error("Error handling invoice.payment_succeeded:", error);
    }
};
