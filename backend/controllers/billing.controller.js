import { stripe } from "../utils/stripe.js";
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { getUserPlanLimits } from '../middleware/checkSubscriptionLimits.js';

export const createCustomerPortalSession = async (req, res) => {
  try {
    // req.userId is expected to be set by your verifyToken middleware
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const customerId = user.stripeCustomerId;

    if (!customerId) {
      return res.status(400).json({ error: 'Stripe Customer ID not found for this user. Please ensure a subscription has been created.' });
    }

    // Specify the URL where Stripe should redirect the user after they are done in the portal.
    // Ensure CLIENT_URL is defined in your .env
    const returnUrl = `${process.env.CLIENT_URL}/billing`; // Or your desired return page

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'Failed to create customer portal session.' });
  }
};

// Get current subscription details
export const getSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get current plan limits and details
    const { error, limits, planName, activePayment } = await getUserPlanLimits(userId);
    
    if (error) {
      return res.status(400).json({ error });
    }

    let stripeSubscription = null;
    let paymentMethod = null;

    if (user.stripeCustomerId) {
      // Get Stripe subscription details
      if (user.subscription_plan && user.subscription_plan !== 'default_plan') {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(user.subscription_plan, {
            expand: ['items.data.price']
          });
        } catch (err) {
          console.warn('Could not retrieve Stripe subscription:', err.message);
        }
      }

      // Get default payment method
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (customer.default_source || customer.invoice_settings?.default_payment_method) {
          const paymentMethodId = customer.invoice_settings?.default_payment_method || customer.default_source;
          paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        }
      } catch (err) {
        console.warn('Could not retrieve payment method:', err.message);
      }
    }

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
        current_period_start: stripeSubscription?.current_period_start ? new Date(stripeSubscription.current_period_start * 1000) : null,
        current_period_end: user.subscription_expiry || stripeSubscription?.current_period_end ? new Date(stripeSubscription.current_period_end * 1000) : null,
        cancel_at_period_end: stripeSubscription?.cancel_at_period_end || false,
        interval: stripeSubscription?.items?.data[0]?.price?.recurring?.interval || null,
        is_active: user.is_active
      },
      paymentMethod: paymentMethod ? {
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        } : null
      } : null,
      activePayment
    };

    res.json({ success: true, data: subscriptionDetails });
  } catch (error) {
    console.error('Error getting subscription details:', error);
    res.status(500).json({ error: 'Failed to get subscription details.' });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    // Get payments from our database
    const payments = await Payment.find({ user_id: userId })
      .sort({ payment_date: -1 })
      .limit(50); // Last 50 payments

    const user = await User.findById(userId);
    let stripeInvoices = [];

    // Get invoices from Stripe if customer exists
    if (user && user.stripeCustomerId) {
      try {
        const invoices = await stripe.invoices.list({
          customer: user.stripeCustomerId,
          limit: 50,
        });
        stripeInvoices = invoices.data;
      } catch (err) {
        console.warn('Could not retrieve Stripe invoices:', err.message);
      }
    }

    // Combine and format payment history
    const paymentHistory = [
      // From our database
      ...payments.map(payment => ({
        id: payment._id,
        source: 'database',
        amount: payment.amount,
        currency: 'usd',
        status: 'succeeded',
        date: payment.payment_date,
        plan: payment.plan,
        subscription_expiry: payment.subscription_expiry,
        description: `${payment.plan} Plan Subscription`
      })),
      // From Stripe
      ...stripeInvoices.map(invoice => ({
        id: invoice.id,
        source: 'stripe',
        amount: invoice.amount_paid / 100, // Convert cents to dollars
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        plan: invoice.lines?.data[0]?.description || 'Subscription',
        description: invoice.description || invoice.lines?.data[0]?.description || 'Subscription Payment',
        invoice_url: invoice.hosted_invoice_url
      }))
    ];

    // Sort by date (newest first) and remove duplicates
    const uniquePayments = paymentHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20); // Limit to 20 most recent

    res.json({ success: true, data: uniquePayments });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({ error: 'Failed to get payment history.' });
  }
};

// Get available subscription plans
export const getAvailablePlans = async (req, res) => {
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
        priceId: price.id,
        productId: price.product.id,
        name: price.product.name,
        description: price.product.description,
        amount: price.unit_amount / 100, // Convert cents to dollars
        currency: price.currency,
        interval: price.recurring.interval,
        features: price.product.metadata?.features ? JSON.parse(price.product.metadata.features) : []
      }))
      .sort((a, b) => a.amount - b.amount); // Sort by price

    res.json({ success: true, data: subscriptionPlans });
  } catch (error) {
    console.error('Error getting available plans:', error);
    res.status(500).json({ error: 'Failed to get available plans.' });
  }
};

// Create setup intent for adding payment method
export const createSetupIntent = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'User or Stripe customer not found.' });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
    });

    res.json({ 
      success: true, 
      data: { 
        client_secret: setupIntent.client_secret,
        setup_intent_id: setupIntent.id
      } 
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent.' });
  }
};

// Get customer payment methods
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'User or Stripe customer not found.' });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year
      } : null,
      created: new Date(pm.created * 1000)
    }));

    res.json({ success: true, data: formattedMethods });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods.' });
  }
};

// Delete payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.userId;
    const { paymentMethodId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'User or Stripe customer not found.' });
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      return res.status(403).json({ error: 'Payment method does not belong to this customer.' });
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({ success: true, message: 'Payment method removed successfully.' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method.' });
  }
};

// Update default payment method
export const setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.userId;
    const { paymentMethodId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'User or Stripe customer not found.' });
    }

    // Update customer's default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ success: true, message: 'Default payment method updated successfully.' });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ error: 'Failed to set default payment method.' });
  }
};