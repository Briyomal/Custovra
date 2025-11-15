import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    testGeniePaymentIntegration,
    createGeniePaymentRequest,
    getGeniePaymentHistory,
    handleGeniePaymentWebhook,
    //handlePaymentSuccessCallback,
    //handlePaymentCancelCallback
} from "../controllers/geniePayment.controller.js";

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

router.get("/billing-redirect", async (req, res) => {
    console.log("Redirect hit");
  const { transactionId, state } = req.query;

  if (!transactionId || !state) {
    return res.redirect("/billing?paymentStatus=error&message=Invalid%20payment%20response");
  }

  try {
    // Find payment in your DB
    const payment = await GeniePayment.findOne({ transaction_id: transactionId });
    if (!payment) {
      return res.redirect("/billing?paymentStatus=error&message=Payment%20record%20not%20found");
    }

    if (state === "SUCCESS") {
      payment.payment_status = "completed";
      await payment.save();
      // Optionally, update subscription here as well
      return res.redirect("/billing?paymentStatus=success&message=Payment%20completed");
    } else if (state === "CANCELLED") {
      payment.payment_status = "cancelled";
      await payment.save();
      return res.redirect("/billing?paymentStatus=cancelled&message=Payment%20cancelled");
    } else {
      return res.redirect("/billing?paymentStatus=error&message=Unknown%20payment%20state");
    }
  } catch (err) {
    console.error(err);
    return res.redirect("/billing?paymentStatus=error&message=Server%20error");
  }
});


export default router;