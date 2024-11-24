// routes/employeeRoutes.js
import express from 'express';
import { getAllEmployees, createEmployee } from '../controllers/employee.controller.js';

const router = express.Router();

router.get('/:userId', getAllEmployees);
router.post('/', createEmployee);

export default router;