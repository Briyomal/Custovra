import express from 'express';
import { adminRoute, verifyToken } from '../middleware/verifyToken.js';
/*
import {
    createPaymentIntent,
    updateSubscription,
} from '../controllers/payment.controller.js';
 */
import {
    getAllSubscriptions,
    getSubscriptionById,
    createSubscription,
    updateSubscription as updateSub,
    deleteSubscription,
    createCheckoutSession ,
} from '../controllers/subscription.controller.js';
import checkSubscription from '../middleware/checkSubscription.js';

const router = express.Router();

// Admin routes for managing subscriptions
router.get('/', getAllSubscriptions);
router.get('/subscription/:id', verifyToken, adminRoute, getSubscriptionById);
router.post('/subscription-create', verifyToken, adminRoute, createSubscription);
router.put('/subscription-update/:id', verifyToken, adminRoute, updateSub);
router.delete('/subscription-delete/:id', verifyToken, adminRoute, deleteSubscription);

// Payment routes

// Select and pay for a subscription plan
router.post('/checkout-session', verifyToken, createCheckoutSession); // Selecting a plan

// Protect routes requiring active subscriptions
router.use(checkSubscription);

export default router;

