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
        enum: ['text', 'email', 'phone', 'rating', 'textarea', 'employee'],
        required: true,
    },
    placeholder: {
        type: String,
    },
    is_required: {
        type: Boolean,
        default: false,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    position: {
        type: Number, // Position of the field for drag-and-drop
        required: true,
    },
    is_new: {
        type: Boolean,
        default: false,
    },
    employees: [{
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    }], // For employee dropdown fields
    created_at: {
        type: Date,
        default: Date.now,
    }
});

export const FormField = mongoose.model("FormField", formFieldSchema);