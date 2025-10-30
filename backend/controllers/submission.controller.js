import { Submission } from '../models/Submission.js';
import { Form } from '../models/Form.js';
import { Employee } from '../models/Employee.js';
import axios from "axios";
// Add S3 utilities import
import { uploadFileToS3, getPresignedUrl } from '../utils/s3.js';

// Create a helper function to generate a unique key for submission files
const generateSubmissionFileKey = (formId, fieldName, originalname) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `form_submissions/${formId}/${fieldName}_${timestamp}_${randomString}_${originalname}`;
};

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
                        typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
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
        res.status(500).json({ message: "Server error. Unable to fetch submissions." });
    }
};

// Get all responses for a form
export const getSubmissionsByFormId = async (req, res) => {
    try {
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
                        typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
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
        res.status(500).json({ error: error.message });
    }
};

// Add this new function for admin to fetch submissions by form ID
export const getSubmissionsByFormIdAdmin = async (req, res) => {
    try {
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
                        typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
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
        res.status(500).json({ message: "Server error. Unable to fetch submissions.", error: error.message });
    }
};

// Create a response
export const createSubmission = async (req, res) => {
    // Handle both form data and regular JSON body
    let form_id, submissions, captchaToken, user_id;
    
    // If we have files, process them
    if (req.files && req.files.length > 0) {
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
                submissions[key] = value;
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
                // Continue processing other files even if one fails
            }
        }
    } else {
        // Regular form submission without files
        ({ form_id, submissions, captchaToken } = req.body);
        // user_id is optional for public form submissions
        ({ user_id } = req.body);
    }

    try {
        
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
        
        // Include form owner's usage information in response
        const responseData = {
            ...savedSubmission.toObject(),
            usageInfo: req.formOwner?.submissionUsage || null
        };
        
        res.status(201).json(responseData);
    } catch (error) {
        res.status(500).json({ message: "Server error. Unable to save submission." });
    }
};

export const deleteSubmission = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedSubmission = await Submission.findByIdAndDelete(id);
        if (!deletedSubmission) {    
            return res.status(404).json({ message: "Submission not found." });
        }

        res.status(200).json({ message: "Submission deleted successfully." });
    } catch (error) {
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
        res.status(500).json({ message: "Server error. Unable to mark submissions as read." });
    }
};

// New function to get count of unread submissions for a specific form
export const getUnreadSubmissionsCountByForm = async (req, res) => {
    const { formId } = req.params;

    try {
        // Get count of unread submissions for this specific form
        const unreadCount = await Submission.countDocuments({ 
            form_id: formId,
            is_read: false
        });

        res.status(200).json({ count: unreadCount });
    } catch (error) {
        res.status(500).json({ message: "Server error. Unable to fetch unread submissions count." });
    }
};

// New function to mark submissions as read for a specific form
export const markSubmissionsAsReadByForm = async (req, res) => {
    const { formId } = req.params;

    try {
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
        res.status(500).json({ message: "Server error. Unable to mark submissions as read." });
    }
};
