// controllers/EmployeeController.js
import { Employee } from '../models/Employee.js';
import { v2 as cloudinary } from 'cloudinary';

// Get all employees for authenticated user only
export const getAllEmployees = async (req, res) => {
    try {
        const userId = req.userId; // From verifyToken middleware
        
        const employees = await Employee.find({ user_id: userId }).sort({ created_at: -1 });
        
        res.status(200).json({
            success: true,
            data: employees,
            count: employees.length
        });
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ 
            success: false,
            error: "Server error. Unable to fetch employees." 
        });
    }
};

// Create an employee
export const createEmployee = async (req, res) => {
    try {
        const userId = req.userId; // From verifyToken middleware
        const { name, employee_number, designation } = req.body;
        
        // Validate required fields
        if (!name || !designation) {
            return res.status(400).json({
                success: false,
                error: "Name and designation are required fields."
            });
        }
        
        // Check if employee number is unique for this user (if provided)
        if (employee_number) {
            const existingEmployeeNumber = await Employee.findOne({ 
                user_id: userId, 
                employee_number: employee_number 
            });
            
            if (existingEmployeeNumber) {
                return res.status(400).json({
                    success: false,
                    error: "Employee number already exists."
                });
            }
        }
        
        let profilePhotoData = { url: '', public_id: '' };
        
        // Handle profile photo upload if provided
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'employee_profiles',
                    transformation: [
                        { width: 100, height: 100, crop: 'fill', gravity: 'face' },
                        { quality: 'auto' }
                    ]
                });
                
                profilePhotoData = {
                    url: result.secure_url,
                    public_id: result.public_id
                };
            } catch (uploadError) {
                console.error('Error uploading profile photo:', uploadError);
                // Continue without photo if upload fails
            }
        }
        
        // SECURITY: Ensure employee is created under authenticated user
        const newEmployee = new Employee({
            user_id: userId,
            name: name.trim(),
            employee_number: employee_number ? employee_number.trim() : undefined,
            designation: designation.trim(),
            profile_photo: profilePhotoData
        });
        
        await newEmployee.save();
        
        res.status(201).json({
            success: true,
            message: "Employee created successfully.",
            data: newEmployee
        });
    } catch (error) {
        console.error("Error creating employee:", error);
        res.status(400).json({ 
            success: false,
            error: "Failed to create employee." 
        });
    }
};

// Update an employee
export const updateEmployee = async (req, res) => {
    try {
        const userId = req.userId;
        const employeeId = req.params.id;
        const { name, employee_number, designation } = req.body;
        
        // Find employee and verify ownership
        const employee = await Employee.findOne({ _id: employeeId, user_id: userId });
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: "Employee not found or access denied."
            });
        }
        
        // Validate required fields
        if (!name || !designation) {
            return res.status(400).json({
                success: false,
                error: "Name and designation are required fields."
            });
        }
        
        // Check if employee number is unique (excluding current employee)
        if (employee_number && employee_number !== employee.employee_number) {
            const existingEmployeeNumber = await Employee.findOne({ 
                user_id: userId, 
                employee_number: employee_number,
                _id: { $ne: employeeId }
            });
            
            if (existingEmployeeNumber) {
                return res.status(400).json({
                    success: false,
                    error: "Employee number already exists."
                });
            }
        }
        
        let profilePhotoData = employee.profile_photo;
        
        // Handle profile photo upload if provided
        if (req.file) {
            try {
                // Delete old photo if exists
                if (employee.profile_photo.public_id) {
                    try {
                        await cloudinary.uploader.destroy(employee.profile_photo.public_id);
                    } catch (deleteError) {
                        console.error('Error deleting old profile photo:', deleteError);
                    }
                }
                
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'employee_profiles',
                    transformation: [
                        { width: 100, height: 100, crop: 'fill', gravity: 'face' },
                        { quality: 'auto' }
                    ]
                });
                
                profilePhotoData = {
                    url: result.secure_url,
                    public_id: result.public_id
                };
            } catch (uploadError) {
                console.error('Error uploading new profile photo:', uploadError);
                return res.status(400).json({
                    success: false,
                    error: "Failed to upload profile photo."
                });
            }
        }
        
        // Update employee data
        const updatedEmployee = await Employee.findByIdAndUpdate(
            employeeId,
            {
                name: name.trim(),
                employee_number: employee_number ? employee_number.trim() : undefined,
                designation: designation.trim(),
                profile_photo: profilePhotoData,
                updated_at: new Date()
            },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: "Employee updated successfully.",
            data: updatedEmployee
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        res.status(400).json({ 
            success: false,
            error: "Failed to update employee." 
        });
    }
};

// Delete an employee
export const deleteEmployee = async (req, res) => {
    try {
        const userId = req.userId;
        const employeeId = req.params.id;
        
        // Find employee and verify ownership
        const employee = await Employee.findOne({ _id: employeeId, user_id: userId });
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: "Employee not found or access denied."
            });
        }
        
        // Delete profile photo from Cloudinary if exists
        if (employee.profile_photo.public_id) {
            try {
                await cloudinary.uploader.destroy(employee.profile_photo.public_id);
            } catch (deleteError) {
                console.error('Error deleting profile photo:', deleteError);
                // Continue with employee deletion even if photo deletion fails
            }
        }
        
        await Employee.findByIdAndDelete(employeeId);
        
        res.status(200).json({
            success: true,
            message: "Employee deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting employee:", error);
        res.status(400).json({ 
            success: false,
            error: "Failed to delete employee." 
        });
    }
};

// Get single employee
export const getEmployee = async (req, res) => {
    try {
        const userId = req.userId;
        const employeeId = req.params.id;
        
        const employee = await Employee.findOne({ _id: employeeId, user_id: userId });
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: "Employee not found or access denied."
            });
        }
        
        res.status(200).json({
            success: true,
            data: employee
        });
    } catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).json({ 
            success: false,
            error: "Server error. Unable to fetch employee." 
        });
    }
};
