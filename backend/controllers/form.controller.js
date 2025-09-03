// controllers/FormController.js
import { Form } from '../models/Form.js';
import { Submission } from "../models/Submission.js";
import { subscriptionPlans } from "../utils/subscriptionPlans.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import cloudinary from '../utils/cloudinary.js';

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
        // Form is already loaded and validated by checkFormAccessReadOnly middleware
        // We need to populate employee data manually since middleware doesn't do it
        const formId = req.form._id;
        const form = await Form.findById(formId)
            .populate({
                path: 'default_fields.employees',
                select: 'name designation profile_photo'
            })
            .populate({
                path: 'custom_fields.employees', 
                select: 'name designation profile_photo'
            });
            
        const isLocked = req.isFormLocked;
        
        // Add lock status to response if form is locked
        const responseData = {
            ...form.toObject(),
            isLocked,
            lockStatus: isLocked ? {
                lockedAt: form.lockedAt,
                lockReason: form.lockReason
            } : null
        };

        res.status(200).json(responseData);
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

        // Note: Form creation limits are now checked by middleware
        // The middleware adds req.userPlan with limit information
        // Create the form
        const form = new Form({
            user_id,
            form_name,
            form_note: form_note || "",
            form_type,
            form_description: form_description || "",
            google_link: google_link || "",
            is_active,
            form_link: '', // Temporary, will update after _id is generated
        });

        // Save to generate _id
        await form.save();

        form.form_link = `/view/${form._id}`;

        // Handle logo upload for new form
        if (req.file) {
            try {
                form.logo = req.file.path;        // Cloudinary image URL
                form.logo_id = req.file.filename; // public_id (used for deleting in future)
                console.log("Logo uploaded for new form:", req.file.path);
            } catch (err) {
                console.error("Error saving logo info:", err);
            }
        }

        // Parse fields
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

        // Filter and process default fields vs custom fields properly
        const defaultFieldNames = ['name', 'email', 'phone', 'rating', 'comment'];
        
        const processedDefaultFields = parsedDefaultFields.filter(field => 
            defaultFieldNames.includes(field.label.toLowerCase())
        ).map(field => ({
            field_name: field.label.toLowerCase(),
            field_type: field.type,
            is_required: field.isRequired,
            enabled: field.enabled,
            position: field.position,
            placeholder: field.placeholder || "",
            employees: field.employees || []
        }));
        
        const processedCustomFields = [...parsedDefaultFields.filter(field => 
            !defaultFieldNames.includes(field.label.toLowerCase())
        ), ...parsedCustomFields].map(field => ({
            field_name: field.label || "",
            field_type: field.type,
            is_required: field.isRequired,
            enabled: field.enabled,
            position: field.position,
            placeholder: field.placeholder || "",
            is_new: field.is_new || false,
            employees: field.employees || []
        }));

        form.default_fields = processedDefaultFields;
        form.custom_fields = processedCustomFields;

        // Save updated form
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

        // Form is already loaded and validated by checkFormAccess middleware
        const form = req.form;
        const formLink = `/view/${form._id}`;

        form.form_name = form_name || form.form_name;
        form.form_note = form_note || "";
        form.form_type = form_type;
        form.form_description = form_description || "";
        form.google_link = google_link || "";
        form.is_active = is_active !== undefined ? is_active : form.is_active;
        form.form_link = formLink;

        // Handle logo upload with improved error handling
        if (req.file) {
            // Delete old logo from Cloudinary if it exists
            if (form.logo_id) {
                try {
                    await cloudinary.uploader.destroy(form.logo_id);
                    console.log("Old logo removed from Cloudinary:", form.logo_id);
                } catch (err) {
                    console.error("Failed to delete old logo from Cloudinary:", err);
                    // Don't fail the entire operation if old logo deletion fails
                }
            }

            // Save new logo info with validation
            try {
                if (req.file.path && req.file.filename) {
                    form.logo = req.file.path;        // Cloudinary image URL
                    form.logo_id = req.file.filename; // public_id (used for deleting in future)
                    console.log("New logo saved:", {
                        url: req.file.path,
                        public_id: req.file.filename
                    });
                } else {
                    console.error("Invalid file data from Cloudinary:", req.file);
                }
            } catch (err) {
                console.error("Error saving new logo info:", err);
                return res.status(400).json({ message: "Failed to save logo. Please try again." });
            }
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

        // Filter and process default fields vs custom fields properly
        const defaultFieldNames = ['name', 'email', 'phone', 'rating', 'comment'];
        
        const processedDefaultFields = parsedDefaultFields.filter(field => 
            defaultFieldNames.includes(field.label.toLowerCase())
        ).map(field => ({
            field_name: field.label.toLowerCase(),
            field_type: field.type,
            is_required: field.isRequired,
            enabled: field.enabled,
            position: field.position,
            placeholder: field.placeholder || "",
            employees: field.employees || []
        }));
        
        const processedCustomFields = [...parsedDefaultFields.filter(field => 
            !defaultFieldNames.includes(field.label.toLowerCase())
        ), ...parsedCustomFields].map(field => ({
            field_name: field.label || "",
            field_type: field.type,
            is_required: field.isRequired,
            enabled: field.enabled,
            position: field.position,
            placeholder: field.placeholder || "",
            is_new: field.is_new || false,
            employees: field.employees || []
        }));

        form.default_fields = processedDefaultFields;
        form.custom_fields = processedCustomFields;

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
        // Form is already loaded and validated by checkFormAccess middleware
        const form = req.form;

        // Delete the logo from Cloudinary if it exists
        if (form.logo_id) {
            try {
                await cloudinary.uploader.destroy(form.logo_id);
                console.log("Logo deleted from Cloudinary:", form.logo_id);
            } catch (err) {
                console.error("Error deleting logo from Cloudinary:", err);
                // Don't fail the entire operation if logo deletion fails
            }
        }

        // Delete related submissions
        try {
            const deletedSubmissions = await Submission.deleteMany({ form_id: form._id });
            console.log(`${deletedSubmissions.deletedCount} related submissions deleted successfully.`);
        } catch (err) {
            console.error("Error deleting related submissions:", err);
        }

        // Delete the form itself
        await Form.deleteOne({ _id: form._id });
        console.log("Form deleted successfully:", form._id);

        return res.status(200).json({ 
            message: "Form and related data deleted successfully.",
            deletedFormId: form._id
        });
    } catch (error) {
        console.error("Error deleting form:", error);
        return res.status(500).json({ message: "An error occurred while deleting the form.", error: error.message });
    }
};

// Public form viewing endpoint - removes sensitive information
export const viewForm = async (req, res) => {
    try {
        const { id } = req.params;
        const form = await Form.findById(id)
            .populate({
                path: 'default_fields.employees',
                select: 'name designation profile_photo'
            })
            .populate({
                path: 'custom_fields.employees', 
                select: 'name designation profile_photo'
            });
            
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }
        
        // Remove sensitive information for public viewing
        // SECURITY: Never expose user_id, logo_id, or internal form_link to public users
        const publicFormData = {
            _id: form._id,
            form_name: form.form_name,
            form_note: form.form_note,
            form_type: form.form_type,
            form_description: form.form_description,
            is_active: form.is_active,
            logo: form.logo,
            google_link: form.google_link,
            default_fields: form.default_fields,
            custom_fields: form.custom_fields,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt
            // Explicitly exclude: user_id, logo_id, form_link
        };
        
        res.status(200).json(publicFormData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

