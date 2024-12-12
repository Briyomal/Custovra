import { Submission } from '../models/Submission.js';

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
    const { form_id, user_id, submissions } = req.body;

    try {
        if (!form_id || !user_id || !submissions) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const newSubmission = new Submission({
            form_id,
            user_id,
            submissions,
        });

        const savedSubmission = await newSubmission.save();
        res.status(201).json(savedSubmission);
    } catch (error) {
        console.error("Error saving submission:", error);
        res.status(500).json({ message: "Server error. Unable to save submission." });
    }
};