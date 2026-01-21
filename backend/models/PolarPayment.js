import mongoose from "mongoose";

const polarPaymentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    provider: { type: String, default: "polar" },

    event_type: String,

    checkout_id: String,
    order_id: String,
    subscription_id: String,

    plan_id: String,
    plan_name: String,
    billing_period: String,

    amount: Number,
    currency: String,

    status: String,

    customer_id: String,
    transaction_id: String,

    subscription_start: Date,
    subscription_end: Date,

    form_selection: Object,

    raw_payload: Object, // full Polar payload (for audits)
  },
  { timestamps: true }
);

polarPaymentSchema.index({ order_id: 1 }, { unique: true, sparse: true });

export const PolarPayment = mongoose.model("PolarPayment", polarPaymentSchema);
