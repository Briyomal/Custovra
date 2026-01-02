import crypto from "crypto";

export const verifyGenieWebhookSignature = (rawBody, signature) => {
  if (!rawBody || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.GENIE_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  // Prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
