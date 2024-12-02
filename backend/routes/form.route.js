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

const router = express.Router();

router.get('/', verifyToken, checkSubscription, getAllUserForms);
router.get('/:id', verifyToken, checkSubscription, getFormById);
router.post('/create-form', verifyToken, checkSubscription, createForm);
router.put('/update-form:id', updateForm);
router.delete('/delete-form:id', deleteForm);

export default router;
