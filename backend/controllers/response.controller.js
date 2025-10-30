import { Response } from '../models/Response.js';
import { Form } from '../models/Form.js';

// Get all responses for a form (only if user owns the form)
export const getResponsesForForm = async (req, res) => {
    try {
        const userId = req.userId; // From verifyToken middleware
        const { formId } = req.params;
        
        // SECURITY: Verify form ownership before showing responses
        const form = await Form.findById(formId);
        if (!form) {
            return res.status(404).json({ 
                success: false, 
                error: "Form not found" 
            });
        }
        
        if (form.user_id.toString() !== userId.toString()) {
            return res.status(403).json({ 
                success: false, 
                error: "Access denied. You can only view responses for your own forms." 
            });
        }
        
        const responses = await Response.find({ form_id: formId });
        res.status(200).json(responses);
    } catch (error) {
        console.error("Error fetching responses:", error);
        res.status(500).json({ error: "Server error. Unable to fetch responses." });
    }
};

// Create a response (should be public for form submissions)
export const createResponse = async (req, res) => {
    try {
        const { form_id } = req.body;
        
        // SECURITY: Verify form exists and is active
        const form = await Form.findById(form_id);
        if (!form) {
            return res.status(404).json({ 
                success: false, 
                error: "Form not found" 
            });
        }
        
        if (!form.is_active) {
            return res.status(403).json({ 
                success: false, 
                error: "Form is no longer accepting responses" 
            });
        }
        
        const newResponse = new Response(req.body);
        await newResponse.save();
        res.status(201).json(newResponse);
    } catch (error) {
        console.error("Error creating response:", error);
        res.status(400).json({ error: "Failed to create response." });
    }
};