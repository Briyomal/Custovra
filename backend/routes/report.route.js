// routes/reportRoutes.js
import express from 'express';
import { generateReport, getReport } from '../controllers/report.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import checkSubscription from '../middleware/checkSubscription.js';

const router = express.Router();

// SECURITY: Added authentication and subscription checks
router.post('/:formId', verifyToken, checkSubscription, generateReport); // Generate and save report
router.get('/:formId', verifyToken, checkSubscription, getReport); // Get a saved report

export default router;