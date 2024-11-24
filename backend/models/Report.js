
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    form_id: {
        type: Schema.Types.ObjectId,
        ref: 'Form',
        required: true,
    },
    total_responses: {
        type: Number,
        default: 0,
    },
    average_rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    feedback_summary: {
        type: String,
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
reportSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const Report = mongoose.model('Report', reportSchema); 