import nodemailer from "nodemailer";

import dotenv from "dotenv";

dotenv.config();

// Replace these with your actual SMTP server details
export const transporter = nodemailer.createTransport({
	host: "ax.email", // e.g., mail.yourdomain.com
	port: 465, // or 587 depending on your server
	secure: true, // true for port 465, false for 587
	auth: {
		user: "webforms@alphaclick.biz",
		pass: "4Jj1]|2[",
	},
});

export const sender = `"Review Platform" <webforms@alphaclick.biz>`;