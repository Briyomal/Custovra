import express from "express";
import { listPolarProducts, getCustomerSubscriptions, getCustomerBillingPortal, getCustomerPaymentHistory } from "../controllers/polarController.js";
import { createCheckout } from "../controllers/payment.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/products", listPolarProducts);
router.post("/create-checkout", verifyToken, createCheckout);
router.get("/subscriptions", verifyToken, getCustomerSubscriptions);
router.get("/billing-portal", verifyToken, getCustomerBillingPortal);
router.get("/payment-history", verifyToken, getCustomerPaymentHistory);

export default router;