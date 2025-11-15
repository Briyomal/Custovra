import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    testGeniePaymentIntegration,
    createGeniePaymentRequest,
    getGeniePaymentHistory,
    handleGeniePaymentWebhook,
    handleRedirect,
    //handlePaymentSuccessCallback,
    //handlePaymentCancelCallback
} from "../controllers/genieController.js";


const router = express.Router();
// Setup multer for handling FormData without file storage (we're just parsing fields)
const upload = multer();

// Test endpoint to verify Genie payment integration
router.get("/test", testGeniePaymentIntegration);

// Create a new Genie payment request
//router.post("/payment-request", verifyToken, upload.none(), createGeniePaymentRequest);
router.post("/payment-request", verifyToken, upload.none(), createGeniePaymentRequest);

// Get user's Genie payment history
router.get("/payment-history", getGeniePaymentHistory);
// Get user's pending Genie payment

// Webhook endpoint for Genie payment notifications
router.post("/webhook", handleGeniePaymentWebhook);

// Payment success and cancel callback endpoints
//router.get("/payment-success", handlePaymentSuccessCallback);
//router.get("/payment-cancel", handlePaymentCancelCallback);

router.get("/billing-redirect", handleRedirect);


export default router;