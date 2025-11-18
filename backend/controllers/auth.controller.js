import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { authenticator } from 'otplib';
import mongoose from "mongoose";

import {
	generateTokenAndSetCookie
} from "../utils/generateTokenAndSetCookie.js";
import {
	sendVerificationEmail,
	sendWelcomeEmail,
	sendPasswordResetEmail,
	sendResetSuccessEmail
} from "../email/emails.js";
import {
	User
} from "../models/User.js";
import { ManualSubscription } from "../models/ManualSubscription.js";

export const signup = async (req, res) => {
	try {
		const { email, password, name, company, phone } = req.body;

		// 1. Check if user already exists
		let user = await User.findOne({ email });
		if (user) {
			return res.status(400).json({ success: false, message: "User already exists" });
		}

		// 2. Hash the password
		const hashedPassword = await bcryptjs.hash(password, 10);

		// 3. Create user without stripeCustomerId
		user = new User({
			email,
			password: hashedPassword,
			name,
			company,
			phone,
			// Removed stripeCustomerId since we're not using Stripe
		});

		await user.save();

		// 4. Generate JWT token and set cookie
		generateTokenAndSetCookie(res, user._id);

		// 5. Send success response
		res.status(201).json({
			success: true,
			message: "User created successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.error("Error in signup controller:", error.message);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const verifyEmail = async (req, res) => {
	const {
		code
	} = req.body;
	try {
		const user = await User.findOne({
			verificationToken: code,
			verificationTokenExpiresAt: {
				$gt: Date.now()
			},
		});
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired verification code"
			});
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpiresAt = undefined;
		await user.save();

		await sendWelcomeEmail(user.email, user.name);
		res.status(200).json({
			success: true,
			message: "Email verified successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("error in verifyEmail", error);
		res.status(500).json({
			success: false,
			message: "Server error"
		});
	}
};

export const login = async (req, res) => {
	const {
		email,
		password
	} = req.body;
	try {
		const user = await User.findOne({
			email
		});
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid credentials"
			});
		}
		const isPasswordValid = await bcryptjs.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({
				success: false,
				message: "Invalid credentials"
			});
		}

		// Check if 2FA is enabled for the user
		if (user.twoFactorEnabled) {
			// Instead of logging in directly, we'll indicate that 2FA is required
			return res.status(200).json({
				success: true,
				message: "2FA required",
				twoFactorRequired: true,
				userId: user._id
			});
		}

		// Check if user is verified (existing logic)
		if (!user.isVerified) {
			const currentTime = Date.now();
			const twentyFourHours = 24 * 60 * 60 * 1000;

			// Reset count if last request was over 24 hours ago
			if (currentTime - user.verificationRequestTimestamp >= twentyFourHours) {
				user.verificationRequestCount = 0;
				user.verificationRequestTimestamp = currentTime;
			}

			// Check if the user has exceeded the verification email limit
			if (user.verificationRequestCount >= 3) {
				return res.status(429).json({
					success: false,
					message: "Verification email limit reached. Please try again after 24 hours.",
				});
			}

			// Update count and timestamp
			user.verificationRequestCount += 1;
			user.verificationRequestTimestamp = currentTime;

			// Generate a new verification token
			const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
			user.verificationToken = verificationToken;
			user.verificationTokenExpiresAt = Date.now() + twentyFourHours;
			await user.save();

			// Send verification email
			await sendVerificationEmail(user.email, verificationToken);

			return res.status(403).json({
				success: false,
				message: "Email not verified. A new verification email has been sent.",
				isVerified: false,
				userId: user._id,
			});
		}

		generateTokenAndSetCookie(res, user._id);

		user.lastLogin = new Date();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user._doc,
				password: undefined,
				payment: null,
			},
		});
	} catch (error) {
		console.log("Error in login", error);
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

// New function to verify 2FA token during login
export const verify2FALogin = async (req, res) => {
	const { userId, token } = req.body;
	
	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "User not found"
			});
		}

		if (!user.twoFactorEnabled || !user.twoFactorSecret) {
			return res.status(400).json({
				success: false,
				message: "2FA is not enabled for this user"
			});
		}

		// Verify the token
		const isValid = authenticator.check(token, user.twoFactorSecret);

		if (!isValid) {
			return res.status(400).json({
				success: false,
				message: "Invalid 2FA token"
			});
		}

		// 2FA is valid, proceed with login
		generateTokenAndSetCookie(res, user._id);

		user.lastLogin = new Date();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user._doc,
				password: undefined,
				payment: null,
			},
		});
	} catch (error) {
		console.log("Error in verify2FALogin", error);
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const logout = async (req, res) => {
	const isProduction = process.env.NODE_ENV === "production";

	res.clearCookie("token", {
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? "none" : "none",
	});

	res.status(200).json({
		success: true,
		message: "Logged out successfully",
	});
};

export const forgotPassword = async (req, res) => {
	const {
		email
	} = req.body;
	try {
		const user = await User.findOne({
			email
		});
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "User doesn't exists"
			});
		}
		//Generate reset token
		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
		//set the token in the database
		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		await user.save();

		//Send email to the user
		await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);
		res.status(200).json({
			success: true,
			message: "Password reset link sent to your email",
		});
	} catch (error) {
		console.log("Error in forgotPassword", error);
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const resetPassword = async (req, res) => {
	try {
		const {
			token
		} = req.params;
		const {
			password
		} = req.body;

		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpiresAt: {
				$gt: Date.now()
			},
		});
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired reset token"
			});
		}

		//update password
		const hashedPassword = await bcryptjs.hash(password, 10);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiresAt = undefined;
		await user.save();

		await sendResetSuccessEmail(user.email);

		res.status(200).json({
			success: true,
			message: "Password reset successfully",
		});
	} catch (error) {
		console.log("Error in resetPassword", error);
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.userId).populate('subscription_plan_id');
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "User not found"
			});
		}

		// Get user's manual subscription
		const manualSubscription = await ManualSubscription.findOne({ 
			user_id: req.userId,
			status: 'active'
		}).populate('plan_id');

		res.status(200).json({
			success: true,
			user: {
				...user._doc,
				password: undefined, // Exclude sensitive information
				subscription: manualSubscription || null,
			},
		});
	} catch (error) {
		console.error("Error in checkAuth", error);
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const adminUser = async (req, res) => {
	return res.status(200).json({
		success: true,
		message: "Admin Logged in"
	});
};

export const cusUser = async (req, res) => {
	return res.status(200).json({
		success: true,
		message: "Customer Logged in"
	});
};