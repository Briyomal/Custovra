// routes/responseRoutes.js
import express from 'express';
import { getResponsesForForm, createResponse } from '../controllers/response.controller.js';

const router = express.Router();

router.get('/:formId', getResponsesForForm);
router.post('/', createResponse);

export default router;
