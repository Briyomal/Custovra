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

        // Remove the 404 error when no forms are found - return empty array instead
        if (!forms.length) {
            return res.status(200).json([]); // Return empty array instead of 404
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

        // Remove the 404 error when no forms are found - return empty array instead
        if (!forms.length) {
            return res.status(200).json([]); // Return empty array instead of 404
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
                // Support both createdAt (new format) and created_at (old format)
                created_at: formObject.createdAt || formObject.created_at,
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
            // Support both createdAt (new format) and created_at (old format)
            created_at: formObject.createdAt || formObject.created_at,
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
            employees: field.employees || [],
            hasEmployeeRating: field.hasEmployeeRating !== undefined ? field.hasEmployeeRating : false
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
            employees: field.employees || [],
            hasEmployeeRating: field.hasEmployeeRating !== undefined ? field.hasEmployeeRating : false
        }));

        form.default_fields = processedDefaultFields;
        form.custom_fields = processedCustomFields;

        // Save updated form with correct form_link
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
        console.log("FormController: updateForm called");
        console.log("FormController: Request body:", req.body);
        console.log("FormController: Request files:", req.files);
        
        // Form is already loaded and validated by checkFormAccess middleware
        const form = req.form;
        
        // Extract fields from request body
        let { 
            form_name, 
            form_note, 
            form_type, 
            form_description, 
            google_link, 
            is_active,
            default_fields,
            custom_fields
        } = req.body;

        console.log("FormController: Parsed fields:", { default_fields, custom_fields });

        // Parse default_fields and custom_fields if they are strings
        let parsedDefaultFields = [];
        let parsedCustomFields = [];

        if (default_fields) {
            try {
                parsedDefaultFields = JSON.parse(default_fields);
                console.log("FormController: Parsed default fields:", parsedDefaultFields);
            } catch (error) {
                return res.status(400).json({ message: "Invalid default_fields format." });
            }
        }

        if (custom_fields) {
            try {
                parsedCustomFields = JSON.parse(custom_fields);
                console.log("FormController: Parsed custom fields:", parsedCustomFields);
            } catch (error) {
                return res.status(400).json({ message: "Invalid custom_fields format." });
            }
        }

        // Update form properties if provided
        if (form_name !== undefined) form.form_name = form_name;
        if (form_note !== undefined) form.form_note = form_note;
        if (form_type !== undefined) form.form_type = form_type;
        if (form_description !== undefined) form.form_description = form_description;
        if (google_link !== undefined) form.google_link = google_link;
        if (is_active !== undefined) form.is_active = is_active;

        // Handle logo removal
        if (req.body.remove_logo === "true") {
            // Delete the logo from S3 if it exists
            if (form.logo) {
                try {
                    await deleteFileFromS3(form.logo);
                    console.log("FormController: Logo deleted from S3:", form.logo);
                } catch (err) {
                    console.error("FormController: Error deleting logo from S3:", err);
                    // Don't fail the operation if we can't delete the logo
                    // Just log the error and continue
                }
            }
            form.logo = ""; // Clear the logo reference
        }

        // Handle image upload
        if (req.files && req.files.image) {
            const image = req.files.image;
            
            // Validate file type and size
            const validTypes = ["image/jpeg", "image/jpg", "image/png"];
            const maxSize = 1024 * 1024; // 1MB

            if (!validTypes.includes(image.mimetype)) {
                return res.status(400).json({ message: "Only JPG, JPEG, and PNG files are allowed." });
            }

            if (image.size > maxSize) {
                return res.status(400).json({ message: "Image size should not exceed 1MB." });
            }

            // Delete the old logo from S3 if it exists
            if (form.logo) {
                try {
                    await deleteFileFromS3(form.logo);
                    console.log("FormController: Old logo deleted from S3:", form.logo);
                } catch (err) {
                    console.error("FormController: Error deleting old logo from S3:", err);
                    // Don't fail the operation if we can't delete the old logo
                    // Just log the error and continue
                }
            }

            // Upload new logo to S3
            try {
                const key = `form_logos/${form._id}_${Date.now()}_${image.originalname}`;
                const url = await uploadFileToS3(image.buffer, key, image.mimetype);
                form.logo = key; // Store the key, not the URL
                console.log("FormController: New logo uploaded to S3:", key);
            } catch (err) {
                console.error("FormController: Error uploading logo to S3:", err);
                return res.status(500).json({ message: "Error uploading logo." });
            }
        }

        // Filter and process default fields vs custom fields properly
        const defaultFieldNames = ['name', 'email', 'phone', 'rating', 'comment'];
        
        const processedDefaultFields = parsedDefaultFields.filter(field => 
            defaultFieldNames.includes(field.label.toLowerCase())
        ).map(field => {
            const processedField = {
                field_name: field.label.toLowerCase(),
                field_type: field.type,
                is_required: field.isRequired,
                enabled: field.enabled,
                position: field.position,
                placeholder: field.placeholder || "",
                employees: field.employees || [],
                hasEmployeeRating: field.hasEmployeeRating !== undefined ? field.hasEmployeeRating : false
            };
            console.log("FormController: Processed default field:", field.label, processedField);
            return processedField;
        });
        
        const processedCustomFields = [...parsedDefaultFields.filter(field => 
            !defaultFieldNames.includes(field.label.toLowerCase())
        ), ...parsedCustomFields].map(field => {
            const processedField = {
                field_name: field.label || "",
                field_type: field.type,
                is_required: field.isRequired,
                enabled: field.enabled,
                position: field.position,
                placeholder: field.placeholder || "",
                is_new: field.is_new || false,
                employees: field.employees || [],
                hasEmployeeRating: field.hasEmployeeRating !== undefined ? field.hasEmployeeRating : false
            };
            console.log("FormController: Processed custom field:", field.label, processedField);
            return processedField;
        });

        form.default_fields = processedDefaultFields;
        form.custom_fields = processedCustomFields;

        console.log("FormController: Final form fields:", { 
            default_fields: form.default_fields, 
            custom_fields: form.custom_fields 
        });

        await form.save();

        // Generate presigned URL for the logo if it exists
        let logoUrl = null;
        if (form.logo) {
            try {
                logoUrl = await getPresignedUrl(form.logo);
            } catch (error) {
                console.error("FormController: Error generating presigned URL for logo:", error);
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
        console.error("FormController: Error in updateForm:", error);
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