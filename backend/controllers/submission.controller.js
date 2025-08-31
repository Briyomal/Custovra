import { Submission } from '../models/Submission.js';
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
        console.error("Error fetching submissions by user ID:", error);
        res.status(500).json({ message: "Server error. Unable to fetch submissions." });
    }
};

// Get all responses for a form
export const getSubmissionsByFormId = async (req, res) => {
    try {
        console.log(req.params);
        const submissions = await Submission.find({ form_id: req.params.formId });
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a response
export const createSubmission = async (req, res) => {
    const { form_id, user_id, submissions, captchaToken } = req.body;

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

        if (!form_id || !user_id || !submissions) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Note: Monthly submission limits are checked by middleware
        // The middleware adds req.submissionUsage with current usage info
        
        const newSubmission = new Submission({
            form_id,
            user_id,
            submissions,
        });

        const savedSubmission = await newSubmission.save();
        
        // Include usage information in response for frontend
        const responseData = {
            ...savedSubmission.toObject(),
            usageInfo: req.submissionUsage || null
        };
        
        res.status(201).json(responseData);
    } catch (error) {
        console.error("Error saving submission:", error);
        res.status(500).json({ message: "Server error. Unable to save submission." });
    }
};

export const deleteSubmission = async (req, res) => {
    const { id } = req.params;
    console.log(id);

    try {
        const deletedSubmission = await Submission.findByIdAndDelete(id);
        if (!deletedSubmission) {    
            return res.status(404).json({ message: "Submission not found." });
        }

        res.status(200).json({ message: "Submission deleted successfully." });
    } catch (error) {
        console.error("Error deleting submission:", error);
        res.status(500).json({ message: "Server error. Unable to delete submission." });
    }
};