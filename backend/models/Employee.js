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
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

export const Employee = mongoose.model('Employee', employeeSchema);