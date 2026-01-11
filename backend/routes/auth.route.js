import express from "express";
import { login, signup, logout, verifyEmail, forgotPassword, resetPassword, checkAuth, adminUser, cusUser, verify2FALogin, authLimiter } from "../controllers/auth.controller.js";
import { verifyToken, adminRoute } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);
router.get("/admin-dashboard", verifyToken, adminRoute, adminUser); // Fixed duplicate verifyToken
router.get("/dashboard", verifyToken, cusUser);

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/verify-2fa", verify2FALogin); // New 2FA verification endpoint

router.post("/verify-email", verifyEmail);
router.post("/forgot-password", authLimiter, forgotPassword);

router.post("/reset-password/:token", authLimiter, resetPassword);

export default router;