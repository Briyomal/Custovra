import express from 'express';
import {
    getAllUserForms,
    getFormById,
    createForm,
    updateForm,
    deleteForm,
    deleteFormLogo,
    viewForm,
    getFormsByUserId,
    getAllFormsForAdmin,
    getAllUsersForFormsFilter,
    getFormByIdAdmin
} from '../controllers/form.controller.js';

import checkSubscription from '../middleware/checkSubscription.js';
import { verifyToken, adminRoute } from '../middleware/verifyToken.js';
import { checkFormAccess, checkFormAccessReadOnly } from '../middleware/checkFormAccess.js';
import { checkFormCreationLimit } from '../middleware/checkSubscriptionLimits.js';

import multer from 'multer';
// Replace Cloudinary with S3 storage
import { s3Storage } from '../utils/s3Storage.js';

// Setup S3 Storage
const storage = s3Storage({
  folder: 'form_logos' // folder in S3
});

const logoUpload = multer({ storage });

const router = express.Router();

router.get('/admin/all', verifyToken, adminRoute, getAllFormsForAdmin);
router.get('/admin/users', verifyToken, adminRoute, getAllUsersForFormsFilter);
router.get('/admin/:id', verifyToken, adminRoute, getFormByIdAdmin);
router.get('/', verifyToken, checkSubscription, getAllUserForms);
router.get('/:id', verifyToken, checkSubscription, checkFormAccessReadOnly, getFormById);

// Add logo upload support to createForm route
router.post('/create-form', verifyToken, checkSubscription, checkFormCreationLimit, logoUpload.single('image'), createForm);

// Use the 'logoUpload' multer configuration to handle image upload for logos
router.put('/update-form/:id', verifyToken, checkSubscription, checkFormAccess, logoUpload.single('image'), updateForm);

// Route for deleting a form's logo
router.delete('/delete-logo/:id', verifyToken, checkSubscription, checkFormAccess, deleteFormLogo);

router.delete('/:id', verifyToken, checkSubscription, checkFormAccess, deleteForm);
router.get('/view/:id', viewForm);

router.get('/all/:id', verifyToken, checkSubscription, getFormsByUserId);
router.get('/user/:id', verifyToken, checkSubscription, getFormsByUserId);

export default router;