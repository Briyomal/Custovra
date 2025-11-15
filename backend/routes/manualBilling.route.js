import express from 'express';
import { 
    getManualSubscriptionDetails,
    getManualPaymentHistory,
    getManualAvailablePlans,
    createManualPaymentRequest
} from '../controllers/manualBilling.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import multer from 'multer';

// Setup multer for handling FormData without file storage (we're just parsing fields)
const upload = multer();

const router = express.Router();

// Get current subscription details
router.get('/subscription-details', verifyToken, getManualSubscriptionDetails);

// Get payment history
router.get('/payment-history', verifyToken, getManualPaymentHistory);

// Get available subscription plans
router.get('/available-plans', getManualAvailablePlans);

// Create a new manual payment request
router.post('/payment-request', verifyToken, upload.none(), createManualPaymentRequest);

export default router;