import { User } from '../models/User.js';
import { ManualPlan } from '../models/ManualPlan.js';
import { GeniePayment } from '../models/GeniePayment.js';
import { GenieSubscription } from '../models/GenieSubscription.js';
import { Form } from '../models/Form.js';
import { Submission } from '../models/Submission.js';
import { getUserPlanLimits } from '../middleware/checkSubscriptionLimits.js';

// Get current subscription details
export const getSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    console.log('Getting subscription details for user:', userId);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get current plan limits and details
    const { error, limits, planName } = await getUserPlanLimits(userId);
    console.log('Plan limits result:', { error, planName, hasLimits: !!limits });
    
    if (error) {
      return res.status(400).json({ error });
    }

    // Get user's Genie subscription
    const genieSubscription = await GenieSubscription.findOne({ 
      user_id: userId,
      status: 'active'
    });

    // Get user's form count
    const formCount = await Form.countDocuments({ user_id: userId, is_active: true });
    
    // Get user's submission count for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const submissionCount = await Submission.countDocuments({
      user_id: userId,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    const subscriptionDetails = {
      plan: {
        name: planName,
        displayName: limits.name || `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
        formLimit: limits.formLimit,
        submissionLimit: limits.submissionLimit,
        description: limits.description,
        features: limits.features
      },
      subscription: {
        status: user.subscription_status || 'inactive',
        subscription_start: genieSubscription?.subscription_start ? new Date(genieSubscription.subscription_start) : null,
        subscription_end: genieSubscription?.subscription_end ? new Date(genieSubscription.subscription_end) : null,
        cancel_at_period_end: false,
        interval: genieSubscription?.billing_period || 'monthly',
        is_active: user.is_active,
        plan_name: genieSubscription?.plan_name || planName,
        amount: genieSubscription?.amount || 0,
        billing_period: genieSubscription?.billing_period || 'monthly'
      },
      formCount: formCount,
      submissionCount: submissionCount
    };

    console.log('Sending subscription details response');
    res.json({ success: true, data: subscriptionDetails });
  } catch (error) {
    console.error('Error getting subscription details:', error);
    res.status(500).json({ error: 'Failed to get subscription details: ' + error.message });
  }
};

// Get available subscription plans (manual plans)
export const getAvailablePlans = async (req, res) => {
  try {
    // Get all active manual plans
    const manualPlans = await ManualPlan.find({ is_active: true });

    // Format plans for frontend
    const subscriptionPlans = manualPlans.map(plan => ({
      id: plan._id,
      name: plan.name,
      description: plan.description,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      form_limit: plan.form_limit,
      submission_limit: plan.submission_limit,
      features: plan.features || [],
      is_active: plan.is_active
    }));

    res.json({ success: true, data: subscriptionPlans });
  } catch (error) {
    console.error('Error getting available plans:', error);
    res.status(500).json({ error: 'Failed to get available plans.' });
  }
};

// Handle payment request for manual plans
export const handlePaymentRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { planId, billingPeriod } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    if (!planId) {
      return res.status(400).json({ error: 'Plan selection is required.' });
    }

    // Get the manual plan
    const plan = await ManualPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Calculate amount based on billing period
    const amount = billingPeriod === 'yearly' ? plan.price_yearly : plan.price_monthly;

    // For manual plans, we'll redirect to a success page since there's no actual payment processing
    // In a real implementation, you might want to create a pending payment record
    
    res.json({ 
      success: true, 
      message: 'Payment request processed successfully',
      data: {
        amount,
        planName: plan.name,
        billingPeriod
      }
    });
  } catch (error) {
    console.error('Error handling payment request:', error);
    res.status(500).json({ error: 'Failed to process payment request.' });
  }
};

// Get payment history (Genie payments only)
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    console.log('Fetching payment history for user:', userId);

    // Get Genie payments for this user
    let geniePayments = [];
    try {
      geniePayments = await GeniePayment.find({ user_id: userId });
      console.log('Found Genie payments:', geniePayments.length);
    } catch (err) {
      console.warn('Could not retrieve Genie payments:', err.message);
      geniePayments = [];
    }

    // Format payment history
    const paymentHistory = geniePayments.map(payment => ({
      id: payment._id,
      source: 'genie',
      amount: payment.amount,
      currency: 'lkr', // Assuming LKR currency
      status: payment.payment_status,
      date: payment.created_at,
      plan: payment.plan_name,
      description: `${payment.plan_name} (${payment.billing_period})`,
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