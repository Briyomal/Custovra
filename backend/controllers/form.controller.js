// controllers/FormController.js
import { Form } from '../models/Form.js';
import { FormField } from '../models/FormField.js';
import { Submission } from "../models/Submission.js";
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import cloudinary from '../utils/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        const { id } = req.params; // Form ID from the URL
        const userId = req.userId; // Get userId from the body (or use req.user if authenticated)

        // Ensure userId is provided, if not, return an error
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find the form by formId and ensure that the user_id matches the userId provided in the request
        const form = await Form.findOne({ _id: id, user_id: userId })
            .populate('user_id', '_id');

        if (!form) {
            return res.status(404).json({ message: 'Form not found.' });
        }

        res.status(200).json(form);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const getFormsByUserId = async (req, res) => {
    try {
        console.log(req.params); // Log to verify the structure of req.params
        const userId = req.params.id; // Extract the `id` field from req.params
        const forms = await Form.find({ user_id: userId }); // Query using userId

        if (!forms.length) {
            return res.status(404).json({ message: 'No forms found for user', userId });
        }

        res.status(200).json(forms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new form
export const createForm = async (req, res) => {
    try {
        const user_id = req.body.user_id || req.userId;
        const {
            form_name,
            form_note,
            form_type,
            form_description,
            google_link,
            is_active,
            default_fields,
            custom_fields
        } = req.body;

        // Validate required fields
        if (!user_id || !form_name || !form_type) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const form = new Form({
            user_id,
            form_name,
            form_note,
            form_type,
            form_description,
            google_link,
            is_active,
            form_link: '', // Temporary, will update after _id is generated
        });

        // Save to get form._id
        await form.save();

        const formLink = `/view/${form._id}`;
        form.form_link = formLink;

        // Parse and handle default_fields and custom_fields
        let parsedDefaultFields = [];
        let parsedCustomFields = [];

        if (default_fields) {
            try {
                parsedDefaultFields = JSON.parse(default_fields);
            } catch (err) {
                return res.status(400).json({ message: "Invalid default_fields format." });
            }
        }

        if (custom_fields) {
            try {
                parsedCustomFields = JSON.parse(custom_fields);
            } catch (err) {
                return res.status(400).json({ message: "Invalid custom_fields format." });
            }
        }

        form.default_fields = parsedDefaultFields.map(field => ({
            field_name: field.label.toLowerCase(),
            field_type: field.type,
            is_required: field.isRequired,
            enabled: field.enabled,
            position: field.position,
            placeholder: field.placeholder,
        }));

        form.custom_fields = parsedCustomFields.map(field => ({
            field_name: field.label,
            field_type: field.type,
            is_required: field.isRequired,
            enabled: field.enabled,
            position: field.position,
            placeholder: field.placeholder,
            is_new: field.is_new || false,
        }));

        // Save updated fields and form_link
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


export const updateForm = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            form_name,
            form_note,
            form_type,
            form_description,
            google_link,
            is_active,
            logo,
            default_fields,
            custom_fields
        } = req.body;


        if (!form_name || !form_type) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const form = await Form.findOne({ _id: id, user_id: req.userId });
        if (!form) {
            return res.status(404).json({ message: "Form not found or unauthorized access." });
        }

        const formLink = `/view/${id}`;

        form.form_name = form_name || form.form_name;
        form.form_note = form_note;
        form.form_type = form_type;
        form.form_description = form_description;
        form.google_link = google_link;
        form.is_active = is_active !== undefined ? is_active : form.is_active;
        form.form_link = formLink;

        // Handle logo upload
        if (req.file) {
            // Delete old logo from Cloudinary if it exists
            if (form.logo_id) {
                try {
                    await cloudinary.uploader.destroy(form.logo_id);
                    console.log("Old logo removed from Cloudinary.");
                } catch (err) {
                    console.error("Failed to delete old logo from Cloudinary:", err);
                }
            }

            // Save new logo info
            form.logo = req.file.path;        // Cloudinary image URL
            form.logo_id = req.file.filename; // public_id (used for deleting in future)
        }

        let parsedDefaultFields = [];
        let parsedCustomFields = [];

        if (default_fields) {
            try {
                parsedDefaultFields = JSON.parse(default_fields);
            } catch (error) {
                return res.status(400).json({ message: "Invalid default_fields format." });
            }
        }

        if (custom_fields) {
            try {
                parsedCustomFields = JSON.parse(custom_fields);
            } catch (error) {
                return res.status(400).json({ message: "Invalid custom_fields format." });
            }
        }

        form.default_fields = parsedDefaultFields.map(field => ({
            field_name: field.label.toLowerCase(),
            field_type: field.type,
            is_required: field.isRequired,
            enabled: field.enabled,
            position: field.position,
            placeholder: field.placeholder,
        }));

        form.custom_fields = parsedCustomFields.map(field => ({
            field_name: field.label,
            field_type: field.type,
            is_required: field.isRequired,
            enabled: field.enabled,
            position: field.position,
            placeholder: field.placeholder,
            is_new: field.is_new || false,
        }));

        console.log("Custom fields test:", form.custom_fields);

        await form.save();

        return res.status(200).json({
            message: "Form updated successfully.",
            form,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred.", error });
    }
};


// Delete a form
export const deleteForm = async (req, res) => {
    try {
        const { id } = req.params; // Form ID from URL parameters

        // Find the form by its ID and ensure it belongs to the current user
        const form = await Form.findOne({ _id: id, user_id: req.userId });
        if (!form) {
            return res.status(404).json({ message: "Form not found or unauthorized access." });
        }

        // ✅ Delete the logo from Cloudinary if it exists
        if (form.logo_id) {
            try {
                await cloudinary.uploader.destroy(form.logo_id);
                console.log("Logo deleted from Cloudinary.");
            } catch (err) {
                console.error("Error deleting logo from Cloudinary:", err);
            }
        }

        // Delete related custom fields
        await FormField.deleteMany({ form_id: id });
        console.log("Related custom fields deleted successfully.");

        // Delete related submissions
        await Submission.deleteMany({ form_id: id });
        console.log("Related submissions deleted successfully.");


        // Delete the form itself
        await Form.deleteOne({ _id: id });
        console.log("Form deleted successfully.");

        return res.status(200).json({ message: "Form and related data deleted successfully." });
    } catch (error) {
        console.error("Error deleting form:", error);
        return res.status(500).json({ message: "An error occurred.", error });
    }
};

export const viewForm = async (req, res) => {
    try {
        const { id } = req.params;
        const form = await Form.findById(id);
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }
        res.status(200).json(form);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

