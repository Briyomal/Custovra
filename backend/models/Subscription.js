import mongoose from "mongoose";
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // External provider fields
    external_provider: {
        type: String,
        enum: ['polar', 'genie'], // Add other providers as needed
        required: true,
        default: 'polar'
    },
    external_plan_id: {
        type: String, // Polar uses UUIDs, not ObjectIds
        required: false, // Not required initially
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
        enum: ['active', 'inactive', 'cancelled', 'pending', 'expired', 'past_due'],
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
    // Polar-specific fields
    external_subscription_id: {
        type: String, // Polar subscription ID
        required: false,
    },
    last_payment_id: {
        type: Schema.Types.ObjectId,
        ref: 'PolarPayment',
        required: false,
    },
    // Subscription history
    renewal_history: [{
        payment_id: {
            type: Schema.Types.ObjectId,
            ref: 'PolarPayment',
        },
        renewed_at: Date,
    }],
    previous_plan_id: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        required: false,
    },
    upgrade_reason: {
        type: String,
        required: false,
    },
    cancelled_at: {
        type: Date,
        required: false,
    },
    grace_period_ends_at: {
        type: Date,
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
subscriptionSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);