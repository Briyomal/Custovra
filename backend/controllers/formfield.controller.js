// controllers/FormFieldController.js
import { FormField } from '../models/FormField.js';

// Get all form fields
export const getAllFormFields = async (req, res) => {
    try {
        const formFields = await FormField.find();
        res.status(200).json(formFields);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create form fields
export const createFormField = async (req, res) => {
    try {
        const newFormField = new FormField(req.body);
        await newFormField.save();
        res.status(201).json(newFormField);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
