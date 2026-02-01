import crypto from "crypto";

/**
 * Verifies Polar webhook signatures according to their specification
 * @param {Object} req - Express request object containing headers and body
 * @returns {boolean} - True if signature is valid, false otherwise
 */
export const verifyPolarSignature = (req) => {
  try {
    // Development mode: Skip signature verification for local testing
    // IMPORTANT: Only use in development! Remove or set to false in production
    const isDevelopment = process.env.POLAR_WEBHOOK_DEV_MODE === 'true';

    if (isDevelopment) {
      console.warn("⚠️  DEVELOPMENT MODE: Skipping webhook signature verification");
      console.warn("⚠️  This should NEVER be enabled in production!");
      return true;
    }

    // Extract required webhook headers
    const webhookId = req.headers['webhook-id'];
    const webhookTimestamp = req.headers['webhook-timestamp'];
    const webhookSignature = req.headers['webhook-signature'];

    // Check if all required headers are present
    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error("❌ Missing required webhook headers");
      console.error("💡 Tip: For local testing, set POLAR_WEBHOOK_DEV_MODE=true in .env");
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
    let bodyString;
    if (typeof req.body === 'string') {
      bodyString = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      bodyString = req.body.toString();
    } else if (typeof req.body === 'object') {
      // Convert object to string, but handle empty objects
      bodyString = Object.keys(req.body).length === 0 ? '' : JSON.stringify(req.body);
    } else {
      bodyString = String(req.body);
    }
    const payload = `${webhookId}.${webhookTimestamp}.${bodyString}`;
    
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
    
    // Handle different types of body content
    let payloadString;
    
    if (typeof req.body === 'string') {
      payloadString = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      payloadString = req.body.toString();
    } else if (typeof req.body === 'object') {
      // If body is already parsed as object (which shouldn't happen with raw parser)
      // but if it is, check if it's empty
      if (Object.keys(req.body).length === 0) {
        console.error("❌ Request body is empty");
        return null;
      }
      // Check if the body is actually an empty object disguised as a string
      const bodyAsJsonString = JSON.stringify(req.body);
      if (bodyAsJsonString === '{}') {
        console.error("❌ Request body is empty");
        return null;
      }
      payloadString = bodyAsJsonString;
    } else {
      payloadString = String(req.body);
    }
    
    // Check if payload string is empty
    if (!payloadString || payloadString.trim() === '') {
      console.error("❌ Request body is empty or contains no content");
      return null;
    }
    
    const payload = JSON.parse(payloadString);
    
    return payload;
  } catch (error) {
    console.error("❌ Error parsing webhook payload:", error.message);
    return null;
  }
};