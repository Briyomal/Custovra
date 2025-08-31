// routes/responseRoutes.js
import express from 'express';
import { createSubmission, deleteSubmission, getSubmissionByUserId, getSubmissionsByFormId } from '../controllers/submission.controller.js';
import checkSubscription from '../middleware/checkSubscription.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkSubmissionLimit } from '../middleware/checkSubscriptionLimits.js';

const router = express.Router();

router.get('/:id', verifyToken, checkSubscription, getSubmissionByUserId);
router.get('/form/:formId', verifyToken, checkSubscription, getSubmissionsByFormId);
// Note: Submission creation endpoint needs special handling as it might be public
// Add checkSubmissionLimit middleware if you want to enforce limits on form submissions
router.post('/', checkSubmissionLimit, createSubmission);
router.delete('/:id', verifyToken, checkSubscription, deleteSubmission);


export default router;
