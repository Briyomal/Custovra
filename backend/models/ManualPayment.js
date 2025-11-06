import mongoose from "mongoose";
const Schema = mongoose.Schema;

const manualPaymentSchema = new Schema({
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
    amount: {
        type: Number,
        required: true,
    },
    payment_method: {
        type: String,
        enum: ['bank_transfer', 'cash', 'other'],
        default: 'bank_transfer',
    },
    payment_proof: {
        type: String, // URL to uploaded payment proof
        required: false,
    },
    payment_status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    admin_notes: {
        type: String,
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
        type: Schema.Types.Mixed, // Store form selection data for processing after payment approval
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
manualPaymentSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const ManualPayment = mongoose.model("ManualPayment", manualPaymentSchema);