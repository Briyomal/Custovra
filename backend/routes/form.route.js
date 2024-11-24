import express from 'express';
import {
    getAllForms,
    getFormById,
    createForm,
    updateForm,
    deleteForm,
} from '../controllers/form.controller.js';

import checkSubscription from '../middleware/checkSubscription.js';  // Importing the middleware function

const router = express.Router();

router.get('/all-forms', getAllForms);
router.get('/form:id', getFormById);
router.post('/form-create', createForm, checkSubscription);
router.put('/form-update:id', updateForm);
router.delete('/form-delete:id', deleteForm);

export default router;