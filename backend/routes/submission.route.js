// routes/responseRoutes.js
import express from 'express';
import { createSubmission, deleteSubmission, getSubmissionByUserId, getSubmissionsByFormId } from '../controllers/submission.controller.js';
import checkSubscription from '../middleware/checkSubscription.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/:id', verifyToken, checkSubscription, getSubmissionByUserId);
router.get('/form/:formId', verifyToken, checkSubscription, getSubmissionsByFormId);
router.post('/', createSubmission);
router.delete('/:id', verifyToken, checkSubscription, deleteSubmission);


export default router;
