import express from 'express';
import { 
    getAllManualSubscriptions,
    getManualSubscriptionById,
    getUserManualSubscriptions,
    createManualSubscription,
    updateManualSubscription,
    cancelManualSubscription,
    getAllUserSubscriptions,
    assignPlanToUser,
    upgradeUserPlan,
    downgradeUserPlan
} from '../controllers/manualSubscription.controller.js';
import { verifyToken, adminRoute } from '../middleware/verifyToken.js';

const router = express.Router();

// Admin routes for managing manual subscriptions
router.get('/', verifyToken, adminRoute, getAllManualSubscriptions);
router.get('/user/:userId', verifyToken, adminRoute, getUserManualSubscriptions);
router.get('/:id', verifyToken, adminRoute, getManualSubscriptionById);
router.post('/', verifyToken, adminRoute, createManualSubscription);
router.post('/assign-plan', verifyToken, adminRoute, assignPlanToUser);
router.put('/:id', verifyToken, adminRoute, updateManualSubscription);
router.put('/:id/cancel', verifyToken, adminRoute, cancelManualSubscription);
router.put('/:id/upgrade', verifyToken, adminRoute, upgradeUserPlan);
router.put('/:id/downgrade', verifyToken, adminRoute, downgradeUserPlan);

export default router;