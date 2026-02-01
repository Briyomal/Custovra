import mongoose from "mongoose";
const Schema = mongoose.Schema;

const meterEventSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event_name: {
        type: String,
        enum: ['form_created', 'submission_created', 'pack_purchased'],
        required: true,
    },
    meter_type: {
        type: String,
        enum: ['forms', 'submissions'],
        required: true,
    },
    quantity: {
        type: Number,
        default: 1,
    },
    polar_event_id: {
        type: String, // If we get a response from Polar
        required: false,
    },
    metadata: {
        type: Object,
        default: {},
    },
    ingestion_status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending',
    },
    error_message: {
        type: String,
        required: false,
    },
    sent_at: {
        type: Date,
        required: false,
    }
}, { timestamps: true });

meterEventSchema.index({ user_id: 1, event_name: 1 });
meterEventSchema.index({ ingestion_status: 1 });

export const MeterEvent = mongoose.model("MeterEvent", meterEventSchema);
