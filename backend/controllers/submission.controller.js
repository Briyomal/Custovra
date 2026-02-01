import { Submission } from '../models/Submission.js';
import { Form } from '../models/Form.js';
import { Employee } from '../models/Employee.js';
import mongoose from 'mongoose';
import axios from "axios";
// Add S3 utilities import
import { uploadFileToS3, getPresignedUrl } from '../utils/s3.js';
import rateLimit from "express-rate-limit";
import { reportSubmissionCreation } from '../services/polarMeter.service.js';

// Create a helper function to generate a unique key for submission files
const generateSubmissionFileKey = (formId, fieldName, originalname) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `form_submissions/${formId}/${fieldName}_${timestamp}_${randomString}_${originalname}`;
};

export const submissionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 submissions per IP
  standardHeaders: true,
  legacyHeaders: false,
});

export const getAllSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find().populate('user_id');
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fetch all submissions for a given user
export const getSubmissionByUserId = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const submissions = await Submission.find({ user_id: userId });
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: "Server error. Unable to fetch submissions." });
    }
};

// Fetch all submissions for all forms owned by a user (includes public submissions)
export const getSubmissionsByFormOwner = async (req, res) => {
    const { id: userId } = req.params;

    try {
        // First, get all forms owned by this user
        const userForms = await Form.find({ user_id: userId }).select('_id');
        const formIds = userForms.map(form => form._id);

        // Then, get all submissions for these forms (includes public submissions with user_id: null)
        const submissions = await Submission.find({ form_id: { $in: formIds } })
            .populate('form_id');
            
        // Process submissions to filter out turnstile and resolve employee data
        const processedSubmissions = [];
        
        for (const submission of submissions) {
            const processedData = { ...submission.toObject() };
            
            // Convert MongoDB Map to plain object if needed
            let submissionsData = processedData.submissions;
            if (submissionsData && submissionsData instanceof Map) {
                submissionsData = Object.fromEntries(submissionsData);
            } else if (submissionsData && typeof submissionsData === 'object') {
                // Ensure it's a plain object
                submissionsData = { ...submissionsData };
            }
            
            // Filter out turnstile response from submissions
            if (submissionsData && Object.keys(submissionsData).length > 0) {
                // Only filter out cf-turnstile-response and captchaToken, preserve all other fields
                const { 'cf-turnstile-response': turnstileResponse, 'captchaToken': captchaToken, ...filteredSubmissions } = submissionsData;
                
                // Process employee fields to replace IDs with employee data
                const resolvedSubmissions = { ...filteredSubmissions };
                
                for (const [key, value] of Object.entries(resolvedSubmissions)) {
                    // Check if this field is an employee field and contains ObjectId pattern
                    if ((key.toLowerCase().includes('employee') || key.toLowerCase().endsWith('employee')) && 
                        typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
                        try {
                            const employee = await Employee.findById(value).select('name designation profile_photo');
                            if (employee) {
                                resolvedSubmissions[key] = `${employee.name} - ${employee.designation}`;
                            }
                        } catch (err) {
                            // If it's not a valid employee ID, keep the original value
                        }
                    }
                    // Check if this field is an employee rating field
                    else if (key.toLowerCase().includes('employee') && key.toLowerCase().includes('rating')) {
                        // This is an employee rating field, keep the value as is
                        // It will be a numeric rating value
                    }
                    // Check if this field is an image field and contains an S3 key
                    else if ((key.toLowerCase().includes('image') || key.toLowerCase().includes('photo') || 
                             key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.png')) && 
                             typeof value === 'string' && value.startsWith('form_submissions/')) {
                        try {
                            // Generate presigned URL for the image
                            const presignedUrl = await getPresignedUrl(value);
                            resolvedSubmissions[key] = presignedUrl;
                        } catch (err) {
                            console.error('Error generating presigned URL for image:', err);
                            // Keep the original S3 key if URL generation fails
                        }
                    }
                }
                
                processedData.submissions = resolvedSubmissions;
            } else {
                processedData.submissions = {}; // Ensure it's an empty object, not null
            }
            
            processedSubmissions.push(processedData);
        }
        
        res.status(200).json(processedSubmissions);
    } catch (error) {
        console.error('Error fetching submissions by form owner:', error);
        res.status(500).json({ message: "Server error. Unable to fetch submissions." });
    }
};

// Get all responses for a form
export const getSubmissionsByFormId = async (req, res) => {
    try {
        // Validate formId is a proper ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.formId)) {
            return res.status(400).json({ message: "Invalid form ID" });
        }
        
        const submissions = await Submission.find({ form_id: req.params.formId })
            .populate('form_id');
            
        // Process submissions to replace employee IDs with employee data
        const processedSubmissions = [];
        
        for (const submission of submissions) {
            const processedData = { ...submission.toObject() };
            
            // Convert MongoDB Map to plain object if needed
            let submissionsData = processedData.submissions;
            if (submissionsData && submissionsData instanceof Map) {
                submissionsData = Object.fromEntries(submissionsData);
            } else if (submissionsData && typeof submissionsData === 'object') {
                // Ensure it's a plain object
                submissionsData = { ...submissionsData };
            }
            
            // Filter out turnstile response from submissions
            if (submissionsData && Object.keys(submissionsData).length > 0) {
                // Only filter out cf-turnstile-response and captchaToken, preserve all other fields
                const { 'cf-turnstile-response': turnstileResponse, 'captchaToken': captchaToken, ...filteredSubmissions } = submissionsData;
                
                // Process employee fields to replace IDs with employee data
                const resolvedSubmissions = { ...filteredSubmissions };
                
                for (const [key, value] of Object.entries(resolvedSubmissions)) {
                    // Check if this field is an employee field and contains ObjectId pattern
                    if ((key.toLowerCase().includes('employee') || key.toLowerCase().endsWith('employee')) && 
                        typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
                        try {
                            const employee = await Employee.findById(value).select('name designation profile_photo');
                            if (employee) {
                                resolvedSubmissions[key] = `${employee.name} - ${employee.designation}`;
                            }
                        } catch (err) {
                            // If it's not a valid employee ID, keep the original value
                        }
                    }
                    // Check if this field is an employee rating field
                    else if (key.toLowerCase().includes('employee') && key.toLowerCase().includes('rating')) {
                        // This is an employee rating field, keep the value as is
                        // It will be a numeric rating value
                    }
                    // Check if this field is an image field and contains an S3 key
                    else if ((key.toLowerCase().includes('image') || key.toLowerCase().includes('photo') || 
                             key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.png')) && 
                             typeof value === 'string' && value.startsWith('form_submissions/')) {
                        try {
                            // Generate presigned URL for the image
                            const presignedUrl = await getPresignedUrl(value);
                            resolvedSubmissions[key] = presignedUrl;
                        } catch (err) {
                            console.error('Error generating presigned URL for image:', err);
                            // Keep the original S3 key if URL generation fails
                        }
                    }
                }
                
                processedData.submissions = resolvedSubmissions;
            } else {
                processedData.submissions = {}; // Ensure it's an empty object, not null
            }
            
            processedSubmissions.push(processedData);
        }
        
        res.status(200).json(processedSubmissions);
    } catch (error) {
        console.error('Error fetching submissions by form ID:', error);
        res.status(500).json({ message: "Server error. Unable to fetch submissions." });
    }
};

// Add this new function for admin to fetch submissions by form ID
export const getSubmissionsByFormIdAdmin = async (req, res) => {
    try {
        // Validate formId is a proper ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.formId)) {
            return res.status(400).json({ message: "Invalid form ID" });
        }
        
        const submissions = await Submission.find({ form_id: req.params.formId })
            .populate('form_id')
            .populate('user_id', 'name email'); // Populate user info for admin view
            
        // Process submissions to replace employee IDs with employee data
        const processedSubmissions = [];
        
        for (const submission of submissions) {
            const processedData = { ...submission.toObject() };
            
            // Convert MongoDB Map to plain object if needed
            let submissionsData = processedData.submissions;
            if (submissionsData && submissionsData instanceof Map) {
                submissionsData = Object.fromEntries(submissionsData);
            } else if (submissionsData && typeof submissionsData === 'object') {
                // Ensure it's a plain object
                submissionsData = { ...submissionsData };
            }
            
            // Filter out turnstile response from submissions
            if (submissionsData && Object.keys(submissionsData).length > 0) {
                // Only filter out cf-turnstile-response and captchaToken, preserve all other fields
                const { 'cf-turnstile-response': turnstileResponse, 'captchaToken': captchaToken, ...filteredSubmissions } = submissionsData;
                
                // Process employee fields to replace IDs with employee data
                const resolvedSubmissions = { ...filteredSubmissions };
                
                for (const [key, value] of Object.entries(resolvedSubmissions)) {
                    // Check if this field is an employee field and contains ObjectId pattern
                    if ((key.toLowerCase().includes('employee') || key.toLowerCase().endsWith('employee')) && 
                        typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
                        try {
                            const employee = await Employee.findById(value).select('name designation profile_photo');
                            if (employee) {
                                resolvedSubmissions[key] = `${employee.name} - ${employee.designation}`;
                            }
                        } catch (err) {
                            // If it's not a valid employee ID, keep the original value
                        }
                    }
                    // Check if this field is an employee rating field
                    else if (key.toLowerCase().includes('employee') && key.toLowerCase().includes('rating')) {
                        // This is an employee rating field, keep the value as is
                        // It will be a numeric rating value
                    }
                    // Check if this field is an image field and contains an S3 key
                    else if ((key.toLowerCase().includes('image') || key.toLowerCase().includes('photo') || 
                             key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.png')) && 
                             typeof value === 'string' && value.startsWith('form_submissions/')) {
                        try {
                            // Generate presigned URL for the image
                            const presignedUrl = await getPresignedUrl(value);
                            resolvedSubmissions[key] = presignedUrl;
                        } catch (err) {
                            console.error('Error generating presigned URL for image:', err);
                            // Keep the original S3 key if URL generation fails
                        }
                    }
                }
                
                processedData.submissions = resolvedSubmissions;
            } else {
                processedData.submissions = {}; // Ensure it's an empty object, not null
            }
            
            processedSubmissions.push(processedData);
        }
        
        res.status(200).json(processedSubmissions);
    } catch (error) {
        console.error("Error fetching submissions for admin:", error);
        res.status(500).json({ message: "Server error. Unable to fetch submissions." });
    }
};

// Create a response
export const createSubmission = async (req, res) => {
    // Handle both form data and regular JSON body
    let form_id, submissions, captchaToken, user_id;
    
    // If we have files, process them
    if (req.files && req.files.length > 0) {
        // Reject request if too many files
        if (req.files.length > 1) {  // Fixed: was checking for > 3 but error message said max 1
            return res.status(400).json({
                message: "Maximum 1 file allowed"
            });
        }
        // Process file uploads and add them to submissions
        submissions = {};
        
        // Add text fields from body
        for (const [key, value] of Object.entries(req.body)) {
            if (key === 'form_id') {
                form_id = value;
            } else if (key === 'captchaToken') {
                captchaToken = value;
            } else if (key === 'user_id') {
                user_id = value;
            } else {
                // Sanitize and validate field names to prevent injection
                if (typeof value === 'string' && value.length <= 10000) {  // Limit value length
                    // Only allow alphanumeric characters, spaces, hyphens, underscores in field names
                    const sanitizedKey = key.replace(/[^a-zA-Z0-9 _-]/g, '');
                    if (sanitizedKey && sanitizedKey.length <= 100) {  // Limit key length
                        submissions[sanitizedKey] = value;
                    }
                }
            }
        }
        
        // Process uploaded files
        for (const file of req.files) {
            try {
                // Generate a unique key for the file
                const key = generateSubmissionFileKey(form_id, file.fieldname, file.originalname);
                
                // Upload file to S3
                await uploadFileToS3(file.buffer, key, file.originalname);
                
                // Store the S3 key in submissions
                submissions[file.fieldname] = key;
            } catch (error) {
                console.error('Error uploading file:', error);
                return res.status(500).json({ message: "File upload failed" });
            }
        }
    } else {
        // Regular form submission without files
        ({ form_id, submissions, captchaToken } = req.body);
        // user_id is optional for public form submissions
        ({ user_id } = req.body);
    }

    try {
        // Validate form_id is a proper ObjectId
        if (!mongoose.Types.ObjectId.isValid(form_id)) {
            return res.status(400).json({ message: "Invalid form ID" });
        }
        
        // Verify the form exists and is active before accepting submission
        const form = await Form.findById(form_id);
        if (!form) {
            return res.status(404).json({ message: "Form not found" });
        }
        
        if (!form.is_active) {
            return res.status(403).json({ message: "Form is not active" });
        }
        
        if (form.is_locked) {
            return res.status(403).json({ message: "Form is locked and not accepting submissions" });
        }

        // 1. CAPTCHA verification Start
        if (!captchaToken) {
            return res.status(400).json({ message: "Captcha verification failed" });
        }
        const captchaResponse = await axios.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: captchaToken,
            }),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );

        if (!captchaResponse.data.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid captcha",
                errors: captchaResponse.data["error-codes"]
            });
        }
        // CAPTCHA verification End

        if (!form_id || !submissions) {
            return res.status(400).json({ message: "Missing required fields (form_id, submissions)." });
        }

        // For public submissions, user_id can be null or undefined
        // For authenticated submissions, user_id should be provided
        // The middleware (checkSubmissionLimit) handles form owner's subscription limits
        
        const newSubmission = new Submission({
            form_id,
            user_id: user_id || null, // Allow null for public submissions
            submissions,
        });

        const savedSubmission = await newSubmission.save();

        // Report to Polar Submissions meter (don't block on failure)
        try {
            const formOwnerId = form.user_id;
            await reportSubmissionCreation(formOwnerId, savedSubmission._id, form._id);
        } catch (meterError) {
            console.error('Error reporting submission to meter:', meterError);
            // Don't fail the submission if meter report fails
        }

        // Include form owner's usage information in response
        const responseData = {
            ...savedSubmission.toObject(),
            usageInfo: req.formOwner?.submissionUsage || null
        };

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ message: "Server error. Unable to save submission." });
    }
};

export const deleteSubmission = async (req, res) => {
    const { id } = req.params;

    try {
        // Validate submission ID is a proper ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid submission ID" });
        }
        
        // First, find the submission to check if user has permission to delete it
        const submission = await Submission.findById(id);
        if (!submission) {    
            return res.status(404).json({ message: "Submission not found." });
        }
        
        // Check if the authenticated user is the owner of the form
        // Get the form that this submission belongs to
        const form = await Form.findById(submission.form_id);
        if (!form) {
            return res.status(404).json({ message: "Associated form not found." });
        }
        
        // Verify that the authenticated user is the owner of the form
        if (form.user_id.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied. You can only delete submissions from your own forms." });
        }
        
        // User is authorized, proceed with deletion
        const deletedSubmission = await Submission.findByIdAndDelete(id);
        if (!deletedSubmission) {    
            return res.status(404).json({ message: "Submission not found." });
        }

        res.status(200).json({ message: "Submission deleted successfully." });
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ message: "Server error. Unable to delete submission." });
    }
};

// New function to get count of unread submissions for a user
export const getUnreadSubmissionsCount = async (req, res) => {
    const { id: userId } = req.params;

    try {
        // First, get all forms owned by this user
        const userForms = await Form.find({ user_id: userId }).select('_id');
        const formIds = userForms.map(form => form._id);

        // Then, get count of unread submissions for these forms
        const unreadCount = await Submission.countDocuments({ 
            form_id: { $in: formIds },
            is_read: false
        });

        res.status(200).json({ count: unreadCount });
    } catch (error) {
        console.error('Error fetching unread submissions count:', error);
        res.status(500).json({ message: "Server error. Unable to fetch unread submissions count." });
    }
};

// New function to mark submissions as read
export const markSubmissionsAsRead = async (req, res) => {
    const { id: userId } = req.params;

    try {
        // First, get all forms owned by this user
        const userForms = await Form.find({ user_id: userId }).select('_id');
        const formIds = userForms.map(form => form._id);

        // Then, mark all submissions for these forms as read
        const result = await Submission.updateMany(
            { 
                form_id: { $in: formIds },
                is_read: false
            },
            { 
                $set: { is_read: true }
            }
        );

        res.status(200).json({ 
            message: `${result.modifiedCount} submissions marked as read.`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking submissions as read:', error);
        res.status(500).json({ message: "Server error. Unable to mark submissions as read." });
    }
};

// New function to get count of unread submissions for a specific form
export const getUnreadSubmissionsCountByForm = async (req, res) => {
    const { formId } = req.params;

    try {
        // Validate formId is a proper ObjectId
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return res.status(400).json({ message: "Invalid form ID" });
        }
        
        // Get count of unread submissions for this specific form
        const unreadCount = await Submission.countDocuments({ 
            form_id: formId,
            is_read: false
        });

        res.status(200).json({ count: unreadCount });
    } catch (error) {
        console.error('Error fetching unread submissions count by form:', error);
        res.status(500).json({ message: "Server error. Unable to fetch unread submissions count." });
    }
};

// New function to mark submissions as read for a specific form
export const markSubmissionsAsReadByForm = async (req, res) => {
    const { formId } = req.params;

    try {
        // Validate formId is a proper ObjectId
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return res.status(400).json({ message: "Invalid form ID" });
        }
        
        // Mark all submissions for this form as read
        const result = await Submission.updateMany(
            { 
                form_id: formId,
                is_read: false
            },
            { 
                $set: { is_read: true }
            }
        );

        res.status(200).json({ 
            message: `${result.modifiedCount} submissions marked as read.`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking submissions as read by form:', error);
        res.status(500).json({ message: "Server error. Unable to mark submissions as read." });
    }
};
