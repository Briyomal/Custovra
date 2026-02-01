import mongoose from "mongoose";

const processedWebhookSchema = new mongoose.Schema({
  webhook_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  event_type: {
    type: String,
    required: true,
  },
  processed_at: {
    type: Date,
    default: Date.now,
    expires: 604800, // Auto-delete after 7 days (TTL index)
  },
});

export const ProcessedWebhook = mongoose.model("ProcessedWebhook", processedWebhookSchema);
