import mongoose from "mongoose";
const Schema = mongoose.Schema;

const geniePaymentSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    plan_id: {
        type: Schema.Types.ObjectId,
        ref: 'ManualPlan', // Use ManualPlan model as requested
        required: true,
    },
    plan_name: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    payment_method: {
        type: String,
        enum: ['genie_card'], // Only Genie card payments
        default: 'genie_card',
    },
    payment_status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },
    transaction_id: {
        type: String, // Genie transaction ID
        required: false,
    },
    billing_period: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true,
    },
    subscription_start: {
        type: Date,
        required: true,
    },
    subscription_end: {
        type: Date,
        required: true,
    },
    form_selection: {
        type: Schema.Types.Mixed, // Store form selection data for processing after payment confirmation
        required: false,
    },
    // Genie-specific fields
    customer_id: {
        type: String, // Genie customer ID
        required: false,
    },
    payment_url: {
        type: String, // URL to redirect user to complete payment
        required: false,
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
geniePaymentSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const GeniePayment = mongoose.model("GeniePayment", geniePaymentSchema);