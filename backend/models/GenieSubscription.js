import mongoose from "mongoose";
const Schema = mongoose.Schema;

const genieSubscriptionSchema = new Schema({
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
    billing_period: {
        type: String,
        enum: ['monthly', 'half_yearly', 'yearly'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled', 'pending', 'expired'],
        default: 'pending',
    },
    subscription_start: {
        type: Date,
        required: true,
    },
    subscription_end: {
        type: Date,
        required: true,
    },
    auto_renew: {
        type: Boolean,
        default: false,
    },
    forms_selected: {
        type: [Schema.Types.ObjectId],
        ref: 'Form',
        default: [],
    },
    // Genie-specific fields
    customer_id: {
        type: String, // Genie customer ID
        required: false,
    },
    transaction_id: {
        type: String, // Genie transaction ID
        required: false,
        unique: true,
    },
    card_token: {
        type: String, // Token for recurring payments
        required: false,
    },
    // Expiry reminder tracking
    expiry_reminder_sent: {
        type: Boolean,
        default: false,
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
genieSubscriptionSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const GenieSubscription = mongoose.model("GenieSubscription", genieSubscriptionSchema);