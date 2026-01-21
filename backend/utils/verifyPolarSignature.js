import crypto from "crypto";

/**
 * Verifies Polar webhook signatures according to their specification
 * @param {Object} req - Express request object containing headers and body
 * @returns {boolean} - True if signature is valid, false otherwise
 */
export const verifyPolarSignature = (req) => {
  try {
    // Extract required webhook headers
    const webhookId = req.headers['webhook-id'];
    const webhookTimestamp = req.headers['webhook-timestamp'];
    const webhookSignature = req.headers['webhook-signature'];
    
    // Check if all required headers are present
    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error("❌ Missing required webhook headers");
      return false;
    }
    
    // Parse signature (format: "v1,base64signature")
    const [version, signature] = webhookSignature.split(',');
    if (version !== 'v1') {
      console.error(`❌ Unsupported signature version: ${version}`);
      return false;
    }
    
    // Get the webhook secret from environment variables
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (!secret) {
      console.error("❌ POLAR_WEBHOOK_SECRET not configured");
      return false;
    }
    
    // Create the payload string to sign according to Polar's specification
    const payload = `${webhookId}.${webhookTimestamp}.${req.body.toString()}`;
    
    // Generate HMAC signature using SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');
    
    // Compare signatures using timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'base64');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64');
    
    // Check if buffers have the same length and content
    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("❌ Signature length mismatch");
      return false;
    }
    
    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    
    if (!isValid) {
      console.error("❌ Invalid webhook signature");
    } else {
      console.log("✅ Webhook signature validated successfully");
    }
    
    return isValid;
    
  } catch (error) {
    console.error("❌ Error verifying Polar signature:", error.message);
    return false;
  }
};

/**
 * Extracts and parses the webhook payload
 * @param {Object} req - Express request object
 * @returns {Object|null} - Parsed payload or null if invalid
 */
export const parseWebhookPayload = (req) => {
  try {
    if (!req.body) {
      console.error("❌ No request body found");
      return null;
    }
    
    const payloadString = req.body.toString();
    const payload = JSON.parse(payloadString);
    
    return payload;
  } catch (error) {
    console.error("❌ Error parsing webhook payload:", error.message);
    return null;
  }
};