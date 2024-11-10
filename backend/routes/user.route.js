import express from 'express';
import { adminRoute, verifyToken } from '../middleware/verifyToken.js';
import { getAllUsers } from '../controllers/user.controller.js';
const router = express.Router();


router.get("/all-users", verifyToken, adminRoute, getAllUsers);

export default router;