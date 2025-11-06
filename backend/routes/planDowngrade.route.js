import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    checkDowngradeImpact,
    handleFormSelection,
    autoHandleDowngrade,
    getLockedForms,
    handleFormSelectionForUpgrade,
    autoHandleUpgrade,
    getAllUserFormsForUpgrade
} from '../controllers/planDowngrade.controller.js';

const router = express.Router();

// Check if user needs to handle plan downgrade
router.get('/check-downgrade-impact', verifyToken, checkDowngradeImpact);

// Handle user's form selection during downgrade
router.post('/handle-form-selection', verifyToken, handleFormSelection);

// Auto-handle downgrade (keep most recent forms)
router.post('/auto-handle-downgrade', verifyToken, autoHandleDowngrade);

// Get user's locked forms
router.get('/locked-forms', verifyToken, getLockedForms);

// Handle user's form selection during upgrade (unlock forms)
router.post('/handle-form-selection-for-upgrade', verifyToken, handleFormSelectionForUpgrade);

// Get all user's forms for upgrade selection
router.get('/all-forms-for-upgrade', verifyToken, getAllUserFormsForUpgrade);

// Auto-handle upgrade (unlock locked forms up to plan limit)
router.post('/auto-handle-upgrade', verifyToken, autoHandleUpgrade);

export default router;