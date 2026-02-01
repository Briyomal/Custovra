
// server/controllers/payment.controller.js
import { polar } from "../utils/polarClient.js";
import { User } from "../models/User.js";
import { Subscription } from "../models/Subscription.js";


export const createCheckout = async (req, res) => {
  try {
    // productId: the ID of the product in Polar
    // amount: the raw price you want to charge (e.g., calculated on backend)
    // Note: imageUpload and employeeManagement are now determined by product benefits in Polar
    const { productId, amount, discountId, formLimit, submissionLimit } = req.body;
    const user = await User.findById(req.userId);
    console.log("Body", req.body);
    console.log("Form Limit", formLimit);
    console.log("Submission Limit", submissionLimit);

    //console.log("Discount ID", discountId);

    if (!productId || !user) {
      return res.status(400).json({ 
        message: 'Missing product ID or user',
        received: { productId, user: !!user } 
      });
    }

    // Check if user already has an active Polar subscription
    const existingSubscription = await Subscription.findOne({
      user_id: req.userId,
      status: 'active',
      external_provider: 'polar'
    });

    // If user has an existing PAID subscription, we should redirect them to the customer portal
    // to manage their subscription instead of trying to create a new checkout
    if (existingSubscription && existingSubscription.amount > 0) {
      // Redirect to customer portal for subscription changes
      try {
        // Get customer portal URL for existing customer
        const { customerPortalUrl } = await polar.customerSessions.create({
          customerId: existingSubscription.customer_id
        });
        
        return res.status(200).json({ 
          url: customerPortalUrl,
          isPortalRedirect: true,
          message: "Existing paid subscription detected. Redirecting to customer portal." 
        });
      } catch (portalError) {
        console.error("Error creating customer portal session:", portalError);
        
        // Check if the error is specifically about customer not existing
        let isCustomerNotFound = false;
        try {
          const errorBody = portalError.body ? JSON.parse(portalError.body || '{}') : {};
          isCustomerNotFound = errorBody.detail && 
                              Array.isArray(errorBody.detail) && 
                              errorBody.detail.some(d => d.msg && d.msg.includes('does not exist'));
        } catch (parseError) {
          // If we can't parse the error body, check the error message directly
          isCustomerNotFound = portalError.message && portalError.message.includes('does not exist');
        }
        
        if (isCustomerNotFound) {
          // If customer doesn't exist in Polar, we should create a fresh checkout without the customer ID
          // This will create a new customer in Polar for this transaction
          const result = await polar.checkouts.create({
            products: [productId],
            allowDiscountCodes: true,

            // Ad-hoc price definition
            prices: {
              [productId]: [
                {
                  amountType: "fixed",
                  priceAmount: amount, // e.g., 10000 for $100.00
                  priceCurrency: "usd",
                }
              ]
            },
            successUrl: `${process.env.CLIENT_URL}/billing?session_id={CHECKOUT_ID}`,
            customerEmail: user.email,
            externalCustomerId: user._id.toString(), 
            metadata: {
              userId: user._id.toString(),
              formLimit: formLimit?.toString(),
              submissionLimit: submissionLimit?.toString(),
            },
          });

          return res.status(200).json({
            url: result.url,
            isPortalRedirect: false,
            message: "Customer not found in Polar. Created new checkout session."
          });
        } else {
          // For other errors, fall back to normal checkout flow but without subscriptionId
          let customerId = existingSubscription.customer_id;
          
          const result = await polar.checkouts.create({
            products: [productId],
            customerId: customerId || undefined,
            allowDiscountCodes: true,

            // Ad-hoc price definition
            prices: {
              [productId]: [
                {
                  amountType: "fixed",
                  priceAmount: amount, // e.g., 10000 for $100.00
                  priceCurrency: "usd",
                }
              ]
            },
            successUrl: `${process.env.CLIENT_URL}/billing?session_id={CHECKOUT_ID}`,
            customerEmail: user.email,
            externalCustomerId: user._id.toString(), 
            metadata: {
              userId: user._id.toString(),
              formLimit: formLimit?.toString(),
              submissionLimit: submissionLimit?.toString(),
            },
          });

          return res.status(200).json({
            url: result.url,
            isPortalRedirect: false
          });
        }
      }
    }

    // For free subscriptions or no existing subscription, proceed with normal checkout flow
    let subscriptionId = undefined;
    let customerId = existingSubscription?.customer_id;
    
    // Only pass subscriptionId if the existing subscription is truly free
    if (existingSubscription && existingSubscription.amount === 0) {
      subscriptionId = existingSubscription.external_subscription_id;
    }

    // Using polar.checkouts.create as per the latest docs for Ad-hoc pricing
    const result = await polar.checkouts.create({
      products: [productId],
      subscriptionId: subscriptionId, // Only passed for free subscriptions
      customerId: customerId || undefined,
      allowDiscountCodes: true,

      // Ad-hoc price definition
      prices: {
        [productId]: [
          {
            amountType: "fixed",
            priceAmount: amount, // e.g., 10000 for $100.00
            priceCurrency: "usd",
          }
        ]
      },
      successUrl: `${process.env.CLIENT_URL}/billing?session_id={CHECKOUT_ID}`,
      customerEmail: user.email,
      externalCustomerId: user._id.toString(), 
      metadata: {
        userId: user._id.toString(),
        formLimit: formLimit?.toString(),
        submissionLimit: submissionLimit?.toString(),
      },
    });

    res.status(200).json({ url: result.url });
  } catch (error) {
    console.error("Checkout Error:", error);
    
    // Check if it's a validation error from Polar API
    if (error.statusCode === 422 && error.body) {
      try {
        const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
        res.status(422).json({ 
          message: "Validation error occurred", 
          error: errorBody.error || "Polar validation error",
          details: errorBody.detail || null
        });
      } catch (parseError) {
        console.error("Error parsing error body:", parseError);
        res.status(500).json({ message: "Internal server error" });
      }
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const changeSubscription = async (req, res) => {
  console.log("Change Subscription", req.userId);

  try {
    const userId = req.userId;
    const { productId, prorationBehavior } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Find the user's subscription - include canceled ones that haven't expired yet
    const subscription = await Subscription.findOne({
      user_id: userId,
      status: { $in: ["active", "trialing", "cancelled"] },
      subscription_end: { $gt: new Date() } // Still within valid period
    }).sort({ created_at: -1 }); // Get most recent

    if (!subscription) {
      return res.status(400).json({
        message: "No active or valid subscription found",
        hint: "Please create a new subscription from the Plans tab"
      });
    }

    // Check if subscription is canceled
    if (subscription.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot change a canceled subscription",
        detail: "This subscription is canceled or will be at the end of the period. Please create a new subscription instead.",
        hint: "Go to the Plans tab to subscribe to a new plan"
      });
    }

    console.log(
      "Polar subscription ID:",
      subscription.external_subscription_id
    );

    // Use Polar SDK instead of direct axios call
    const updatedSubscription = await polar.subscriptions.update({
      id: subscription.external_subscription_id,
      subscriptionUpdate: {
        productId: productId,
      }
    });

    console.log("✅ Subscription updated successfully:", updatedSubscription.id);

    // Webhook will sync DB
    return res.json({ success: true, subscription: updatedSubscription });
  } catch (err) {
    console.error(
      "Polar subscription change error:",
      err.message || err
    );

    // Parse Polar API error for better messaging
    let errorMessage = "Subscription change failed";
    let errorDetail = err.message;

    if (err.body$) {
      try {
        const errorBody = JSON.parse(err.body$);
        if (errorBody.error === "AlreadyCanceledSubscription") {
          errorMessage = "Cannot change a canceled subscription";
          errorDetail = "This subscription is already canceled. Please create a new subscription from the Plans tab.";
        }
      } catch (parseErr) {
        // Ignore parse errors
      }
    }

    res.status(400).json({
      message: errorMessage,
      detail: errorDetail,
      hint: "If your subscription is canceled, please subscribe to a new plan from the Plans tab"
    });
  }
};

/**
 * Create a simple catalog-based checkout session
 * This uses Polar's product catalog pricing (no ad-hoc pricing)
 * Finds/creates Polar customer by externalId to lock email field
 */
export const createCatalogCheckout = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.userId);

    if (!productId || !user) {
      return res.status(400).json({
        message: 'Missing product ID or user',
        received: { productId, user: !!user }
      });
    }

    console.log(`Creating catalog checkout for user ${user._id} with product ${productId}`);

    // 1. Find or create Polar customer by externalId
    let polarCustomerId = null;
    let verifiedCustomer = null;

    try {
      // Try to find existing customer by externalId (our user._id)
      const existingCustomers = await polar.customers.list({
        externalId: user._id.toString(),
        limit: 1
      });

      // Handle different response formats from Polar SDK
      const items = existingCustomers?.result?.items || existingCustomers?.items || [];

      console.log(`Polar customers.list response for externalId ${user._id}:`, JSON.stringify({
        itemCount: items.length,
        firstItem: items[0] ? { id: items[0].id, email: items[0].email, externalId: items[0].externalId } : null
      }));

      if (items.length > 0) {
        const foundCustomer = items[0];

        // SECURITY: Verify the customer actually belongs to this user
        if (foundCustomer.externalId === user._id.toString()) {
          polarCustomerId = foundCustomer.id;
          verifiedCustomer = foundCustomer;
          console.log(`✅ Verified Polar customer: ${polarCustomerId} (email: ${foundCustomer.email})`);
        } else {
          // Mismatch - don't use this customer
          console.warn(`⚠️ SECURITY: Customer externalId mismatch! Expected: ${user._id}, Got: ${foundCustomer.externalId}`);
        }
      }

      // Create new customer if none found or verification failed
      if (!polarCustomerId) {
        const newCustomer = await polar.customers.create({
          email: user.email,
          name: user.name || user.email,
          externalId: user._id.toString(),
        });
        polarCustomerId = newCustomer.id;
        verifiedCustomer = newCustomer;
        console.log(`✅ Created new Polar customer: ${polarCustomerId} for ${user.email}`);
      }
    } catch (customerError) {
      console.error("Error finding/creating Polar customer:", customerError);
      // Fall back to email-based checkout if customer operations fail
    }

    // 2. Check if THIS USER has active subscriptions - only redirect if verified
    if (polarCustomerId && verifiedCustomer) {
      // Double-check email matches before any portal redirect
      if (verifiedCustomer.email?.toLowerCase() !== user.email?.toLowerCase()) {
        console.warn(`⚠️ SECURITY: Email mismatch! User: ${user.email}, Polar: ${verifiedCustomer.email}`);
        // Don't redirect to portal - proceed to checkout instead
      } else {
        try {
          const polarSubscriptions = await polar.subscriptions.list({
            customerId: polarCustomerId,
            active: true,
            limit: 1
          });

          let hasActiveSubscription = false;
          const subItems = polarSubscriptions?.result?.items || polarSubscriptions?.items || [];

          // Check first page directly
          if (subItems.length > 0) {
            hasActiveSubscription = true;
          } else {
            // Try async iteration if needed
            for await (const page of polarSubscriptions) {
              const pageItems = page?.result?.items || page?.items || [];
              if (pageItems.length > 0) {
                hasActiveSubscription = true;
                break;
              }
            }
          }

          if (hasActiveSubscription) {
            console.log(`✅ User ${user.email} has active subscription, redirecting to portal`);
            const { customerPortalUrl } = await polar.customerSessions.create({
              customerId: polarCustomerId
            });

            return res.status(200).json({
              url: customerPortalUrl,
              isPortalRedirect: true,
              message: "Existing subscription detected. Redirecting to customer portal."
            });
          }
        } catch (subError) {
          console.error("Error checking subscriptions:", subError);
          // Continue to checkout
        }
      }
    }

    // 3. Check for free subscription that can be upgraded
    const freeSubscription = await Subscription.findOne({
      user_id: req.userId,
      status: 'active',
      external_provider: 'polar',
      amount: 0
    });

    // 4. Create checkout with customerId (locks email)
    const checkoutParams = {
      products: [productId],
      allowDiscountCodes: true,
      successUrl: `${process.env.CLIENT_URL}/billing?session_id={CHECKOUT_ID}`,
      metadata: {
        userId: user._id.toString(),
      },
    };

    // SECURITY: Only use customerId if we have a verified customer with matching email
    if (polarCustomerId && verifiedCustomer &&
        verifiedCustomer.email?.toLowerCase() === user.email?.toLowerCase()) {
      checkoutParams.customerId = polarCustomerId;
      console.log(`✅ Using verified customerId: ${polarCustomerId}`);
    } else {
      // Fall back to email-based checkout - safer
      checkoutParams.customerEmail = user.email;
      checkoutParams.externalCustomerId = user._id.toString();
      console.log(`ℹ️ Using email-based checkout for: ${user.email}`);
    }

    // Add subscriptionId for free subscription upgrade
    if (freeSubscription?.external_subscription_id) {
      checkoutParams.subscriptionId = freeSubscription.external_subscription_id;
    }

    console.log("Creating checkout:", {
      customerId: checkoutParams.customerId,
      customerEmail: checkoutParams.customerEmail,
    });

    const result = await polar.checkouts.create(checkoutParams);
    console.log(`Checkout created: ${result.id}`);

    return res.status(200).json({ url: result.url });
  } catch (error) {
    console.error("Catalog Checkout Error:", error);

    if (error.statusCode === 422 && error.body) {
      try {
        const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
        return res.status(422).json({
          message: "Validation error occurred",
          error: errorBody.error || "Polar validation error",
          details: errorBody.detail || null
        });
      } catch (parseError) {
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    return res.status(500).json({
      message: "Failed to create checkout session",
      error: error.message
    });
  }
};
