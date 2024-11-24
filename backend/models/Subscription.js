import mongoose from "mongoose";
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
    plan_name: {
        type: String,
        required: true,
        enum: ['Basic', 'Standard', 'Premium'],
    },
    form_limit: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    features: {
        type: Map,
        of: String, // Use a map to store plan-specific features
    },
    stripeSubscriptionId: { 
        type: String, 
        required: true 
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