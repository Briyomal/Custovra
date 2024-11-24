import { Response } from '../models/Response.js';

// Get all responses for a form
export const getResponsesForForm = async (req, res) => {
    try {
        const responses = await Response.find({ form_id: req.params.formId });
        res.status(200).json(responses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a response
export const createResponse = async (req, res) => {
    try {
        const newResponse = new Response(req.body);
        await newResponse.save();
        res.status(201).json(newResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};