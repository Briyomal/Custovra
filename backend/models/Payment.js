
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const paymentSchema = new Schema({

  // 🧾 Genie IDs (can change / appear later)
  transaction_id: {
    type: String,
    index: true
  },

  customer_id: {
    type: String,
    index: true
  },

  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  subscription_id: {
    type: String,
    required: true,
  },

  plan: {
    type: String,
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  payment_date: {
    type: Date,
    default: Date.now,
  },

  subscription_expiry: { 
    type: Date, 
    required: true,
  },

  form_selection: {
    type: Schema.Types.Mixed,
  },

  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
    default: "PENDING"
  },

  created_at: {
    type: Date,
    default: Date.now,
  },

  updated_at: {
    type: Date,
    default: Date.now,
  }
});


// Middleware to update `updated_at` before saving
paymentSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const Payment = mongoose.model("Payment", paymentSchema);