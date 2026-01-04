// routes/responseRoutes.js
import express from 'express';
import multer from 'multer';
import { createSubmission, deleteSubmission, getSubmissionByUserId, getSubmissionsByFormId, getSubmissionsByFormOwner, getSubmissionsByFormIdAdmin, getUnreadSubmissionsCount, markSubmissionsAsRead, getUnreadSubmissionsCountByForm, markSubmissionsAsReadByForm, submissionLimiter } from '../controllers/submission.controller.js';
import checkSubscription from '../middleware/checkSubscription.js';
import { verifyToken, adminRoute } from '../middleware/verifyToken.js';
import { checkSubmissionLimit } from '../middleware/checkSubscriptionLimits.js';
// Replace Cloudinary with S3 storage
import { s3Storage } from '../utils/s3Storage.js';

// Configure multer with S3 for form submission file uploads
const storage = s3Storage({
    folder: 'form_submissions'
});

const submissionUpload = multer({ 
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit for submission files
        files: 1 
    },

    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP files are allowed.'), false);
        }
    }
});

const router = express.Router();

router.get('/admin/form/:formId', verifyToken, adminRoute, getSubmissionsByFormIdAdmin);

router.get('/owner/:id', verifyToken, checkSubscription, getSubmissionsByFormOwner);
router.get('/form/:formId', verifyToken, checkSubscription, getSubmissionsByFormId);
router.get('/unread/form/:formId', verifyToken, checkSubscription, getUnreadSubmissionsCountByForm);
router.post('/mark-as-read/form/:formId', verifyToken, checkSubscription, markSubmissionsAsReadByForm);

// ⚠️ GENERIC ROUTES LAST
router.get('/unread/:id', verifyToken, checkSubscription, getUnreadSubmissionsCount);
router.get('/:id', verifyToken, checkSubscription, getSubmissionByUserId);
router.post('/mark-as-read/:id', verifyToken, checkSubscription, markSubmissionsAsRead);

router.post(
  '/',
  (req, res, next) => {
    submissionUpload.any()(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Handle Multer errors (like file size limit)
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 2MB.' });
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: 'Too many files. Only 1 file allowed.' });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        // Handle custom errors (like invalid file type)
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  submissionLimiter,
  checkSubmissionLimit,
  createSubmission
);

router.delete('/:id', verifyToken, checkSubscription, deleteSubmission);

export default router;