// routes/responseRoutes.js
import express from 'express';
import { getResponsesForForm, createResponse } from '../controllers/response.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import checkSubscription from '../middleware/checkSubscription.js';

const router = express.Router();

// SECURITY: Added authentication and subscription checks
router.get('/:formId', verifyToken, checkSubscription, getResponsesForForm);
router.post('/', verifyToken, checkSubscription, createResponse);

export default router;
