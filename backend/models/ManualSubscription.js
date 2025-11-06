import mongoose from "mongoose";
const Schema = mongoose.Schema;

const manualSubscriptionSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    plan_id: {
        type: Schema.Types.ObjectId,
        ref: 'ManualPlan',
        required: true,
    },
    plan_name: {
        type: String,
        required: true,
    },
    billing_period: {
        type: String,
        enum: ['monthly', 'yearly'],
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
manualSubscriptionSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const ManualSubscription = mongoose.model("ManualSubscription", manualSubscriptionSchema);