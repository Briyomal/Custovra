import mongoose from "mongoose";
const Schema = mongoose.Schema;

const responseSchema = new Schema({
    form_id: {
        type: Schema.Types.ObjectId,
        ref: 'Form',
        required: true,
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    fields_data: {
        type: Map,
        of: String, // Map to store field values (keyed by field name)
    },
    employee_id: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: function () { return this.form_type === 'Review'; }
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

export const Response = mongoose.model('Response', responseSchema);