// routes/reportRoutes.js
import express from 'express';
import { generateReport, getReport, getAdminStats, getAdminUserStats } from '../controllers/report.controller.js';
import { verifyToken, adminRoute } from '../middleware/verifyToken.js';
import checkSubscription from '../middleware/checkSubscription.js';

const router = express.Router();

// SECURITY: Added authentication and subscription checks
router.post('/:formId', verifyToken, checkSubscription, generateReport); // Generate and save report
router.get('/:formId', verifyToken, checkSubscription, getReport); // Get a saved report

// Admin routes
router.get('/admin/stats', verifyToken, adminRoute, getAdminStats); // Get overall admin stats
router.get('/admin/user/:userId', verifyToken, adminRoute, getAdminUserStats); // Get user-specific stats

export default router;