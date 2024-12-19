// controllers/FormController.js
import { Form } from '../models/Form.js';
import { FormField } from '../models/FormField.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

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
        // Populate only the `_id` field of the `user_id`
        const form = await Form.findById(req.params.id)
            .populate('user_id', '_id');

        if (!form) {
            return res.status(404).json({ message: 'Form not found for user ID', userId: req.params.id });
        }

        res.status(200).json(form);
    } catch (error) {
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
    try {;
        const user_id = req.body.user_id || req.userId;
        const { form_name, form_note, form_type, fields } = req.body;
        // Validate required fields
        if (!user_id || !form_name || !form_type) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Create the Form document
        const form = new Form({
            user_id,
            form_name,
            form_note,
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

export const updateForm = async (req, res) => {
    try {
        const { id } = req.params; // Form ID from URL parameters
        const { form_name, form_note, form_type, fields, form_description, is_active, logo } = req.body;

        console.log("Received form data:", req.body);

        // Validate required fields
        if (!form_name || !form_type) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Find the form by its ID and ensure it belongs to the current user
        const form = await Form.findOne({ _id: id, user_id: req.userId });
        if (!form) {
            return res.status(404).json({ message: "Form not found or unauthorized access." });
        }
        
        const formLink = `/view/${id}`;

        // Update basic form fields
        form.form_name = form_name || form.form_name;
        form.form_note = form_note;
        form.form_type = form_type;
        form.form_description = form_description;
        form.is_active = is_active !== undefined ? is_active : form.is_active;
        form.form_link = formLink || form.form_link;    

        // Handle logo upload
        if (req.file) {
            if (form.logo) { // Check if a logo exists in the database
                const oldLogoPath = path.join(__dirname, '../../backend', form.logo);
                console.log("Attempting to delete old logo at:", oldLogoPath);
            
                try {
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlinkSync(oldLogoPath);
                        console.log("Old logo deleted successfully.");
                    } else {
                        console.log("Old logo does not exist at:", oldLogoPath);
                    }
                } catch (error) {
                    console.error("Error deleting old logo:", error);
                }
            } else {
                console.log("No old logo found in the database to delete.");
            }
        
            form.logo = req.savedFilePath; // Update the form with the new logo
        }

        // Parse and handle fields
        let parsedFields = [];
        if (fields) {
            try {
                parsedFields = JSON.parse(fields);
            } catch (error) {
                return res.status(400).json({ message: "Invalid fields format. Must be a valid JSON string." });
            }
        }

        if (parsedFields.length > 0) {
            const defaultFields = [];
            const customFields = [];

            for (const field of parsedFields) {
                if (["name", "email", "phone", "rating", "comment"].includes(field.label.toLowerCase())) {
                    // Default field
                    defaultFields.push({
                        field_name: field.label.toLowerCase(),
                        field_type: field.type,
                        is_required: field.isRequired,
                        enabled: field.enabled,
                        position: field.position,
                        placeholder: field.placeholder,
                    });
                } else {
                    // Custom field
                    if (!field.label || !field.type) {
                        return res.status(400).json({ message: "Invalid custom field data." });
                    }
                    customFields.push({
                        form_id: id,
                        field_name: field.label,
                        field_type: field.type,
                        is_required: field.isRequired,
                        enabled: field.enabled,
                        position: field.position,
                        placeholder: field.placeholder,
                    });
                }
            }

            // Update default fields
            form.default_fields = defaultFields;

            // Clear existing custom fields and recreate them
            await FormField.deleteMany({ form_id: id });
            const customFieldDocuments = await FormField.insertMany(customFields);

            // Update references to custom fields
            const customFieldIds = customFieldDocuments.map((field) => field._id);
            form.fields = customFieldIds;
            form.custom_fields = customFieldIds;
        }

        // Save the updated form
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

        // Delete the logo from file storage if it exists
        if (form.logo) {
            const logoPath = path.join(__dirname, '../../backend', form.logo);
            try {
                if (fs.existsSync(logoPath)) {
                    fs.unlinkSync(logoPath);
                    console.log("Logo deleted successfully.");
                } else {
                    console.log("Logo does not exist at:", logoPath);
                }
            } catch (error) {
                console.error("Error deleting logo:", error);
            }
        }

        // Delete related custom fields
        await FormField.deleteMany({ form_id: id });
        console.log("Related custom fields deleted successfully.");

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

