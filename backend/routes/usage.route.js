import express from 'express';
import { getUserUsage, getSubscriptionPlans, checkUserPermission, debugUserSubscription } from '../controllers/usage.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get current user's usage statistics
router.get('/stats', verifyToken, getUserUsage);

// Get all subscription plans
router.get('/plans', getSubscriptionPlans);

// Check if user can perform specific action
router.get('/check/:action', verifyToken, checkUserPermission);

// Debug endpoint for troubleshooting subscription detection
router.get('/debug', verifyToken, debugUserSubscription);

export default router;