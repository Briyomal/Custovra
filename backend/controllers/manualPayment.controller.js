import { ManualPayment } from "../models/ManualPayment.js";
import { User } from "../models/User.js";
import { ManualPlan } from "../models/ManualPlan.js";
import { ManualSubscription } from "../models/ManualSubscription.js";
import { Form } from "../models/Form.js";
import { processFormSelectionAfterPayment } from "./manualBilling.controller.js";

// Get all manual payments
export const getAllManualPayments = async (req, res) => {
    try {
        const payments = await ManualPayment.find().populate('user_id', 'name email').populate('plan_id', 'name');
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all pending manual payments
export const getAllPendingPayments = async (req, res) => {
    try {
        const payments = await ManualPayment.find({ payment_status: 'pending' })
            .populate('user_id', 'name email')
            .populate('plan_id', 'name');
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a manual payment by ID
export const getManualPaymentById = async (req, res) => {
    try {
        const payment = await ManualPayment.findById(req.params.id)
            .populate('user_id', 'name email')
            .populate('plan_id', 'name');
        if (!payment) return res.status(404).json({ message: 'Manual payment not found' });
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new manual payment
export const createManualPayment = async (req, res) => {
    try {
        const newPayment = new ManualPayment(req.body);
        await newPayment.save();
        res.status(201).json(newPayment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a manual payment
export const updateManualPayment = async (req, res) => {
    try {
        const updatedPayment = await ManualPayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPayment) return res.status(404).json({ message: 'Manual payment not found' });
        res.status(200).json(updatedPayment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a manual payment
export const deleteManualPayment = async (req, res) => {
    try {
        const deletedPayment = await ManualPayment.findByIdAndDelete(req.params.id);
        if (!deletedPayment) return res.status(404).json({ message: 'Manual payment not found' });
        res.status(200).json({ message: 'Manual payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Approve a manual payment
export const approveManualPayment = async (req, res) => {
    try {
        const payment = await ManualPayment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Manual payment not found' });
        
        // Update payment status
        payment.payment_status = 'approved';
        payment.admin_notes = req.body.admin_notes || '';
        await payment.save();
        
        // Create or update subscription
        const subscriptionData = {
            user_id: payment.user_id,
            plan_id: payment.plan_id,
            plan_name: payment.plan_name,
            billing_period: payment.billing_period,
            amount: payment.amount,
            status: 'active',
            subscription_start: payment.subscription_start,
            subscription_end: payment.subscription_end,
            auto_renew: false
        };
        
        // Check if user already has a subscription
        let subscription = await ManualSubscription.findOne({ user_id: payment.user_id });
        if (subscription) {
            // Update existing subscription
            Object.assign(subscription, subscriptionData);
            await subscription.save();
        } else {
            // Create new subscription
            subscription = new ManualSubscription(subscriptionData);
            await subscription.save();
        }
        
        // Update user subscription info
        const user = await User.findById(payment.user_id);
        if (user) {
            user.subscription_plan = payment.plan_name;
            user.subscription_plan_id = payment.plan_id;
            user.subscription_expiry = payment.subscription_end;
            user.subscription_status = 'active';
            user.is_active = true;
            await user.save();
        }
        
        // Process form selection if it exists
        let formProcessingResult = null;
        if (payment.form_selection) {
            formProcessingResult = await processFormSelectionAfterPayment(payment.user_id, payment.form_selection);
            console.log('Form selection processing result:', formProcessingResult);
        }
        
        res.status(200).json({ 
            message: 'Payment approved and subscription activated',
            payment,
            subscription,
            formProcessingResult
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reject a manual payment
export const rejectManualPayment = async (req, res) => {
    try {
        const payment = await ManualPayment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Manual payment not found' });
        
        // Update payment status
        payment.payment_status = 'rejected';
        payment.admin_notes = req.body.admin_notes || '';
        await payment.save();
        
        res.status(200).json({ 
            message: 'Payment rejected',
            payment
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};