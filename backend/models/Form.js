import mongoose from "mongoose";
const Schema = mongoose.Schema;

const formSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    form_name: {
        type: String,
        required: true,
    },
    form_description: {
        type: String,
    },
    form_type: {
        type: String,
        enum: ['Review', 'Complaint'],
        required: true,
    },
    fields: [{
        type: Schema.Types.ObjectId,
        ref: 'FormField',
    }],
    employees: [{
        type: Schema.Types.ObjectId,
        ref: 'Employee',
    }],
    qr_code: {
        type: String, // URL or base64 data for QR code
    },
    is_active: {
        type: Boolean,
        default: false,
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
formSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export const Form = mongoose.model("Form", formSchema);