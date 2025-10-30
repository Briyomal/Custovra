import express from 'express';

const router = express.Router();
import { verifyToken } from '../middleware/verifyToken.js';
import { changePassword, getProfile, updateProfile, generate2FA, verify2FA, disable2FA } from '../controllers/profile.controller.js';

router.get('/:id', verifyToken, getProfile);
router.post('/change-password', verifyToken, changePassword);

router.put("/update", verifyToken, updateProfile);

// 2FA routes
router.post("/2fa/generate", verifyToken, generate2FA);
router.post("/2fa/verify", verifyToken, verify2FA);
router.post("/2fa/disable", verifyToken, disable2FA);

export default router;