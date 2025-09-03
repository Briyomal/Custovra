import mongoose from "mongoose";
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    employee_number: {
        type: String,
        trim: true,
        sparse: true // Allows multiple null values but unique non-null values
    },
    designation: {
        type: String,
        required: true,
        trim: true
    },
    profile_photo: {
        url: {
            type: String,
            default: ''
        },
        public_id: {
            type: String,
            default: ''
        }
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update the updated_at field on save
employeeSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Create compound index for user_id and employee_number to ensure uniqueness per user
employeeSchema.index({ user_id: 1, employee_number: 1 }, { unique: true, sparse: true });

export const Employee = mongoose.model('Employee', employeeSchema);