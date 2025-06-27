// controllers/SubscriptionController.js

import { Subscription } from "../models/Subscription.js";
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';

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

// Create checkout session for subscriptions

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
            cancel_url: `${process.env.CLIENT_URL}/subscription`,  // Redirect if user cancels
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