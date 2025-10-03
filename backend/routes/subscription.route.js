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
    createCheckoutSession,
    updateSubscriptionPlan,
    completeSubscriptionUpdate,
    checkPlanChangeRequirements,
    toggleAutoRenewal,
    renewPreviousPlan
} from '../controllers/subscription.controller.js';
import checkSubscription from '../middleware/checkSubscription.js';

const router = express.Router();

// Admin routes for managing subscriptions
router.get('/', verifyToken, getAllSubscriptions);
router.get('/subscription/:id', verifyToken, adminRoute, getSubscriptionById);
router.post('/subscription-create', verifyToken, adminRoute, createSubscription);
router.put('/subscription-update/:id', verifyToken, adminRoute, updateSub);
router.delete('/subscription-delete/:id', verifyToken, adminRoute, deleteSubscription);

// Payment routes

// Create new subscription
router.post('/checkout-session', verifyToken, createCheckoutSession);

// Check plan change requirements before updating (for modal display)
router.post('/check-plan-change', verifyToken, checkPlanChangeRequirements);

// Update/modify existing subscription plan
router.post('/update-plan', verifyToken, updateSubscriptionPlan);

// Toggle auto-renewal for subscription
router.post('/toggle-auto-renewal', verifyToken, toggleAutoRenewal);

// Renew previous subscription plan
router.post('/renew-previous-plan', verifyToken, renewPreviousPlan);

// Complete subscription update after form selection (for downgrades)
router.post('/complete-update', verifyToken, completeSubscriptionUpdate);

// Protect routes requiring active subscriptions
router.use(checkSubscription);
 
export default router;