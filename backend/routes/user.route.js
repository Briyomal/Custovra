import express from 'express';
import { adminRoute, verifyToken } from '../middleware/verifyToken.js';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
const router = express.Router();

// SECURITY: Fixed route parameter separators and added proper validation
router.get("/all-users", verifyToken, adminRoute, getAllUsers);
router.get('/:id', verifyToken, adminRoute, getUserById);
router.post('/user-create', verifyToken, adminRoute, createUser);
router.put('/user-update/:id', verifyToken, adminRoute, updateUser); // Fixed missing separator
router.delete('/user-delete/:id', verifyToken, adminRoute, deleteUser); // Fixed missing separator

export default router;