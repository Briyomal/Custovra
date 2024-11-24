// routes/reportRoutes.js
import express from 'express';
import { generateReport, getReport } from '../controllers/report.controller.js';

const router = express.Router();

router.post('/:formId', generateReport); // Generate and save report
router.get('/:formId', getReport); // Get a saved report

export default router;