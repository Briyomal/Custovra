import express from 'express';
import { adminRoute, verifyToken } from '../middleware/verifyToken.js';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
const router = express.Router();


router.get("/all-users", verifyToken, adminRoute, getAllUsers);
router.get('/:id', verifyToken, adminRoute, getUserById);
router.post('/user-create', verifyToken, adminRoute, createUser);
router.put('/user-update:id', verifyToken, adminRoute, updateUser);
router.delete('/user-delete:id', verifyToken, adminRoute, deleteUser);

export default router;