import crypto from "crypto";

export const verifyGenieSignature = ({ transactionId, state, signature }) => {
  if (!transactionId || !state || !signature) return false;

  const payload = `${transactionId}|${state}|${process.env.GENIE_SECRET}`;

  const expectedSignature = crypto
    .createHash("sha1") // ⚠️ confirm hash algo from Genie docs
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
};
