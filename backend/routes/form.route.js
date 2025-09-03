import express from 'express';
import {
    getAllUserForms,
    getFormById,
    createForm,
    updateForm,
    deleteForm,
    viewForm,
    getFormsByUserId,
} from '../controllers/form.controller.js';

import checkSubscription from '../middleware/checkSubscription.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkFormCreationLimit } from '../middleware/checkSubscriptionLimits.js';
import { checkFormAccess, checkFormAccessReadOnly } from '../middleware/checkFormAccess.js';

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';

// Setup Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'logos', // folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const logoUpload = multer({ storage });

const router = express.Router();

router.get('/', verifyToken, checkSubscription, getAllUserForms);
router.get('/:id', verifyToken, checkSubscription, checkFormAccessReadOnly, getFormById);

// Add logo upload support to createForm route
router.post('/create-form', verifyToken, checkSubscription, checkFormCreationLimit, logoUpload.single('image'), createForm);

// Use the 'logoUpload' multer configuration to handle image upload for logos
router.put('/update-form/:id', verifyToken, checkSubscription, checkFormAccess, logoUpload.single('image'), updateForm);

router.delete('/:id', verifyToken, checkSubscription, checkFormAccess, deleteForm);
router.get('/view/:id', viewForm);

router.get('/all/:id', verifyToken, checkSubscription, getFormsByUserId);
router.get('/user/:id', verifyToken, checkSubscription, getFormsByUserId);

export default router;
