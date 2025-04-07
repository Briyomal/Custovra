import { PASSWORD_RESET_REQUEST_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, WELCOME_EMAIL_TEMPLATE } from "./emailTemplate.js";
import { transporter, sender } from "./smtp.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
	try {
		const response = await transporter.sendMail({
			from: sender,
			to: email,
			subject: "Verify your email",
			html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
		});
		console.log("Verification email sent:", response.messageId);
	} catch (error) {
		console.error("Error sending verification email:", error);
		throw new Error(`Error sending verification email: ${error}`);
	}
};

export const sendWelcomeEmail = async (email, name) => {

	try {
		const response = await transporter.sendMail({
			from: sender,
			to: email,
			subject: "Welcome to Review Platform",
			html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
		});
		console.log("Welcome email sent:", response.messageId);
	} catch (error) {
		console.error("Error sending welcome email:", error);
		throw new Error(`Error sending welcome email: ${error}`);
	}
};

export const sendPasswordResetEmail = async (email, resetURL) => {
	try {
		const response = await transporter.sendMail({
			from: sender,
			to: email,
			subject: "Reset your password",
			html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
		});
		console.log("Reset email sent:", response.messageId);
	} catch (error) {
		console.error("Error sending reset password email:", error);
		throw new Error(`Error sending reset password email: ${error}`);
	}
};

export const sendResetSuccessEmail = async (email) => {
	try {
		const response = await transporter.sendMail({
			from: sender,
			to: email,
			subject: "Password Reset Success",
			html: PASSWORD_RESET_SUCCESS_TEMPLATE,
		});
		console.log("Reset success email sent:", response.messageId);
	} catch (error) {
		console.error("Error sending reset success email:", error);
		throw new Error(`Error sending reset success email: ${error}`);
	}
};
