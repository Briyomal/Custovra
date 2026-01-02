import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "RECURRING_PAYMENT_SUCCESS",
        "RECURRING_PAYMENT_FAILED",
        "TOGGLE_AUTO_RENEW",
        "SUBSCRIPTION_UPGRADE",
        "SUBSCRIPTION_CANCELLED",
        "PAYMENT_MANUAL_INTERVENTION",
        "GENIE_WEBHOOK_RECEIVED"
      ],
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // e.g., payment or subscription ID
    },
    amount: {
      type: Number,
      required: false, // For payments
    },
    new_value: {
      type: mongoose.Schema.Types.Mixed,
      required: false, // For toggles or state changes
    },
    ip: {
      type: String,
      required: false,
    },
    user_agent: {
      type: String,
      required: false,
    },
    metadata: {
      type: Object,
      required: false,
      default: {},
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
