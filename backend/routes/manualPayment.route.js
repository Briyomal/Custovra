import express from 'express';
import { 
    getAllManualPayments,
    getManualPaymentById,
    createManualPayment,
    updateManualPayment,
    deleteManualPayment,
    approveManualPayment,
    rejectManualPayment,
    getAllPendingPayments
} from '../controllers/manualPayment.controller.js';
import { verifyToken, adminRoute } from '../middleware/verifyToken.js';

const router = express.Router();

// Admin routes for managing manual payments
router.get('/', verifyToken, adminRoute, getAllManualPayments);
router.get('/pending', verifyToken, adminRoute, getAllPendingPayments);
router.get('/:id', verifyToken, adminRoute, getManualPaymentById);
router.post('/', verifyToken, adminRoute, createManualPayment);
router.put('/:id', verifyToken, adminRoute, updateManualPayment);
router.delete('/:id', verifyToken, adminRoute, deleteManualPayment);
router.put('/:id/approve', verifyToken, adminRoute, approveManualPayment);
router.put('/:id/reject', verifyToken, adminRoute, rejectManualPayment);

export default router;