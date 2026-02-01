// controllers/polarWebhook.controller.js
import { verifyPolarSignature, parseWebhookPayload } from "../utils/verifyPolarSignature.js";
import { ProcessedWebhook } from "../models/ProcessedWebhook.js";
import {
  handleCheckoutCreated,
  handleOrderPaid,
  handleSubscriptionActive,
  handleSubscriptionCancelled,
  handleSubscriptionUpdated,
  handleSubscriptionRevoked,
  handleOrderRefunded,
  handlePaymentFailed
} from "./polarController.js";

// Debug middleware to log headers
export const debugHeaders = (req, res, next) => {
  console.log("=== Polar Webhook Headers ===");
  console.log("webhook-id:", req.headers['webhook-id']);
  console.log("webhook-timestamp:", req.headers['webhook-timestamp']);
  console.log("webhook-signature:", req.headers['webhook-signature']);
  console.log("Content-Type:", req.headers['content-type']);
  console.log("Raw body length:", req.body?.length || 0);
  console.log("============================");
  next();
};

// Webhook handler using the utility functions
export const polarWebhook = async (req, res) => {
  try {
    // Log headers for debugging
    debugHeaders(req, res, () => {});
    console.log("=== Polar Webhook Request ===");
    console.log("Request body:", req.body);
    
    // Check if body is empty before proceeding
    let bodyIsEmpty = false;
    if (!req.body) {
      bodyIsEmpty = true;
    } else if (typeof req.body === 'object' && Object.keys(req.body).length === 0) {
      bodyIsEmpty = true;
    } else if (Buffer.isBuffer(req.body) && req.body.length === 0) {
      bodyIsEmpty = true;
    } else if (typeof req.body === 'string' && req.body.trim() === '') {
      bodyIsEmpty = true;
    }
    
    if (bodyIsEmpty) {
      console.log("⚠️  Webhook received with empty body");
      // In development mode, we might want to return early
      if (process.env.POLAR_WEBHOOK_DEV_MODE === 'true') {
        console.log("✅ Development mode: Responding to empty webhook request");
        return res.status(200).json({ received: true, message: "Received (dev mode)" });
      }
      // For production, empty body is usually invalid
      return res.status(400).send("Webhook body is empty");
    }
    
    // Verify the webhook signature
    if (!verifyPolarSignature(req)) {
      return res.status(401).send("Invalid webhook signature");
    }
    
    // Parse the webhook payload
    const payload = parseWebhookPayload(req);
    if (!payload) {
      return res.status(400).send("Invalid payload");
    }

    const { type, data } = payload;

    // ⚠️ IDEMPOTENCY CHECK - Prevent duplicate processing
    const webhookId = req.headers['webhook-id'];
    if (webhookId) {
      // Check if we've already processed this webhook
      const alreadyProcessed = await ProcessedWebhook.findOne({ webhook_id: webhookId });
      if (alreadyProcessed) {
        console.log(`⚠️ DUPLICATE WEBHOOK DETECTED - Already processed: ${webhookId} (${type}) at ${alreadyProcessed.processed_at}`);
        console.log(`   This indicates Polar sent the same webhook multiple times. Ignoring duplicate.`);
        return res.status(200).json({ received: true, message: "Already processed" });
      }

      // Mark as processed immediately to prevent race conditions
      try {
        await ProcessedWebhook.create({
          webhook_id: webhookId,
          event_type: type,
        });
      } catch (err) {
        // If unique constraint fails, another process already handled it
        if (err.code === 11000) {
          console.log(`⚠️ Webhook already processed (race condition): ${webhookId} (${type})`);
          return res.status(200).json({ received: true, message: "Already processed" });
        }
        throw err;
      }
    } else {
      console.warn("⚠️ Warning: No webhook-id header found. Duplicate detection disabled for this event.");
    }

    console.log("✅ Processing Polar Event:", type, webhookId ? `(ID: ${webhookId})` : "(No ID)");

    // Handle the event based on type
    switch (type) {
      case "checkout.created":
        await handleCheckoutCreated(data);
        break;
      case "order.paid":
        await handleOrderPaid(data);
        break;
      case "subscription.created":
      case "subscription.active":
        await handleSubscriptionActive(data);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(data);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(data);
        break;
      case "subscription.revoked":
        await handleSubscriptionRevoked(data);
        break;
      case "order.refunded":
        await handleOrderRefunded(data);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(data);
        break;
      case "customer.state_changed":
      case "customer.created":
      case "customer.updated":
        // Informational events - no action needed
        // Customer data is fetched in real-time via API when needed
        console.log(`ℹ️ Customer event received: ${type} (no action needed)`);
        break;
      case "checkout.updated":
        // Checkout updated is informational - the important events are order.paid and subscription.active
        console.log("ℹ️ Checkout updated event received (no action needed)");
        break;
      case "order.created":
      case "order.updated":
        // Order events are informational - order.paid handles the important logic
        console.log(`ℹ️ Order event received: ${type} (no action needed)`);
        break;
      case "benefit_grant.created":
      case "benefit_grant.updated":
      case "benefit_grant.revoked":
        // Benefit grant events - could be used to track feature access
        console.log(`ℹ️ Benefit grant event received: ${type} (no action needed)`);
        break;
      default:
        console.log("⚠️ Unhandled Polar event:", type);
    }
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error("❌ Polar webhook processing error:", error);
    if (!res.headersSent) {
      res.status(500).send("Webhook processing failed");
    }
  }
};