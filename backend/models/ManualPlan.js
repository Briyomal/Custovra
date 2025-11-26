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
    // Base monthly price - admin enters this value
    price_monthly: {
        type: Number,
        required: true,
    },
    // Half-yearly price - calculated as monthly_price * 6
    price_half_yearly: {
        type: Number,
        required: true,
    },
    // Yearly price - calculated as monthly_price * 12
    price_yearly: {
        type: Number,
        required: true,
    },
    // Discount percentages for each billing cycle
    discounts: {
        monthly: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        half_yearly: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        yearly: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    // Final prices after applying discounts
    final_prices: {
        monthly: {
            type: Number,
            required: true
        },
        half_yearly: {
            type: Number,
            required: true
        },
        yearly: {
            type: Number,
            required: true
        }
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
    // Default feature toggles
    features: {
        image_upload: {
            type: Boolean,
            default: false
        },
        employee_management: {
            type: Boolean,
            default: false
        },
        // Custom additional features can be added as needed
        custom_features: {
            type: [String], // Array of custom feature names
            default: []
        }
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

// Middleware to auto-calculate prices and apply discounts before validation
manualPlanSchema.pre('validate', function (next) {
    // Calculate base prices
    this.price_half_yearly = this.price_monthly * 6;
    this.price_yearly = this.price_monthly * 12;
    
    // Calculate final prices after applying discounts
    this.final_prices = {
        monthly: this.price_monthly * (1 - (this.discounts.monthly / 100)),
        half_yearly: this.price_half_yearly * (1 - (this.discounts.half_yearly / 100)),
        yearly: this.price_yearly * (1 - (this.discounts.yearly / 100))
    };
    
    next();
});

// Middleware to update `updated_at` before saving
manualPlanSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const ManualPlan = mongoose.model("ManualPlan", manualPlanSchema);