// routes/formFieldRoutes.js
import express from 'express';
import { getAllFormFields, createFormField } from '../controllers/formfield.controller.js';

const router = express.Router();

router.get('/', getAllFormFields);
router.post('/', createFormField);

export default router;
