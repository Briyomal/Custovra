// routes/employeeRoutes.js
import express from 'express';
import { 
    getAllEmployees, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee, 
    getEmployee 
} from '../controllers/employee.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import checkSubscription from '../middleware/checkSubscription.js';
import multer from 'multer';
// Replace Cloudinary with S3 storage
import { s3Storage } from '../utils/s3Storage.js';

const router = express.Router();

// Configure multer with S3 for profile photo uploads
const storage = s3Storage({
    folder: 'employee_profiles'
});

const profileUpload = multer({
    storage: storage,
    limits: {
        fileSize: 1 * 1024 * 1024 // 1MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('INVALID_FILE_TYPE'), false);
        }
    }
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
    if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 1MB.'
            });
        }
        if (err.message === 'INVALID_FILE_TYPE') {
            return res.status(400).json({
                success: false,
                error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.'
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message || 'Error uploading file.'
        });
    }
    next();
};

// SECURITY: Added authentication and subscription checks
router.get('/', verifyToken, checkSubscription, getAllEmployees);
router.get('/:id', verifyToken, checkSubscription, getEmployee);
router.post('/', verifyToken, checkSubscription, profileUpload.single('profile_photo'), handleMulterError, createEmployee);
router.put('/:id', verifyToken, checkSubscription, profileUpload.single('profile_photo'), handleMulterError, updateEmployee);
router.delete('/:id', verifyToken, checkSubscription, deleteEmployee);

export default router;