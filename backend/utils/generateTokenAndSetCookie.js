import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	// ✅ Define isProduction before using it
	const isProduction = process.env.NODE_ENV === "production";

	res.cookie("token", token, {
		httpOnly: true,
		//secure: true,
		//secure: process.env.NODE_ENV === "production",
		//sameSite: "strict",
		//sameSite: "none",
		secure: isProduction,               // true only in production
		sameSite: isProduction ? "none" : "strict", // "none" for cross-site prod, "strict" for local testing
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});

	return token;
};
