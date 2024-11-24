import mongoose from "mongoose";
const Schema = mongoose.Schema;

const formFieldSchema = new Schema({
    form_id: {
        type: Schema.Types.ObjectId,
        ref: 'Form',
        required: true,
    },
    field_name: {
        type: String,
        required: true,
    },
    field_type: {
        type: String,
        enum: ['text', 'email', 'phone', 'rating', 'textarea'],
        required: true,
    },
    is_required: {
        type: Boolean,
        default: false,
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

export const FormField = mongoose.model("FormField", formFieldSchema);