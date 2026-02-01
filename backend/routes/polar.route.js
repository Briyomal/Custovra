import { listPolarProducts, getCustomerSubscriptions, getCustomerBillingPortal, getCustomerPaymentHistory } from "../controllers/polarController.js";
import { createCheckout, changeSubscription, createCatalogCheckout } from "../controllers/payment.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import express from "express";

const router = express.Router();

router.get("/products", listPolarProducts);
router.post("/create-checkout", verifyToken, createCheckout);
router.post("/create-catalog-checkout", verifyToken, createCatalogCheckout);
router.get("/subscriptions", verifyToken, getCustomerSubscriptions);
router.get("/billing-portal", verifyToken, getCustomerBillingPortal);
router.get("/payment-history", verifyToken, getCustomerPaymentHistory);
router.post(
  "/change-subscription",
  verifyToken,
  changeSubscription
);

export default router;