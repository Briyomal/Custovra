import express from 'express';

const router = express.Router();
import { verifyToken } from '../middleware/verifyToken.js';
import { changePassword, getProfile, updateProfile } from '../controllers/profile.controller.js';

router.get('/:id', verifyToken, getProfile);
router.post('/change-password', verifyToken, changePassword);

router.put("/update", verifyToken, updateProfile);

export default router;