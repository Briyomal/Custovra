import mongoose from "mongoose";
const Schema = mongoose.Schema;

const manualPlanSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: false,
    },
    price_monthly: {
        type: Number,
        required: true,
    },
    price_yearly: {
        type: Number,
        required: true,
    },
    form_limit: {
        type: Number,
        required: true,
    },
    submission_limit: {
        type: Number,
        required: true,
        default: 1000,
    },
    features: {
        type: [String], // Array of feature descriptions
        required: true,
    },
    is_active: {
        type: Boolean,
        default: true,
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
manualPlanSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const ManualPlan = mongoose.model("ManualPlan", manualPlanSchema);