import express from 'express';
import { handleSubscriptionCompleted} from '../controllers/payment.controller.js';

const router = express.Router();

// SECURITY NOTE: Most payment routes are commented out
// This might be intentional, but should be reviewed for production
// Ensure webhook security is properly handled in main index.js

// Test endpoint - should be removed in production
router.get('/testweb', handleSubscriptionCompleted);

export default router;