import mongoose from "mongoose";
const Schema = mongoose.Schema;

const defaultFieldSchema = new Schema({
    field_name: {
        type: String,
        enum: ['name', 'email', 'phone', 'rating', 'comment', 'image'], // Added 'image' as a default field
        required: true,
    },
    field_type: {
        type: String,
        enum: ['text', 'email', 'tel', 'rating', 'textarea', 'employee', 'image'], // Added 'image' as a field type
        required: true,
    },
    is_required: {
        type: Boolean,
        default: false,
    },
    placeholder: {
        type: String,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    position: {
        type: Number, // Position of the field for drag-and-drop
        required: true,
    },
    employees: [{
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    }], // For employee dropdown fields
    hasEmployeeRating: {
        type: Boolean,
        default: false,
    }, // For employee rating toggle
});

const customFieldSchema = new Schema({
    field_name: {
        type: String,
        required: true,
    },
    field_type: {
        type: String,
        enum: ['text', 'email', 'tel', 'number', 'rating', 'textarea', 'employee', 'image'], // Added 'image' as a field type
        required: true,
    },
    is_required: {
        type: Boolean,
        default: false,
    },
    placeholder: {
        type: String,
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
    hasEmployeeRating: {
        type: Boolean,
        default: false,
    }, // For employee rating toggle
});

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
    form_note: {
        type: String,
    },
    logo: {
        type: String,
    },
    form_description: {
        type: String,
    },
    form_type: {
        type: String,
        enum: ['Review', 'Complaint'],
        required: true,
    },
    // Default fields with position
    default_fields: [defaultFieldSchema],
    // Custom fields with position
    custom_fields: [customFieldSchema],
    employees: [{
        type: Schema.Types.ObjectId,
        ref: 'Employee',
    }],
    qr_code: {
        type: String, // URL or base64 data for QR code
    },
    form_link: {
        type: String,
    },
    google_link: {
        type: String,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export const Form = mongoose.model('Form', formSchema);