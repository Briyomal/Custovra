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

import checkSubscription from '../middleware/checkSubscription.js';  // Importing the middleware function
import { verifyToken } from '../middleware/verifyToken.js';
import { checkFormCreationLimit } from '../middleware/checkSubscriptionLimits.js';
import { fileURLToPath } from 'url';

import multer from 'multer';
import path from 'path';

import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'logos', // folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

/*
// Define storage for multer to save logos in 'public/uploads/logos/'
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save files in 'public/uploads/logos/' directory for logos
    cb(null, path.join(__dirname, '../public/uploads/logos'));
  },
  filename: (req, file, cb) => {
    // Use a unique identifier for filenames (add a timestamp to make it unique)
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);

    // Save only the relative path in the database for later retrieval
    req.savedFilePath = `/public/uploads/logos/${uniqueName}`;
  },
});

// Filter files for logos (jpeg, jpg, png, gif)
const logoFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/; // Accept only specific image formats
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for logos!'), false);
  }
};

// Initialize multer with the logo storage configuration
const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: logoFileFilter,
});

*/

const logoUpload = multer({ storage });

const router = express.Router();

router.get('/', verifyToken, checkSubscription, getAllUserForms);
router.get('/:id', verifyToken, checkSubscription, getFormById);
router.post('/create-form', verifyToken, checkSubscription, checkFormCreationLimit, createForm);

// Use the 'logoUpload' multer configuration to handle image upload for logos
router.put('/update-form/:id', verifyToken, checkSubscription, logoUpload.single('image'), updateForm);

router.delete('/:id', verifyToken, checkSubscription, deleteForm);
router.get('/view/:id', viewForm);


router.get('/all/:id', verifyToken, checkSubscription, getFormsByUserId);
router.get('/user/:id', verifyToken, checkSubscription, getFormsByUserId);

export default router;
