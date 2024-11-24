import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		role: {
			type: String,
            enum: ["customer", "admin"],
            default: "customer",
		},

        subscription_plan: {
            type: String,
		},
		is_active: {
			type: Boolean,
			default: false,
		},
		stripeCustomerId: { 
			type: String, 
			required: true,
		},
		lastLogin: {
			type: Date,
			default: Date.now,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		resetPasswordToken: String,
		resetPasswordExpiresAt: Date,
		verificationToken: String,
		verificationTokenExpiresAt: Date,
		verificationRequestCount: {
			type: Number,
			default: 0,
		},
		verificationRequestTimestamp: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

export const User = mongoose.model("User", userSchema);
