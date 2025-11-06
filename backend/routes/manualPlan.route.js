import express from 'express';
import { 
    getAllManualPlans,
    getManualPlanById,
    createManualPlan,
    updateManualPlan,
    deleteManualPlan,
    getActiveManualPlans
} from '../controllers/manualPlan.controller.js';
import { verifyToken, adminRoute } from '../middleware/verifyToken.js';

const router = express.Router();

// Public route to get active plans
router.get('/active', getActiveManualPlans);

// Admin routes for managing manual plans
router.get('/', verifyToken, adminRoute, getAllManualPlans);
router.get('/:id', verifyToken, adminRoute, getManualPlanById);
router.post('/', verifyToken, adminRoute, createManualPlan);
router.put('/:id', verifyToken, adminRoute, updateManualPlan);
router.delete('/:id', verifyToken, adminRoute, deleteManualPlan);

export default router;