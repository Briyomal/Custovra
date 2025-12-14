import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    testGeniePaymentIntegration,
    createGeniePaymentRequest,
    getGeniePaymentHistory,
    handleRedirect,
    toggleAutoRenew
} from "../controllers/genieController.js";


const router = express.Router();
// Setup multer for handling FormData without file storage (we're just parsing fields)
const upload = multer();

// Test endpoint to verify Genie payment integration
router.get("/test", testGeniePaymentIntegration);

// Create a new Genie payment request
router.post("/payment-request", verifyToken, upload.none(), createGeniePaymentRequest);

// Get user's Genie payment history
router.get("/payment-history", verifyToken, getGeniePaymentHistory);

// Toggle auto-renew for subscription
router.post("/toggle-auto-renew", verifyToken, toggleAutoRenew);

// Redirect endpoint for Genie payment completion
router.get("/billing-redirect", handleRedirect);


export default router;