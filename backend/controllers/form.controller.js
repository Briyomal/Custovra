// controllers/FormController.js
import { Form } from '../models/Form.js';

// Get all forms
export const getAllForms = async (req, res) => {
    try {
        const forms = await Form.find().populate('user_id');
        res.status(200).json(forms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a form by ID
export const getFormById = async (req, res) => {
    try {
        const form = await Form.findById(req.params.id).populate('user_id');
        if (!form) return res.status(404).json({ message: 'Form not found' });
        res.status(200).json(form);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new form
export const createForm = async (req, res) => {
    try {
        const newForm = new Form(req.body);
        await newForm.save();
        res.status(201).json(newForm);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a form
export const updateForm = async (req, res) => {
    try {
        const updatedForm = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedForm) return res.status(404).json({ message: 'Form not found' });
        res.status(200).json(updatedForm);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a form
export const deleteForm = async (req, res) => {
    try {
        const deletedForm = await Form.findByIdAndDelete(req.params.id);
        if (!deletedForm) return res.status(404).json({ message: 'Form not found' });
        res.status(200).json({ message: 'Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
