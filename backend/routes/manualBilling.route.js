import express from 'express';
import { 
  getSubscriptionDetails,
  getAvailablePlans,
  handlePaymentRequest,
  getPaymentHistory
} from '../controllers/manualBilling.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get current subscription details
router.get('/subscription-details', verifyToken, getSubscriptionDetails);

// Get available subscription plans
router.get('/available-plans', getAvailablePlans);

// Handle payment request
router.post('/payment-request', verifyToken, handlePaymentRequest);

// Get payment history
router.get('/payment-history', verifyToken, getPaymentHistory);

export default router;