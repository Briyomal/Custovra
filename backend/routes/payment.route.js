import express from 'express';
//import { getAllPayments, getPaymentById, createPayment, updatePayment, deletePayment, handleStripeWebhook  } from '../controllers/payment.controller.js';
import { handleSubscriptionCompleted} from '../controllers/payment.controller.js';

const router = express.Router();
/*
router.get('/all-payments', getAllPayments);
router.get('/payment:id', getPaymentById);
router.post('/payemnt-create', createPayment);
router.put('/payemnt-update:id', updatePayment);
router.delete('/payemnt-delete:id', deletePayment);
*/
// Webhook route to handle Stripe events
// This middleware must come first in the file where the webhook is defined
/*
router.post(
    "/webhook",
    express.raw({ type: "application/json" }), // Ensure raw body is used
    handleStripeWebhook
  );
  */

  router.get('/testweb', handleSubscriptionCompleted);

export default router;