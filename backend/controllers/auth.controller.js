import bcryptjs from "bcryptjs";
import crypto from "crypto";

import {
	generateTokenAndSetCookie
} from "../utils/generateTokenAndSetCookie.js";
import {
	sendVerificationEmail,
	sendWelcomeEmail,
	sendPasswordResetEmail,
	sendResetSuccessEmail
} from "../mailtrap/emails.js";
import {
	User
} from "../models/User.js";
import {
	Payment
} from "../models/Payment.js";
import {
	stripe
} from "../utils/stripe.js";
import mongoose from "mongoose";
import axios from "axios";

export const signup = async (req, res) => {
	const {
		email,
		password,
		name,
		captchaToken
	} = req.body;
	try {
		// Validate captcha token
		if (!captchaToken) {
			return res.status(400).json({
				message: "Captcha verification failed"
			});
		}

		const captchaResponse = await axios.post(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			new URLSearchParams({
				secret: process.env.TURNSTILE_SECRET_KEY, // Use secret key from environment
				response: captchaToken,
			}), {
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				}
			}
		);

		// If CAPTCHA verification fails
		if (!captchaResponse.data.success) {
			return res.status(400).json({
				success: false,
				message: "Invalid captcha",
				errors: captchaResponse.data["error-codes"]
			});
		}

		if (!email || !password || !name) {
			throw new Error("All fields are required");
		}
		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: "Invalid email format"
			});
		}

		// Validate password strength (at least 6 characters)
		if (password.length < 6) {
			return res.status(400).json({
				success: false,
				message: "Password must be at least 6 characters long"
			});
		}
		const userAlreadyExists = await User.findOne({
			email
		});
		if (userAlreadyExists) {
			return res.status(400).json({
				success: false,
				message: "User already exists"
			});
		}


		const hashedPassword = await bcryptjs.hash(password, 10);
		const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

		const customer = await stripe.customers.create({
			email
		}, {
			apiKey: process.env.STRIPE_SECRET_KEY,
		})

		const user = new User({
			email,
			password: hashedPassword,
			name,
			stripeCustomerId: customer.id,
			verificationToken,
			verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
		});

		await user.save();

		//jwt
		generateTokenAndSetCookie(res, user._id);

		await sendVerificationEmail(user.email, verificationToken);

		res.status(201).json({
			success: true,
			message: "User created successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message
		});
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

		const payment = await Payment.findOne({
			user_id: new mongoose.Types.ObjectId(user._id)
		});

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
				payment,
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


export const logout = async (req, res) => {
	const isProduction = process.env.NODE_ENV === "production";

	res.clearCookie("token", {
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? "none" : "strict",
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
		const user = await User.findById(req.userId).populate('subscription_plan');
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "User not found"
			});
		}

		// Check if subscription is active or expired
		if (user.subscription_expiry && new Date() > new Date(user.subscription_expiry)) {
			user.is_active = false;
			await user.save();
		}

		const payment = await Payment.findOne({
			user_id: new mongoose.Types.ObjectId(user._id)
		});

		res.status(200).json({
			success: true,
			user: {
				...user._doc,
				password: undefined, // Exclude sensitive information
				payment,
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