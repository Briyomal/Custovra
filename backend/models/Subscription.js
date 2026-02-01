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
        enum: ['active', 'inactive', 'cancelled', 'canceled', 'pending', 'expired', 'past_due'], // Both spellings for Polar compatibility
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
        // Removed unique: true - causes issues with Polar subscriptions that don't have this field
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
    cancel_at_period_end: {
        type: Boolean,
        default: false,
    },
    grace_period_ends_at: {
        type: Date,
        required: false,
    },
    // Plan Limits & Features (mirrors ManualPlan)
    form_limit: {
        type: Number,
        default: 0,
    },
    submission_limit: {
        type: Number,
        default: 0,
    },
    features: {
        image_upload: {
            type: Boolean,
            default: false
        },
        employee_management: {
            type: Boolean,
            default: false
        }
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    // Metered billing fields
    purchased_submission_packs: {
        type: Number,
        default: 0,
        min: 0,
    },
    meter_usage_current_cycle: {
        forms_overage: {
            type: Number,
            default: 0,
        },
        submissions_used: {
            type: Number,
            default: 0,
        },
        last_reset_date: {
            type: Date,
            default: null,
        }
    },
    last_meter_report: {
        forms_reported_at: {
            type: Date,
            required: false,
        },
        submissions_reported_at: {
            type: Date,
            required: false,
        },
    },
});

// Middleware to update `updated_at` before saving
subscriptionSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);