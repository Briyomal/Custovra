import express from 'express';
import {
    getAllUserForms,
    getFormById,
    createForm,
    updateForm,
    deleteForm,
} from '../controllers/form.controller.js';

import checkSubscription from '../middleware/checkSubscription.js';  // Importing the middleware function
import { verifyToken } from '../middleware/verifyToken.js';
import { fileURLToPath } from 'url';

import multer from 'multer';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save files in 'public/uploads/' directory
    cb(null, path.join(__dirname, '../public/uploads/logos'));
  },
  filename: (req, file, cb) => {
    // Use a unique identifier for filenames
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);

    // Save only the relative path in the database
    req.savedFilePath = `/public/uploads/logos/${uniqueName}`;
  },
});
// Filter files based on their type
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/; // Accept only specific image formats
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer with the defined storage and file filter
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter,
});

const router = express.Router();

router.get('/', verifyToken, checkSubscription, getAllUserForms);
router.get('/:id', verifyToken, checkSubscription, getFormById);
router.post('/create-form', verifyToken, checkSubscription, createForm);
router.put('/update-form/:id', verifyToken, checkSubscription, upload.single('image'), updateForm);
router.delete('/:id', verifyToken, checkSubscription, deleteForm);

export default router;
