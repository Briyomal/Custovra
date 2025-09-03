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
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Configure multer with Cloudinary for profile photo uploads
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'employee_profiles_temp',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 300, height: 300, crop: 'limit' }]
    }
});

const profileUpload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1 * 1024 * 1024 // 1MB limit
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

// SECURITY: Added authentication and subscription checks
router.get('/', verifyToken, checkSubscription, getAllEmployees);
router.get('/:id', verifyToken, checkSubscription, getEmployee);
router.post('/', verifyToken, checkSubscription, profileUpload.single('profile_photo'), createEmployee);
router.put('/:id', verifyToken, checkSubscription, profileUpload.single('profile_photo'), updateEmployee);
router.delete('/:id', verifyToken, checkSubscription, deleteEmployee);

export default router;