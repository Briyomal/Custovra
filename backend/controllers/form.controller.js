// controllers/FormController.js
import { Form } from '../models/Form.js';
import { FormField } from '../models/FormField.js';

// Get all forms
export const getAllForms = async (req, res) => {
    try {
        const forms = await Form.find().populate('user_id');
        res.status(200).json(forms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllUserForms = async (req, res) => {
    try {
        // `req.user` should have the user's ID set by the `verifyToken` middleware
        const userId = req.userId; 

        // Fetch all forms related to the logged-in user
        const forms = await Form.find({ user_id: userId }).populate('user_id');

        if (!forms.length) {
            return res.status(404).json({ message: 'No forms found for the user' });
        }

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
        const user_id = req.userId;
        const { form_name, form_description, form_type, fields } = req.body;
        console.log("User ID:", user_id);
        console.log("Form Name:", form_name);
        console.log("Form Type:", form_type);
        // Validate required fields
        if (!user_id || !form_name || !form_type) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Create the Form document
        const form = new Form({
            user_id,
            form_name,
            form_description,
            form_type,
        });

        // Save the form to generate the _id
        await form.save();

        // Handle the fields
        const fieldIds = [];
        if (fields && fields.length > 0) {
            for (const field of fields) {
                const { field_name, field_type, is_required } = field;

                // Validate field structure
                if (!field_name || !field_type) {
                    return res.status(400).json({ message: "Invalid field data." });
                }

                // Create FormField documents
                const formField = new FormField({
                    form_id: form._id,
                    field_name,
                    field_type,
                    is_required,
                });

                await formField.save();
                fieldIds.push(formField._id);
            }
        }

        // Update the Form document with field IDs
        form.fields = fieldIds;
        await form.save();

        return res.status(201).json({
            message: "Form created successfully.",
            form,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred.", error });
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
