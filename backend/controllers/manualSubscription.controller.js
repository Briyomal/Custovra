import { ManualSubscription } from "../models/ManualSubscription.js";
import { User } from "../models/User.js";
import { ManualPlan } from "../models/ManualPlan.js";
import { Form } from "../models/Form.js";

// Get all manual subscriptions
export const getAllManualSubscriptions = async (req, res) => {
    try {
        const subscriptions = await ManualSubscription.find().populate('user_id', 'name email').populate('plan_id', 'name');
        res.status(200).json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all subscriptions for a user
export const getUserManualSubscriptions = async (req, res) => {
    try {
        const subscriptions = await ManualSubscription.find({ user_id: req.params.userId }).populate('plan_id', 'name');
        res.status(200).json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all subscriptions for all users (admin)
export const getAllUserSubscriptions = async (req, res) => {
    try {
        const subscriptions = await ManualSubscription.find().populate('user_id', 'name email').populate('plan_id', 'name');
        res.status(200).json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a manual subscription by ID
export const getManualSubscriptionById = async (req, res) => {
    try {
        const subscription = await ManualSubscription.findById(req.params.id)
            .populate('user_id', 'name email')
            .populate('plan_id', 'name');
        if (!subscription) return res.status(404).json({ message: 'Manual subscription not found' });
        res.status(200).json(subscription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new manual subscription
export const createManualSubscription = async (req, res) => {
    try {
        const newSubscription = new ManualSubscription(req.body);
        await newSubscription.save();
        res.status(201).json(newSubscription);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a manual subscription
export const updateManualSubscription = async (req, res) => {
    try {
        const { user_id, status } = req.body;
        
        // If updating to active status, check if user already has an active subscription
        if (status === 'active' && user_id) {
            const existingActiveSubscription = await ManualSubscription.findOne({
                user_id: user_id,
                status: 'active',
                _id: { $ne: req.params.id } // Exclude current subscription
            });
            
            if (existingActiveSubscription) {
                return res.status(400).json({ 
                    message: 'User already has an active subscription. Please cancel the existing subscription first.' 
                });
            }
        }
        
        const updatedSubscription = await ManualSubscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedSubscription) return res.status(404).json({ message: 'Manual subscription not found' });
        res.status(200).json(updatedSubscription);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Cancel a manual subscription
export const cancelManualSubscription = async (req, res) => {
    try {
        const subscription = await ManualSubscription.findById(req.params.id);
        if (!subscription) return res.status(404).json({ message: 'Manual subscription not found' });
        
        subscription.status = 'cancelled';
        await subscription.save();
        
        // NOTE: Not updating user subscription info in User document as per requirement
        // User subscription data is now sourced from ManualSubscription document only
        
        res.status(200).json({ message: 'Subscription cancelled successfully', subscription });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Assign a plan to a user
export const assignPlanToUser = async (req, res) => {
    try {
        const { userId, planId, billingPeriod, startDate, duration } = req.body;
        
        // Check if user already has an active subscription
        const existingActiveSubscription = await ManualSubscription.findOne({
            user_id: userId,
            status: 'active'
        });
        
        if (existingActiveSubscription) {
            return res.status(400).json({ 
                message: 'User already has an active subscription. Please cancel the existing subscription first.' 
            });
        }
        
        // Get plan details
        const plan = await ManualPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        
        // Calculate end date
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        if (billingPeriod === 'yearly') {
            endDateObj.setFullYear(endDateObj.getFullYear() + duration);
        } else {
            endDateObj.setMonth(endDateObj.getMonth() + duration);
        }
        
        // Calculate amount
        const amount = billingPeriod === 'yearly' ? plan.price_yearly : plan.price_monthly;
        
        // Create subscription
        const subscriptionData = {
            user_id: userId,
            plan_id: planId,
            plan_name: plan.name,
            billing_period: billingPeriod,
            amount: amount,
            status: 'active',
            subscription_start: startDateObj,
            subscription_end: endDateObj,
            auto_renew: false
        };
        
        const subscription = new ManualSubscription(subscriptionData);
        await subscription.save();
        
        // NOTE: Not updating user subscription info in User document as per requirement
        // User subscription data is now sourced from ManualSubscription document only
        
        res.status(201).json({ 
            message: 'Plan assigned to user successfully',
            subscription
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upgrade user plan
export const upgradeUserPlan = async (req, res) => {
    try {
        const { newPlanId, billingPeriod, startDate, duration } = req.body;
        const subscriptionId = req.params.id;
        
        // Get subscription
        const subscription = await ManualSubscription.findById(subscriptionId);
        if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
        
        // Get new plan details
        const newPlan = await ManualPlan.findById(newPlanId);
        if (!newPlan) return res.status(404).json({ message: 'New plan not found' });
        
        // Calculate end date
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        if (billingPeriod === 'yearly') {
            endDateObj.setFullYear(endDateObj.getFullYear() + duration);
        } else {
            endDateObj.setMonth(endDateObj.getMonth() + duration);
        }
        
        // Calculate amount
        const amount = billingPeriod === 'yearly' ? newPlan.price_yearly : newPlan.price_monthly;
        
        // Update subscription
        subscription.plan_id = newPlanId;
        subscription.plan_name = newPlan.name;
        subscription.billing_period = billingPeriod;
        subscription.amount = amount;
        subscription.subscription_start = startDateObj;
        subscription.subscription_end = endDateObj;
        subscription.status = 'active';
        await subscription.save();
        
        // NOTE: Not updating user subscription info in User document as per requirement
        // User subscription data is now sourced from ManualSubscription document only
        
        res.status(200).json({ 
            message: 'User plan upgraded successfully',
            subscription
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Downgrade user plan
export const downgradeUserPlan = async (req, res) => {
    try {
        const { newPlanId, billingPeriod, startDate, duration, selectedForms } = req.body;
        const subscriptionId = req.params.id;
        
        // Get subscription
        const subscription = await ManualSubscription.findById(subscriptionId);
        if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
        
        // Get new plan details
        const newPlan = await ManualPlan.findById(newPlanId);
        if (!newPlan) return res.status(404).json({ message: 'New plan not found' });
        
        // Check if selected forms exceed new plan limit
        if (selectedForms && selectedForms.length > newPlan.form_limit) {
            return res.status(400).json({ 
                message: `Selected forms exceed new plan limit of ${newPlan.form_limit} forms` 
            });
        }
        
        // Calculate end date
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        if (billingPeriod === 'yearly') {
            endDateObj.setFullYear(endDateObj.getFullYear() + duration);
        } else {
            endDateObj.setMonth(endDateObj.getMonth() + duration);
        }
        
        // Calculate amount
        const amount = billingPeriod === 'yearly' ? newPlan.price_yearly : newPlan.price_monthly;
        
        // Update subscription
        subscription.plan_id = newPlanId;
        subscription.plan_name = newPlan.name;
        subscription.billing_period = billingPeriod;
        subscription.amount = amount;
        subscription.subscription_start = startDateObj;
        subscription.subscription_end = endDateObj;
        subscription.status = 'active';
        subscription.forms_selected = selectedForms || [];
        await subscription.save();
        
        // NOTE: Not updating user subscription info in User document as per requirement
        // User subscription data is now sourced from ManualSubscription document only
        
        res.status(200).json({ 
            message: 'User plan downgraded successfully',
            subscription
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};