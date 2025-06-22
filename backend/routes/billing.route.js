import express from 'express';
import { createCustomerPortalSession } from '../controllers/billing.controller.js';
import { verifyToken } from '../middleware/verifyToken.js'; // Import your middleware

const router = express.Router();

// Route to create a Stripe Customer Portal session
// This route should be protected, only authenticated users can access their portal
router.post('/create-customer-portal-session', verifyToken, createCustomerPortalSession);

export default router;