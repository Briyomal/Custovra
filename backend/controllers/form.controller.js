// controllers/FormController.js
import { Form } from '../models/Form.js';
import { Submission } from "../models/Submission.js";
import { subscriptionPlans } from "../utils/subscriptionPlans.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
// Replace Cloudinary with S3 utilities
import { deleteFileFromS3, getPresignedUrl, uploadFileToS3, generateFormLogoKey } from '../utils/s3.js';

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
        
        // Add presigned URLs for logos
        const formsWithPresignedUrls = await Promise.all(forms.map(async (form) => {
            const formObject = form.toObject();
            if (formObject.logo) {
                try {
                    formObject.logo = await getPresignedUrl(formObject.logo);
                } catch (error) {
                    console.error("Error generating presigned URL for logo:", error);
                    // Fallback to stored URL if presigned URL generation fails
                    formObject.logo = formObject.logo || null;
                }
            }
            return formObject;
        }));

        res.status(200).json(formsWithPresignedUrls);
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
        
        // Convert form to object and add presigned URL for logo if it exists
        const formObject = form.toObject();
        
        if (formObject.logo) {
            try {
                formObject.logo = await getPresignedUrl(formObject.logo);
            } catch (error) {
                console.error("Error generating presigned URL for logo:", error);
                // Fallback to stored URL if presigned URL generation fails
                formObject.logo = formObject.logo || null;
            }
        }
        
        // Add lock status to response if form is locked
        const responseData = {
            ...formObject,
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
        
        // Add presigned URLs for logos
        const formsWithPresignedUrls = await Promise.all(forms.map(async (form) => {
            const formObject = form.toObject();
            if (formObject.logo) {
                try {
                    formObject.logo = await getPresignedUrl(formObject.logo);
                } catch (error) {
                    console.error("Error generating presigned URL for logo:", error);
                    // Fallback to stored URL if presigned URL generation fails
                    formObject.logo = formObject.logo || null;
                }
            }
            return formObject;
        }));

        res.status(200).json(formsWithPresignedUrls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all forms for admin panel with user data for filtering
export const getAllFormsForAdmin = async (req, res) => {
    try {
        // Fetch all forms and populate user information
        const forms = await Form.find().populate('user_id', 'name email');
        
        // Format forms for admin panel
        const formattedForms = forms.map(form => {
            const formObject = form.toObject();
            return {
                _id: formObject._id,
                form_name: formObject.form_name,
                form_type: formObject.form_type,
                form_note: formObject.form_note,
                is_active: formObject.is_active,
                created_at: formObject.created_at,
                // Fix the form link to include /forms/view/ path
                form_link: `/forms/view/${formObject._id}`,
                user: {
                    name: formObject.user_id?.name || 'N/A',
                    email: formObject.user_id?.email || 'N/A'
                }
            };
        });

        res.status(200).json(formattedForms);
    } catch (error) {
        console.error("Error fetching forms for admin:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get a form by ID for admin without access restrictions
export const getFormByIdAdmin = async (req, res) => {
    try {
        const formId = req.params.id;
        
        // Fetch the form by ID and populate user information
        const form = await Form.findById(formId).populate('user_id', 'name email');
            
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }
        
        // Convert form to object and add presigned URL for logo if it exists
        const formObject = form.toObject();
        
        if (formObject.logo) {
            try {
                formObject.logo = await getPresignedUrl(formObject.logo);
            } catch (error) {
                console.error("Error generating presigned URL for logo:", error);
                // Fallback to stored URL if presigned URL generation fails
                formObject.logo = formObject.logo || null;
            }
        }
        
        // Format form for admin panel
        const formattedForm = {
            _id: formObject._id,
            form_name: formObject.form_name,
            form_type: formObject.form_type,
            form_note: formObject.form_note,
            is_active: formObject.is_active,
            created_at: formObject.created_at,
            form_link: `/forms/view/${formObject._id}`,
            user: {
                name: formObject.user_id?.name || 'N/A',
                email: formObject.user_id?.email || 'N/A'
            }
        };

        res.status(200).json(formattedForm);
    } catch (error) {
        console.error("Error fetching form for admin:", error);
        res.status(500).json({ error: error.message });
    }
};

// Add this new function to fetch all users for admin forms page
export const getAllUsersForFormsFilter = async (req, res) => {
    try {
        // Fetch all users with only name and email fields
        const users = await User.find({}, 'name email');
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users for forms filter:", error);
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

        // Fix the form link to include /forms/view/ path for consistency
        form.form_link = `/forms/view/${form._id}`;

        // Handle logo upload for new form
        if (req.file) {
            try {
                // Generate consistent key for this form
                const key = generateFormLogoKey(form._id.toString(), req.file.originalname);
                
                // Upload file with the consistent key (this will overwrite if exists)
                await uploadFileToS3(req.file.buffer, key, req.file.originalname);
                
                form.logo = key;     // S3 object key (used for generating presigned URLs)
                console.log("Logo uploaded for new form:", key);
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
        const defaultFieldNames = ['name', 'email', 'phone', 'rating', 'comment', 'image'];
        
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
            custom_fields,
            remove_logo
        } = req.body;

        if (!form_name || !form_type) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Form is already loaded and validated by checkFormAccess middleware
        const form = req.form;
        // Fix the form link to include /forms/view/ path for consistency
        const formLink = `/forms/view/${form._id}`;

        form.form_name = form_name || form.form_name;
        form.form_note = form_note || "";
        form.form_type = form_type;
        form.form_description = form_description || "";
        form.google_link = google_link || "";
        form.is_active = is_active !== undefined ? is_active : form.is_active;
        form.form_link = formLink;

        // Handle logo removal
        if (remove_logo === 'true' && form.logo) {
            try {
                // Delete the logo from S3
                await deleteFileFromS3(form.logo);
                console.log("Logo deleted from S3:", form.logo);
            } catch (err) {
                console.error("Error deleting logo from S3:", err);
                // Don't fail the operation if we can't delete the logo
                // Just log the error and continue
            }
            
            // Remove logo reference from form
            form.logo = "";
        }
        // Handle logo upload with improved error handling
        else if (req.file) {
            try {
                // If there's an existing logo, delete it first
                if (form.logo) {
                    try {
                        await deleteFileFromS3(form.logo);
                        console.log("Old logo deleted from S3:", form.logo);
                    } catch (err) {
                        console.error("Error deleting old logo from S3:", err);
                        // Continue even if old logo deletion fails
                    }
                }
                
                // Generate consistent key for this form
                const key = generateFormLogoKey(form._id.toString(), req.file.originalname);
                
                // Upload file with the consistent key (this will overwrite the existing file)
                const s3Result = await uploadFileToS3(req.file.buffer, key, req.file.originalname);
                
                form.logo = s3Result.key;     // S3 object key (used for generating presigned URLs)
                console.log("Logo updated for form:", s3Result.key);
            } catch (err) {
                console.error("Error saving logo info:", err);
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

        // Generate presigned URL for the logo if it exists
        let logoUrl = null;
        if (form.logo) {
            try {
                logoUrl = await getPresignedUrl(form.logo);
            } catch (error) {
                console.error("Error generating presigned URL for logo:", error);
                // Fallback to stored key if presigned URL generation fails
                logoUrl = form.logo;
            }
        }

        return res.status(200).json({
            message: "Form updated successfully.",
            form: {
                ...form.toObject(),
                logo: logoUrl || form.logo
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred.", error });
    }
};

// Delete a form's logo
export const deleteFormLogo = async (req, res) => {
    try {
        // Form is already loaded and validated by checkFormAccess middleware
        const form = req.form;

        // Check if form has a logo
        if (!form.logo) {
            return res.status(404).json({ message: "Form does not have a logo." });
        }

        // Delete the logo from S3
        try {
            await deleteFileFromS3(form.logo);
            console.log("Logo deleted from S3:", form.logo);
        } catch (err) {
            console.error("Error deleting logo from S3:", err);
            // Don't fail the operation if we can't delete the logo
            // Just log the error and continue
        }

        // Remove logo reference from form
        form.logo = "";
        await form.save();

        return res.status(200).json({ 
            message: "Form logo deleted successfully.",
            form: {
                ...form.toObject(),
                logo: null
            }
        });
    } catch (error) {
        console.error("Error deleting form logo:", error);
        return res.status(500).json({ message: "An error occurred while deleting the form logo.", error: error.message });
    }
};

// Delete a form
export const deleteForm = async (req, res) => {
    try {
        // Form is already loaded and validated by checkFormAccess middleware
        const form = req.form;

        // Delete the logo from S3 if it exists
        if (form.logo) {
            try {
                await deleteFileFromS3(form.logo);
                console.log("Logo deleted from S3:", form.logo);
            } catch (err) {
                console.error("Error deleting logo from S3:", err);
                // Don't fail the entire operation if logo deletion fails
                // Just log the error and continue
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
        
        // Convert form to object and add presigned URL for logo if it exists
        const formObject = form.toObject();
        
        if (formObject.logo) {
            try {
                formObject.logo = await getPresignedUrl(formObject.logo);
            } catch (error) {
                console.error("Error generating presigned URL for logo:", error);
                // Fallback to stored URL if presigned URL generation fails
                formObject.logo = formObject.logo || null;
            }
        }
        
        // Remove sensitive information for public viewing
        // SECURITY: Never expose user_id or internal form_link to public users
        const publicFormData = {
            _id: formObject._id,
            form_name: formObject.form_name,
            form_note: formObject.form_note,
            form_type: formObject.form_type,
            form_description: formObject.form_description,
            is_active: formObject.is_active,
            logo: formObject.logo,
            google_link: formObject.google_link,
            default_fields: formObject.default_fields,
            custom_fields: formObject.custom_fields,
            createdAt: formObject.createdAt,
            updatedAt: formObject.updatedAt
            // Explicitly exclude: user_id, form_link
        };
        
        res.status(200).json(publicFormData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};