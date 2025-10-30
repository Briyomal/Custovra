import express from 'express';
import { 
  createCustomerPortalSession,
  getSubscriptionDetails,
  getPaymentHistory,
  getAvailablePlans,
  createSetupIntent,
  getPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod
} from '../controllers/billing.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import checkSubscription from '../middleware/checkSubscription.js';

const router = express.Router();

// Route to create a Stripe Customer Portal session
// This route should be protected, only authenticated users can access their portal
router.post('/create-customer-portal-session', verifyToken, createCustomerPortalSession);

// Get current subscription details
router.get('/subscription-details', verifyToken, getSubscriptionDetails);

// Get payment history
router.get('/payment-history', verifyToken, getPaymentHistory);

// Get available subscription plans
router.get('/available-plans', getAvailablePlans);

// Payment method management
router.post('/setup-intent', verifyToken, createSetupIntent);
router.get('/payment-methods', verifyToken, getPaymentMethods);
router.delete('/payment-methods/:paymentMethodId', verifyToken, deletePaymentMethod);
router.put('/default-payment-method', verifyToken, setDefaultPaymentMethod);

export default router;