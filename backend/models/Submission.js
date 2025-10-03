import mongoose from "mongoose";
const Schema = mongoose.Schema;

const submissionSchema = new Schema(
    {
        form_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Form",
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Allow null for public form submissions
            default: null,
        },
        submissions: {
            type: Map,
            of: String,
            required: true,
        },
        is_read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Submission = mongoose.model('Submission', submissionSchema);