// controllers/EmployeeController.js
import { Employee } from '../models/Employee.js';

// Get all employees
export const getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ user_id: req.params.userId });
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create an employee
export const createEmployee = async (req, res) => {
    try {
        const newEmployee = new Employee(req.body);
        await newEmployee.save();
        res.status(201).json(newEmployee);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
