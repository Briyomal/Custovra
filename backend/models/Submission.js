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

// Add indexes for better query performance
submissionSchema.index({ form_id: 1 });
submissionSchema.index({ is_read: 1 });
submissionSchema.index({ form_id: 1, is_read: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);