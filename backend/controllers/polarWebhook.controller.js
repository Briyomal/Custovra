// controllers/polarWebhook.controller.js
import { verifyPolarSignature, parseWebhookPayload } from "../utils/verifyPolarSignature.js";
import { 
  handleCheckoutCreated, 
  handleOrderPaid, 
  handleSubscriptionActive, 
  handleSubscriptionCancelled, 
  handleOrderRefunded, 
  handlePaymentFailed 
} from "./polarController.js";

// Debug middleware to log headers
export const debugHeaders = (req, res, next) => {
  console.log("=== Polar Webhook Headers ===");
  console.log("All headers:", req.headers);
  console.log("polar-signature:", req.headers['polar-signature']);
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
    console.log("✅ Processing Polar Event:", type);
    
    // Handle the event based on type
    switch (type) {
      case "checkout.created":
        await handleCheckoutCreated(data);
        break;
      case "order.paid":
        await handleOrderPaid(data);
        break;
      case "subscription.active":
        await handleSubscriptionActive(data);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(data);
        break;
      case "order.refunded":
        await handleOrderRefunded(data);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(data);
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