import { polar } from "../utils/polarClient.js";
import { PolarPayment } from "../models/PolarPayment.js";
import { User } from "../models/User.js";
import { sendPaymentSuccessEmail } from "../email/emails.js";
import { Subscription } from "../models/Subscription.js";
import { getUserUsageStats } from "../middleware/checkSubscriptionLimits.js";
import { resetMeterUsage } from "../services/polarMeter.service.js";
import { extractFeaturesFromBenefits } from "../utils/extractFeaturesFromBenefits.js";

/**
 * Helper function to extract user_id from Polar webhook data
 * Polar stores our MongoDB user ID in customer.external_id
 */
const extractUserId = (data) => {
  return data.customer?.external_id || data.metadata?.userId;
};

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
  const userId = extractUserId(data);

  // Log if user_id is not found (checkout might be created before customer is linked)
  if (!userId) {
    console.log("ℹ️ Checkout created without user_id (customer may link later):", data.id);
  }

  const payment = await createPaymentSafely({
    event_type: "checkout.created",
    checkout_id: data.id,
    user_id: userId,
    amount: data.amount,
    currency: data.currency,
    status: "created",
    raw_payload: data,
  });
};

export const handleOrderPaid = async (data) => {
  // Prevent duplicates
  const exists = await PolarPayment.findOne({ order_id: data.id });
  if (exists) {
    console.log("⚠️ Order already processed:", data.id);
    return;
  }

  // Extract user_id from customer.external_id (MongoDB user ID)
  const userId = extractUserId(data);

  if (!userId) {
    console.error("❌ No user_id found in order data. customer:", data.customer, "metadata:", data.metadata);
    // Don't throw error for order.paid, just log and store what we have
  }

  const payment = await createPaymentSafely({
    event_type: "order.paid",
    order_id: data.id,
    transaction_id: data.transaction_id,
    user_id: userId,
    amount: data.amount,
    currency: data.currency,
    status: "paid",
    customer_id: data.customer_id,
    raw_payload: data,
  });

  if (payment) {
    console.log("✅ Order paid stored:", payment._id);
  }
};

export const handleSubscriptionActive = async (data) => {
  try {
    // 1️⃣ Extract user_id from customer.external_id (MongoDB user ID)
    let userId = extractUserId(data);

    // If userId not found in initial data, try to fetch customer from Polar with retries
    // This handles the race condition where subscription.active arrives before customer is fully set up
    if (!userId && data.customer_id) {
      console.log(`⚠️ external_id not in webhook payload. Fetching customer ${data.customer_id} from Polar...`);

      // Retry up to 3 times with 1 second delay to handle race condition
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Wait before fetching (except on first attempt)
          if (attempt > 1) {
            console.log(`   Retry attempt ${attempt}/3 after 1 second delay...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          const customer = await polar.customers.get({ id: data.customer_id });
          if (customer?.externalId) {
            userId = customer.externalId;
            console.log(`✅ Retrieved external_id from Polar customer: ${userId}`);
            break; // Success, exit retry loop
          } else {
            console.log(`   Attempt ${attempt}: Customer fetched but external_id not set yet`);
          }
        } catch (fetchError) {
          console.error(`   Attempt ${attempt}: Failed to fetch customer:`, fetchError.message);
        }
      }
    }

    if (!userId) {
      console.error("❌ No user_id found in subscription data after retries.");
      console.error("   customer:", JSON.stringify(data.customer, null, 2));
      console.error("   metadata:", JSON.stringify(data.metadata, null, 2));
      console.error("   customer_id:", data.customer_id);

      // Throw error to make Polar retry the webhook
      throw new Error("Cannot process subscription without user_id. customer.external_id not set yet. Will retry.");
    }

    // Validate that user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      console.error(`❌ User ${userId} not found in database`);
      throw new Error(`User ${userId} not found in database`);
    }

    console.log(`✅ Processing subscription for user ${userId}`);

    // 2️⃣ Get product details for plan mapping
    let plan_name = data.product_name || data.product?.name || "Polar Subscription";
    let billing_period = "monthly"; // Default fallback

    // Map Polar interval to our billing periods
    if (data.recurring_interval) {
      switch (data.recurring_interval.toLowerCase()) {
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

    // 3️⃣ Store payment (idempotent protection recommended via unique index)
    const payment = await PolarPayment.create({
      event_type: "subscription.active",
      subscription_id: data.id,
      user_id: userId,
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

    // 4️⃣ Find active subscription (if exists)
    let subscription = await Subscription.findOne({
      user_id: payment.user_id,
      status: "active",
    });

    const isUpgrade = data.metadata?.isUpgrade === true;
    let previousPlanId = null;

    // 5️⃣ Extract Plan Limits from Metadata and Features from Benefits
    const meta = data.metadata || {};

    // Try to get limits from metadata first, then fall back to product metadata
    let formLimit = meta.formLimit ? parseInt(meta.formLimit) : undefined;
    let submissionLimit = meta.submissionLimit ? parseInt(meta.submissionLimit) : undefined;

    // If limits not in session metadata, try product metadata (for static checkout links)
    if ((formLimit === undefined || submissionLimit === undefined) && data.product?.metadata) {
      const productMeta = data.product.metadata;
      if (formLimit === undefined && productMeta.formLimit) {
        formLimit = parseInt(productMeta.formLimit);
        console.log("✅ formLimit extracted from product.metadata:", formLimit);
      }
      if (submissionLimit === undefined && productMeta.submissionLimit) {
        submissionLimit = parseInt(productMeta.submissionLimit);
        console.log("✅ submissionLimit extracted from product.metadata:", submissionLimit);
      }
    }

    // Extract features from product benefits (primary method)
    let features = { image_upload: false, employee_management: false };
    const productBenefits = data.product?.benefits;

    if (productBenefits && Array.isArray(productBenefits) && productBenefits.length > 0) {
        features = extractFeaturesFromBenefits(productBenefits);
        console.log("✅ Features extracted from product benefits:", features);
    } else {
        // Benefits not in webhook payload - fetch product to get benefits and metadata
        try {
            const product = await polar.products.get({ id: data.product_id });
            if (product?.benefits && Array.isArray(product.benefits)) {
                features = extractFeaturesFromBenefits(product.benefits);
                console.log("✅ Features extracted from fetched product benefits:", features);
            }
            
            // Also try to get limits from fetched product metadata if still missing
            if ((formLimit === undefined || submissionLimit === undefined) && product?.metadata) {
              if (formLimit === undefined && product.metadata.formLimit) {
                formLimit = parseInt(product.metadata.formLimit);
                console.log("✅ formLimit extracted from fetched product.metadata:", formLimit);
              }
              if (submissionLimit === undefined && product.metadata.submissionLimit) {
                submissionLimit = parseInt(product.metadata.submissionLimit);
                console.log("✅ submissionLimit extracted from fetched product.metadata:", submissionLimit);
              }
            }
        } catch (fetchError) {
            console.log("⚠️ Could not fetch product benefits, using defaults:", fetchError.message);
        }
    }

    // 6️⃣ Create / Upgrade / Renew
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
        auto_renew: !data.cancel_at_period_end,
        cancel_at_period_end: data.cancel_at_period_end || false,
        customer_id: payment.customer_id,
        external_subscription_id: payment.subscription_id,
        last_payment_id: payment._id,
        // Set limits (0 = metered/unlimited, actual limits come from Polar meter credits)
        form_limit: formLimit || 0,
        submission_limit: submissionLimit || 0,
        features: {
            image_upload: features.image_upload !== undefined ? features.image_upload : false,
            employee_management: features.employee_management !== undefined ? features.employee_management : false
        }
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
          auto_renew: !data.cancel_at_period_end,
          cancel_at_period_end: data.cancel_at_period_end || false,
          customer_id: payment.customer_id,
          external_subscription_id: payment.subscription_id,
          last_payment_id: payment._id,
          previous_plan_id: previousPlanId,
          upgrade_reason: "immediate_upgrade",
          // Update limits for upgrade (0 = metered/unlimited, actual limits come from Polar meter credits)
          form_limit: formLimit || 0,
          submission_limit: submissionLimit || 0,
          features: {
            image_upload: features.image_upload !== undefined ? features.image_upload : subscription.features.image_upload,
            employee_management: features.employee_management !== undefined ? features.employee_management : subscription.features.employee_management
          }
        });
      } else {
        // Renewal - update existing subscription
        subscription.external_plan_id = data.product_id; // Update Polar product ID
        subscription.external_subscription_id = payment.subscription_id; // Update subscription ID (important for cancellations!)
        subscription.plan_name = payment.plan_name;
        subscription.billing_period = payment.billing_period;
        subscription.amount = payment.amount;
        subscription.subscription_end = payment.subscription_end;
        subscription.last_payment_id = payment._id;
        subscription.auto_renew = !data.cancel_at_period_end;
        subscription.cancel_at_period_end = data.cancel_at_period_end || false;

        // Update limits on renewal if provided (allows seamless resizing)
        if (formLimit !== undefined) subscription.form_limit = formLimit;
        if (submissionLimit !== undefined) subscription.submission_limit = submissionLimit;
        if (features.image_upload !== undefined) subscription.features.image_upload = features.image_upload;
        if (features.employee_management !== undefined) subscription.features.employee_management = features.employee_management;

        subscription.renewal_history = subscription.renewal_history || [];
        subscription.renewal_history.push({
          payment_id: payment._id,
          renewed_at: new Date(),
        });
      }
    }

    await subscription.save();

    // Reset meter usage on new subscription or upgrade
    if (!subscription || isUpgrade) {
        await resetMeterUsage(payment.user_id);
    }

    // 7️⃣ Update user
    const user = await User.findById(payment.user_id);
    if (user) {
      user.subscription_plan = payment.plan_name;
      user.subscription_status = "active";
      user.subscription_expiry = payment.subscription_end;
      user.is_active = true;
      await user.save();
    }

    // 8️⃣ Email confirmation
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
  });

  if (!subscription) {
    console.log("⚠️ Subscription not found for cancellation:", data.id);
    return;
  }

  // When Polar sends subscription.canceled, the subscription might still be active
  // until the end of the billing period. Check cancel_at_period_end flag.
  const cancelAtPeriodEnd = data.cancel_at_period_end || false;
  const currentStatus = data.status || "active";

  // Update subscription with cancellation info
  subscription.cancelled_at = new Date(data.cancelled_at || Date.now());
  subscription.cancel_at_period_end = cancelAtPeriodEnd;
  subscription.auto_renew = false;

  // If still active until period end, keep status as active
  if (cancelAtPeriodEnd && currentStatus === "active") {
    subscription.status = "active"; // Keep active until period ends
    console.log("🛑 Subscription scheduled for cancellation at period end:", subscription._id);
  } else {
    // Immediately cancelled or already inactive
    subscription.status = "cancelled";
    console.log("🛑 Subscription cancelled immediately:", subscription._id);
  }

  // Update subscription end date if provided
  if (data.ends_at) {
    subscription.subscription_end = new Date(data.ends_at);
  }

  await subscription.save();

  // Update user status
  const user = await User.findById(subscription.user_id);
  if (user) {
    // If subscription is still active, don't mark user as cancelled yet
    if (subscription.status === "active") {
      user.subscription_status = "active";
      // Keep user active until subscription actually ends
      user.is_active = true;
    } else {
      user.subscription_status = "canceled"; // Use American spelling to match User model enum
      user.is_active = false;
    }
    await user.save();
  }

  console.log(`✅ Subscription cancellation processed: ${subscription._id}, status: ${subscription.status}, cancel_at_period_end: ${cancelAtPeriodEnd}`);
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

export const handleSubscriptionUpdated = async (data) => {
  const subscription = await Subscription.findOne({
    external_subscription_id: data.id,
  });

  if (!subscription) {
    console.log("⚠️ Subscription not found for update:", data.id);
    return;
  }

  // Check if product changed (plan change)
  const productChanged = subscription.external_plan_id !== data.product_id;
  const previousStatus = subscription.status;

  // ---- Sync subscription state (mirror Polar) ----
  subscription.status = data.status; // active | past_due | canceled | trialing

  // Update period dates
  if (data.current_period_start) {
    subscription.subscription_start = new Date(data.current_period_start);
  }

  if (data.current_period_end) {
    subscription.subscription_end = new Date(data.current_period_end);
  }

  // Sync cancellation info
  subscription.auto_renew = !data.cancel_at_period_end;
  subscription.cancel_at_period_end = data.cancel_at_period_end || false;

  if (data.cancelled_at) {
    subscription.cancelled_at = new Date(data.cancelled_at);
  }

  if (data.ends_at) {
    subscription.subscription_end = new Date(data.ends_at);
  }

  // Update product/plan info if changed
  if (data.product_id) {
    subscription.external_plan_id = data.product_id;
  }

  if (data.product?.name) {
    subscription.plan_name = data.product.name;
  }

  if (data.amount !== undefined) {
    subscription.amount = data.amount;
  }

  // Update limits from metadata if present
  if (data.product?.metadata) {
    const meta = data.product.metadata;

    if (meta.formLimit) {
      subscription.form_limit = parseInt(meta.formLimit);
    }

    if (meta.submissionLimit) {
      subscription.submission_limit = parseInt(meta.submissionLimit);
    }
  }

  // Update features from benefits (primary method)
  const productBenefits = data.product?.benefits;
  if (productBenefits && Array.isArray(productBenefits) && productBenefits.length > 0) {
    const features = extractFeaturesFromBenefits(productBenefits);
    subscription.features.image_upload = features.image_upload;
    subscription.features.employee_management = features.employee_management;
    console.log("✅ Features updated from product benefits:", features);
  } else if (data.product_id) {
    // Try to fetch product to get benefits
    try {
      const product = await polar.products.get({ id: data.product_id });
      if (product?.benefits && Array.isArray(product.benefits)) {
        const features = extractFeaturesFromBenefits(product.benefits);
        subscription.features.image_upload = features.image_upload;
        subscription.features.employee_management = features.employee_management;
        console.log("✅ Features updated from fetched product benefits:", features);
      }
    } catch (fetchError) {
      console.log("⚠️ Could not fetch product benefits for update:", fetchError.message);
    }
  }

  subscription.updated_at = new Date();

  await subscription.save();

  // Reset meters if plan changed
  if (productChanged) {
    await resetMeterUsage(subscription.user_id);
    console.log(`🔄 Meters reset due to plan change for user ${subscription.user_id}`);
  }

  // ---- Sync user metadata ----
  const user = await User.findById(subscription.user_id);
  if (user) {
    user.subscription_status = subscription.status;
    user.subscription_expiry = subscription.subscription_end;

    if (subscription.plan_name) {
      user.subscription_plan = subscription.plan_name;
    }

    // User remains active unless explicitly revoked/expired/cancelled
    if (subscription.status === "active" || subscription.status === "trialing") {
      user.is_active = true;
    } else if (subscription.status === "canceled" || subscription.status === "expired") {
      user.is_active = false;
    }

    await user.save();
  }

  console.log(
    `🔄 Subscription updated: ${subscription._id}, status: ${previousStatus} → ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end}`
  );
};


export const handleSubscriptionRevoked = async (data) => {
  const subscription = await Subscription.findOne({
    external_subscription_id: data.id,
  });

  if (!subscription) return;

  subscription.status = "expired";
  subscription.cancelled_at = new Date();
  await subscription.save();

  const user = await User.findById(subscription.user_id);
  if (user) {
    user.subscription_status = "expired";
    user.is_active = false;
    await user.save();
  }

  console.log("🚫 Subscription revoked:", subscription._id);
};

export const getCustomerSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find user to get their Polar customer ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get real usage stats and limits
    const { error, stats } = await getUserUsageStats(userId);
    if (error) {
        console.warn('Warning: Could not fetch usage stats for customer:', error);
    }
    
    // Find active Polar subscriptions for this user
    const polarSubscriptions = await Subscription.find({
      user_id: userId,
      external_provider: "polar",
      status: { $in: ["active", "trialing"] }
    }).sort({ subscription_end: -1 });
    
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
    const customerId = polarSubscriptions.length > 0 ? polarSubscriptions[0].customer_id : null;
    
    res.status(200).json({
      subscriptions: transformedSubscriptions,
      allSubscriptions: transformedSubscriptions,
      customerId: customerId,
      // Include usage stats
      formCount: stats?.usage?.forms?.current || 0,
      limits: stats?.limits || null
    });
    
  } catch (error) {
    console.error("Error fetching customer subscriptions:", error);
    res.status(500).json({
      message: "Failed to fetch subscription details",
      error: error.message
    });
  }
};


// Helper to get Polar Customer ID and Session
const getPolarCustomerSession = async (userId) => {
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  // Gather all potential Polar Customer IDs
  const potentialIds = new Set();
  
  // 1. From PolarPayment records (most recent first)
  const payments = await PolarPayment.find({
    user_id: userId,
    customer_id: { $exists: true, $ne: null }
  }).sort({ createdAt: -1 });
  
  payments.forEach(p => potentialIds.add(p.customer_id));
  
  // 2. From Subscriptions
  const subscriptions = await Subscription.find({
    user_id: userId,
    external_provider: "polar",
    customer_id: { $exists: true, $ne: null }
  });
  
  subscriptions.forEach(s => potentialIds.add(s.customer_id));
  
  if (potentialIds.size === 0) {
    throw new Error("No Polar customer ID found for this user");
  }
  
  console.log(`Debug: Found ${potentialIds.size} potential customer IDs for user ${userId}:`, [...potentialIds]);

  let lastError = null;

  // Try each ID until we find a working one
  for (const customerId of potentialIds) {
    try {
      console.log(`Debug: Trying to create session for customerId: ${customerId}`);
      const customerSession = await polar.customerSessions.create({
        customerId: customerId
      });
      
      console.log(`Debug: Successfully created session for ${customerId}`);
      return { customerId, customerSession };
      
    } catch (err) {
      console.warn(`Debug: Failed to create session for ${customerId}:`, err.message || err);
      lastError = err;
      
      // If error indicates customer doesn't exist, we continue to next
      // Polar SDK error might be complex object, check string representation or properties
      const errorStr = JSON.stringify(err);
      if (errorStr.includes("Customer does not exist") || errorStr.includes("Resource not found")) {
        continue;
      }
      
      // If it's another type of error (e.g. auth, rate limit), might want to stop or just log
      // For now, continue trying others is safer
    }
  }

  // If we get here, none worked
  console.error("Debug: All potential customer IDs failed.");
  throw new Error("Could not creating valid customer session with any found IDs. Last error: " + (lastError?.message || "Unknown"));
};

export const getCustomerBillingPortal = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get organization slug from environment or use a default
    const orgSlug = process.env.POLAR_ORG_SLUG;
        
    if (!orgSlug) {
      return res.status(500).json({
        message: "Polar organization slug not configured in environment variables"
      });
    }

    try {
      const { customerSession, customerId } = await getPolarCustomerSession(userId);
      
      if (customerSession && customerSession.customerPortalUrl) {
         return res.status(200).json({
          url: customerSession.customerPortalUrl,
          customerId: customerId
        });
      }
    } catch (err) {
      console.warn('Could not create session for portal URL:', err.message);
      // Fallthrough to basic URL if no session
    }
    
    // Fallback URL
    const baseUrl = process.env.POLAR_ENV === 'production' 
      ? `https://${orgSlug}.polar.sh`
      : `https://${orgSlug}.sandbox.polar.sh`;
    
    res.status(200).json({
      url: `${baseUrl}/portal`,
      customerId: null
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
      // If we don't have a linked customer ID, return empty list
      return res.status(200).json({ 
        success: true, 
        data: [] 
      });
    }

    // Fetch orders directly from Polar API
    const response = await polar.orders.list({
      customerId: polarCustomerId,
      limit: 100,
      sorting: ['-created_at']
    });

    // Extract items from response (SDK handles pagination structure)
    // Depending on SDK version, it might be response.result.items or just response.items if using iterator helper
    // Based on SDK inspection: OrdersListResponse has result: ListResourceOrder
    const orders = response.result?.items || [];
    
    // Transform the orders to match the expected format
    const paymentHistory = orders.map(order => {
      const planName = order.product?.name || 'Polar Product';
      const billingPeriod = order.subscription?.recurringInterval || 'one-time';
      
      return {
        id: order.id,
        source: 'polar',
        // Polar returns amount in cents
        amount: order.totalAmount, 
        currency: order.currency || 'usd',
        status: order.status,
        date: order.createdAt,
        plan: planName,
        description: `${planName} (${billingPeriod})`,
        billing_period: billingPeriod,
        transaction_id: order.id,
        // event_type is not available in order, but we can infer or leave empty
        event_type: 'order.paid', 
        subscription_id: order.subscriptionId
      };
    });

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

