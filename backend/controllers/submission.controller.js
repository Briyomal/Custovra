import { Submission } from '../models/Submission.js';
import { Form } from '../models/Form.js';
import { Employee } from '../models/Employee.js';
import axios from "axios";

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

// Create a response
export const createSubmission = async (req, res) => {
    const { form_id, submissions, captchaToken } = req.body;
    // user_id is optional for public form submissions
    let { user_id } = req.body;

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