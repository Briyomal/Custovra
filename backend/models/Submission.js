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
            required: true,
        },
        submissions: {
            type: Map,
            of: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const Submission = mongoose.model('Submission', submissionSchema);