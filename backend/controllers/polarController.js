import { polar } from "../utils/polarClient.js";
import { PolarPayment } from "../models/PolarPayment.js";
import { User } from "../models/User.js";
import { sendPaymentSuccessEmail } from "../email/emails.js";
import { Subscription } from "../models/Subscription.js";


export const listPolarProducts = async (req, res) => {
  try {
    // 1. Fetch products and discounts in parallel for better performance
    const [productsResponse, discountsResponse] = await Promise.all([
      polar.products.list({
        limit: 20,
        active: true,
      }),
      polar.discounts.list({
        // Filter by organization if you have multiple, 
        // or omit to get all available discounts
        limit: 100
      })
    ]);

    // 2. Extract items from the results
    const products = productsResponse.result.items || [];
    const allDiscounts = discountsResponse.result.items || [];

    // 3. Map discounts to products
    // Polar discounts usually contain a 'products' array of IDs they apply to
    const productsWithDiscounts = products.map(product => {
      const applicableDiscounts = allDiscounts.filter(discount =>
        // A discount is applicable if its 'products' list is empty (applies to all)
        // or if it explicitly includes this product's ID
        !discount.products ||
        discount.products.length === 0 ||
        discount.products.some(p => p.id === product.id)
      );

      return {
        ...product,
        discounts: applicableDiscounts
      };
    });

    res.status(200).json({
      success: true,
      count: productsWithDiscounts.length,
      products: productsWithDiscounts,
    });
  } catch (error) {
    console.error("Polar list products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products and discounts from Polar",
    });
  }
};


export const handleCheckoutCreated = async (data) => {
  const payment = await createPaymentSafely({
    event_type: "checkout.created",
    checkout_id: data.id,
    amount: data.amount,
    currency: data.currency,
    status: "created",
    raw_payload: data,
  });
};

export const handleOrderPaid = async (data) => {
  // Prevent duplicates
  const exists = await PolarPayment.findOne({ order_id: data.id });
  if (exists) return;

  const payment = await createPaymentSafely({
    event_type: "order.paid",
    order_id: data.id,
    transaction_id: data.transaction_id,
    user_id: data.metadata?.userId,
    amount: data.amount,
    currency: data.currency,
    status: "paid",
    customer_id: data.customer_id,
    raw_payload: data,
  });

  console.log("✅ Order paid stored:", payment._id);
};

export const handleSubscriptionActive = async (data) => {
  try {
    // 1️⃣ First, try to get product details from Polar API to map to our local plan
    let plan_name = data.product_name || data.product?.name || "Polar Subscription";
    let billing_period = "monthly"; // Default fallback
    
    // Map Polar interval to our billing periods
    if (data.interval) {
      switch (data.interval.toLowerCase()) {
        case 'month':
        case 'monthly':
          billing_period = 'monthly';
          break;
        case 'year':
        case 'yearly':
          billing_period = 'yearly';
          break;
        case 'semi_month':
        case 'quarter':
        case 'half_yearly':
          billing_period = 'half_yearly';
          break;
        default:
          billing_period = 'monthly'; // fallback
      }
    }
    
    // 2️⃣ Store payment (idempotent protection recommended via unique index)
    const payment = await PolarPayment.create({
      event_type: "subscription.active",
      subscription_id: data.id,
      user_id: data.metadata?.userId,
      plan_id: data.product_id, // Keep as string since Polar uses UUIDs
      plan_name: plan_name,
      billing_period: billing_period,
      amount: data.amount,
      currency: data.currency,
      status: "active",
      customer_id: data.customer_id,
      subscription_start: new Date(data.current_period_start),
      subscription_end: new Date(data.current_period_end),
      raw_payload: data,
    });

    // 3️⃣ Find active subscription (if exists)
    let subscription = await Subscription.findOne({
      user_id: payment.user_id,
      status: "active",
    });

    const isUpgrade = data.metadata?.isUpgrade === true;
    let previousPlanId = null;

    // 4️⃣ Create / Upgrade / Renew
    if (!subscription) {
      // New subscription
      subscription = new Subscription({
        user_id: payment.user_id,
        external_provider: "polar",
        external_plan_id: data.product_id, // Store the Polar product ID
        plan_name: payment.plan_name,
        billing_period: payment.billing_period,
        amount: payment.amount,
        status: "active",
        subscription_start: payment.subscription_start,
        subscription_end: payment.subscription_end,
        auto_renew: true,
        customer_id: payment.customer_id,
        external_subscription_id: payment.subscription_id,
        last_payment_id: payment._id,
      });
    } else {
      previousPlanId = subscription._id; // Use the subscription's own ID as reference

      if (isUpgrade) {
        // Cancel old subscription
        subscription.status = "cancelled";
        subscription.cancelled_at = new Date();
        await subscription.save();

        // Create upgraded subscription
        subscription = new Subscription({
          user_id: payment.user_id,
          external_provider: "polar",
          external_plan_id: data.product_id, // Store the Polar product ID
          plan_name: payment.plan_name,
          billing_period: payment.billing_period,
          amount: payment.amount,
          status: "active",
          subscription_start: payment.subscription_start,
          subscription_end: payment.subscription_end,
          auto_renew: true,
          customer_id: payment.customer_id,
          external_subscription_id: payment.subscription_id,
          last_payment_id: payment._id,
          previous_plan_id: previousPlanId,
          upgrade_reason: "immediate_upgrade",
        });
      } else {
        // Renewal - update existing subscription
        subscription.external_plan_id = data.product_id; // Update Polar product ID
        subscription.plan_name = payment.plan_name;
        subscription.billing_period = payment.billing_period;
        subscription.amount = payment.amount;
        subscription.subscription_end = payment.subscription_end;
        subscription.last_payment_id = payment._id;

        subscription.renewal_history = subscription.renewal_history || [];
        subscription.renewal_history.push({
          payment_id: payment._id,
          renewed_at: new Date(),
        });
      }
    }

    await subscription.save();

    // 5️⃣ Update user
    const user = await User.findById(payment.user_id);
    if (user) {
      user.subscription_plan = payment.plan_name;
      user.subscription_status = "active";
      user.subscription_expiry = payment.subscription_end;
      user.is_active = true;
      await user.save();
    }

    // 6️⃣ Email confirmation
    if (user) {
      await sendPaymentSuccessEmail({
        email: user.email,
        userName: user.first_name || user.name,
        planName: payment.plan_name,
        billingPeriod: payment.billing_period,
        amount: `${payment.amount} ${payment.currency?.toUpperCase() || "USD"}`,
        expiryDate: payment.subscription_end.toDateString(),
      });
    }

    console.log("✅ Polar subscription processed successfully");
  } catch (error) {
    console.error("❌ Error handling subscription active:", error);
    throw error;
  }
};

export const createPaymentSafely = async (payload) => {
  try {
    return await PolarPayment.create(payload);
  } catch (err) {
    if (err.code === 11000) {
      console.log("⚠️ Duplicate webhook ignored:", payload.event_id);
      return null;
    }
    throw err;
  }
};

export const handleSubscriptionCancelled = async (data) => {
  const subscription = await Subscription.findOne({
    external_subscription_id: data.id,
    status: "active",
  });

  if (!subscription) return;

  subscription.status = "cancelled";
  subscription.cancelled_at = new Date(data.cancelled_at || Date.now());
  subscription.auto_renew = false;
  await subscription.save();

  const user = await User.findById(subscription.user_id);
  if (user) {
    user.subscription_status = "cancelled";
    await user.save();
  }

  console.log("🛑 Subscription cancelled:", subscription._id);
};

export const handleOrderRefunded = async (data) => {
  const payment = await PolarPayment.findOne({
    external_order_id: data.id,
  });

  if (!payment) return;

  payment.status = "refunded";
  payment.refunded_at = new Date();
  await payment.save();

  const subscription = await Subscription.findOne({
    last_payment_id: payment._id,
  });

  if (subscription) {
    subscription.status = "refunded";
    subscription.cancelled_at = new Date();
    await subscription.save();
  }

  const user = await User.findById(payment.user_id);
  if (user) {
    user.subscription_status = "refunded";
    user.is_active = false;
    await user.save();
  }

  console.log("💸 Refund processed successfully");
};

export const handlePaymentFailed = async (data) => {
  const subscription = await Subscription.findOne({
    external_subscription_id: data.subscription_id,
  });

  if (!subscription) return;

  subscription.status = "past_due";
  subscription.grace_period_ends_at = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  );

  await subscription.save();

  const user = await User.findById(subscription.user_id);
  if (user) {
    user.subscription_status = "past_due";
    await user.save();
  }

  console.log("⚠️ Subscription in grace period");
};

export const getCustomerSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find user to get their Polar customer ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find active Polar subscriptions for this user
    const polarSubscriptions = await Subscription.find({
      user_id: userId,
      external_provider: "polar",
      status: { $in: ["active", "trialing"] }
    }).sort({ subscription_end: -1 });
    
    if (polarSubscriptions.length === 0) {
      return res.status(200).json({
        subscriptions: [],
        message: "No active Polar subscriptions found for this user"
      });
    }
    
    // Transform subscription data to match frontend expectations
    const transformedSubscriptions = polarSubscriptions.map(sub => ({
      id: sub._id.toString(),
      plan_name: sub.plan_name,
      amount: sub.amount,
      currency: "usd", // Default currency
      billing_period: sub.billing_period,
      status: sub.status,
      subscription_start: sub.subscription_start,
      subscription_end: sub.subscription_end,
      auto_renew: sub.auto_renew,
      external_subscription_id: sub.external_subscription_id,
      external_provider: sub.external_provider,
      external_plan_id: sub.external_plan_id,
      customer_id: sub.customer_id
    }));
    
    // Get customer ID from the first subscription
    const customerId = polarSubscriptions[0].customer_id || null;
    
    res.status(200).json({
      subscriptions: transformedSubscriptions,
      allSubscriptions: transformedSubscriptions,
      customerId: customerId
    });
    
  } catch (error) {
    console.error("Error fetching customer subscriptions:", error);
    res.status(500).json({
      message: "Failed to fetch subscription details",
      error: error.message
    });
  }
};


export const getCustomerBillingPortal = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find user to get their Polar customer ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find the user's Polar customer ID from their subscriptions or payments
    let polarCustomerId = null;
    
    // First, try to find from existing PolarPayment records
    const recentPayment = await PolarPayment.findOne({
      user_id: userId,
      customer_id: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });
    
    if (recentPayment && recentPayment.customer_id) {
      polarCustomerId = recentPayment.customer_id;
    } else {
      // If no customer ID found, try to find from subscription
      const subscription = await Subscription.findOne({
        user_id: userId,
        external_provider: "polar",
        customer_id: { $exists: true, $ne: null }
      });
      
      if (subscription && subscription.customer_id) {
        polarCustomerId = subscription.customer_id;
      }
    }
    
    if (!polarCustomerId) {
      return res.status(404).json({ message: "No Polar customer ID found for this user" });
    }
    
    // Get organization slug from environment or use a default
    const orgSlug = process.env.POLAR_ORG_SLUG;
        
    if (!orgSlug) {
      return res.status(500).json({
        message: "Polar organization slug not configured in environment variables"
      });
    }
        
    // Try to create customer session using the Polar SDK
    let portalUrl;
    
    // Check for the correct method name as per Polar documentation
    // The method is customerSessions (with capital S) not customer_sessions
    const hasCustomerSessionsMethod = polar && 
                                     polar.customerSessions && 
                                     typeof polar.customerSessions === 'object' &&
                                     typeof polar.customerSessions.create === 'function';
    
    if (hasCustomerSessionsMethod) {
      try {
        // Attempt to create a customer session using the correct method name
        const customerSession = await polar.customerSessions.create({
          customerId: polarCustomerId
        });
        
        if (customerSession && customerSession.customerPortalUrl) {
          // If successful, use the customerPortalUrl from the response
          portalUrl = customerSession.customerPortalUrl;
        } else {
          // If session creation fails, fall back to portal URL
          const baseUrl = process.env.POLAR_ENV === 'production' 
            ? `https://${orgSlug}.polar.sh`
            : `https://${orgSlug}.sandbox.polar.sh`;
          
          portalUrl = `${baseUrl}/portal`;
        }
      } catch (sessionError) {
        console.warn('Warning: Could not create customer session:', sessionError.message);
        // Fallback to portal URL without session token
        const baseUrl = process.env.POLAR_ENV === 'production' 
          ? `https://${orgSlug}.polar.sh`
          : `https://${orgSlug}.sandbox.polar.sh`;
        
        portalUrl = `${baseUrl}/portal`;
      }
    } else {
      // If the method doesn't exist, create portal URL without session token
      const baseUrl = process.env.POLAR_ENV === 'production' 
        ? `https://${orgSlug}.polar.sh`
        : `https://${orgSlug}.sandbox.polar.sh`;
      
      portalUrl = `${baseUrl}/portal`;
    }
    
    res.status(200).json({
      url: portalUrl,
      customerId: polarCustomerId
    });
    
  } catch (error) {
    console.error("Error getting customer billing portal:", error);
    res.status(500).json({
      message: "Failed to get customer billing portal",
      error: error.message
    });
  }
};

export const getCustomerPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find Polar payment history for this user
    const payments = await PolarPayment.find({ 
      user_id: userId 
    }).sort({ createdAt: -1 }); // Sort by newest first
    
    // Transform the payments to match the expected format
    const paymentHistory = payments.map(payment => ({
      id: payment._id,
      source: 'polar',
      amount: payment.amount,
      currency: payment.currency || 'usd',
      status: payment.status,
      date: payment.createdAt,
      plan: payment.plan_name,
      description: `${payment.plan_name} (${payment.billing_period})`,
      billing_period: payment.billing_period,
      transaction_id: payment.transaction_id,
      event_type: payment.event_type,
      subscription_id: payment.subscription_id
    }));

    res.status(200).json({ 
      success: true, 
      data: paymentHistory 
    });
    
  } catch (error) {
    console.error('Error getting Polar payment history:', error);
    res.status(500).json({ 
      error: 'Failed to get Polar payment history.' 
    });
  }
};
