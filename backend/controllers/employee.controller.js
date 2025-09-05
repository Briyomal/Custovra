// controllers/EmployeeController.js
import { Employee } from '../models/Employee.js';
// Replace Cloudinary with S3 utilities
import { uploadFileToS3, deleteFileFromS3, getPresignedUrl, generateEmployeePhotoKey } from '../utils/s3.js';
import concat from 'concat-stream';

// Get all employees for authenticated user only
export const getAllEmployees = async (req, res) => {
    try {
        const userId = req.userId; // From verifyToken middleware
        
        const employees = await Employee.find({ user_id: userId }).sort({ created_at: -1 });
        
        // Add presigned URLs for profile photos
        const employeesWithPresignedUrls = await Promise.all(employees.map(async (employee) => {
            const employeeObject = employee.toObject();
            if (employeeObject.profile_photo.key) {
                try {
                    employeeObject.profile_photo.url = await getPresignedUrl(employeeObject.profile_photo.key);
                } catch (error) {
                    console.error("Error generating presigned URL for profile photo:", error);
                    // Fallback to stored URL if presigned URL generation fails
                    employeeObject.profile_photo.url = employeeObject.profile_photo.url || null;
                }
            }
            return employeeObject;
        }));
        
        res.status(200).json({
            success: true,
            data: employeesWithPresignedUrls,
            count: employeesWithPresignedUrls.length
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
        
        // Create employee first to get the ID
        const newEmployee = new Employee({
            user_id: userId,
            name: name.trim(),
            employee_number: employee_number ? employee_number.trim() : undefined,
            designation: designation.trim(),
            profile_photo: { url: '', key: '' }
        });
        
        await newEmployee.save();
        
        let profilePhotoData = { url: '', key: '' };
        
        // Handle profile photo upload if provided
        if (req.file) {
            try {
                // Generate consistent key for this employee
                const key = generateEmployeePhotoKey(newEmployee._id.toString(), req.file.originalname);
                
                // Upload file with the consistent key (this will overwrite if exists)
                await uploadFileToS3(req.file.buffer, key, req.file.originalname);
                
                profilePhotoData = { key };
            } catch (uploadError) {
                console.error('Error processing profile photo:', uploadError);
                // Continue without photo if upload fails
            }
        }
        
        // Update employee with profile photo data if uploaded
        if (profilePhotoData.key) {
            await Employee.findByIdAndUpdate(newEmployee._id, {
                profile_photo: profilePhotoData
            });
        }
        
        // Fetch the updated employee
        const updatedEmployee = await Employee.findById(newEmployee._id);
        
        // Add presigned URL for the newly created employee
        const employeeObject = updatedEmployee.toObject();
        if (employeeObject.profile_photo.key) {
            try {
                employeeObject.profile_photo.url = await getPresignedUrl(employeeObject.profile_photo.key);
            } catch (error) {
                console.error("Error generating presigned URL for profile photo:", error);
                // Fallback to stored URL if presigned URL generation fails
                employeeObject.profile_photo.url = employeeObject.profile_photo.url || null;
            }
        }
        
        res.status(201).json({
            success: true,
            message: "Employee created successfully.",
            data: employeeObject
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
                // Generate consistent key for this employee
                const key = generateEmployeePhotoKey(employeeId, req.file.originalname);
                
                // Upload file with the consistent key (this will overwrite the existing file)
                await uploadFileToS3(req.file.buffer, key, req.file.originalname);
                
                profilePhotoData = { key };
            } catch (uploadError) {
                console.error('Error processing new profile photo:', uploadError);
                return res.status(400).json({
                    success: false,
                    error: "Failed to process profile photo."
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
        
        // Add presigned URL for the updated employee
        const employeeObject = updatedEmployee.toObject();
        if (employeeObject.profile_photo.key) {
            try {
                employeeObject.profile_photo.url = await getPresignedUrl(employeeObject.profile_photo.key);
            } catch (error) {
                console.error("Error generating presigned URL for profile photo:", error);
                // Fallback to stored URL if presigned URL generation fails
                employeeObject.profile_photo.url = employeeObject.profile_photo.url || null;
            }
        }
        
        res.status(200).json({
            success: true,
            message: "Employee updated successfully.",
            data: employeeObject
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
        
        // Delete profile photo from S3 if exists
        if (employee.profile_photo.key) {
            try {
                await deleteFileFromS3(employee.profile_photo.key);
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
        
        // Add presigned URL for profile photo
        const employeeObject = employee.toObject();
        if (employeeObject.profile_photo.key) {
            try {
                employeeObject.profile_photo.url = await getPresignedUrl(employeeObject.profile_photo.key);
            } catch (error) {
                console.error("Error generating presigned URL for profile photo:", error);
                // Fallback to stored URL if presigned URL generation fails
                employeeObject.profile_photo.url = employeeObject.profile_photo.url || null;
            }
        }
        
        res.status(200).json({
            success: true,
            data: employeeObject
        });
    } catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).json({ 
            success: false,
            error: "Server error. Unable to fetch employee." 
        });
    }
};