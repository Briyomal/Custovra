// routes/responseRoutes.js
import express from 'express';
import { createSubmission, deleteSubmission, getSubmissionByUserId, getSubmissionsByFormId, getSubmissionsByFormOwner, getSubmissionsByFormIdAdmin, getUnreadSubmissionsCount, markSubmissionsAsRead, getUnreadSubmissionsCountByForm, markSubmissionsAsReadByForm } from '../controllers/submission.controller.js';
import checkSubscription from '../middleware/checkSubscription.js';
import { verifyToken, adminRoute } from '../middleware/verifyToken.js';
import { checkSubmissionLimit } from '../middleware/checkSubscriptionLimits.js';
import multer from 'multer';
// Replace Cloudinary with S3 storage
import { s3Storage } from '../utils/s3Storage.js';

// Configure multer with S3 for form submission file uploads
const storage = s3Storage({
    folder: 'form_submissions'
});

const submissionUpload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1 * 1024 * 1024 // 1MB limit for submission files
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG and PNG files are allowed.'), false);
        }
    }
});

const router = express.Router();

router.get('/admin/form/:formId', verifyToken, adminRoute, getSubmissionsByFormIdAdmin); // Admin route for form submissions
router.get('/unread/:id', verifyToken, checkSubscription, getUnreadSubmissionsCount); // Get unread submissions count for user
router.get('/unread/form/:formId', verifyToken, checkSubscription, getUnreadSubmissionsCountByForm); // Get unread submissions count for form
router.get('/:id', verifyToken, checkSubscription, getSubmissionByUserId);
router.get('/owner/:id', verifyToken, checkSubscription, getSubmissionsByFormOwner); // New route for form owner submissions
router.get('/form/:formId', verifyToken, checkSubscription, getSubmissionsByFormId);
router.post('/mark-as-read/:id', verifyToken, checkSubscription, markSubmissionsAsRead); // Mark submissions as read for user
router.post('/mark-as-read/form/:formId', verifyToken, checkSubscription, markSubmissionsAsReadByForm); // Mark submissions as read for form
// Note: Submission creation endpoint needs special handling as it might be public
// Add checkSubmissionLimit middleware if you want to enforce limits on form submissions
router.post('/', submissionUpload.any(), checkSubmissionLimit, createSubmission);
router.delete('/:id', verifyToken, checkSubscription, deleteSubmission);


export default router;