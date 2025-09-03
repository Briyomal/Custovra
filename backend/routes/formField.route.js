// routes/formFieldRoutes.js
import express from 'express';
import { getAllFormFields, createFormField } from '../controllers/formfield.controller.js';
import { verifyToken, adminRoute } from '../middleware/verifyToken.js';

const router = express.Router();

// SECURITY: Added authentication - form fields should be admin-only
router.get('/', verifyToken, adminRoute, getAllFormFields);
router.post('/', verifyToken, adminRoute, createFormField);

export default router;
