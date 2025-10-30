import { Form } from '../models/Form.js';

/**
 * Middleware to check if a form is locked and prevent access
 * Used for protecting form editing and management operations
 */
export const checkFormAccess = async (req, res, next) => {
    try {
        const { id } = req.params; // Form ID from URL
        const userId = req.userId; // User ID from verifyToken middleware

        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Form ID is required' 
            });
        }

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        // Find the form and check ownership
        const form = await Form.findOne({ _id: id, user_id: userId });

        if (!form) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or unauthorized access' 
            });
        }

        // Check if form is locked
        if (form.lockedAt && form.lockReason) {
            console.log(`🔒 Form access denied - Form ${id} is locked:`, {
                formId: id,
                userId,
                lockedAt: form.lockedAt,
                lockReason: form.lockReason
            });
            
            return res.status(403).json({ 
                success: false, 
                message: 'This form is locked due to plan restrictions. Upgrade your plan to access it.',
                locked: true,
                lockReason: form.lockReason,
                lockedAt: form.lockedAt
            });
        }

        console.log(`✅ Form access granted - Form ${id} is accessible to user ${userId}`);
        
        // Add form to request object for use in controllers
        req.form = form;
        next();

    } catch (error) {
        console.error('Error in checkFormAccess middleware:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while checking form access' 
        });
    }
};

/**
 * Middleware to check if a form is locked for read-only operations
 * Allows viewing but shows warning about locked status
 */
export const checkFormAccessReadOnly = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Form ID is required' 
            });
        }

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        // Find the form and check ownership
        const form = await Form.findOne({ _id: id, user_id: userId });

        if (!form) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or unauthorized access' 
            });
        }

        // Add form and lock status to request object
        req.form = form;
        req.isFormLocked = !!(form.lockedAt && form.lockReason);
        
        next();

    } catch (error) {
        console.error('Error in checkFormAccessReadOnly middleware:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while checking form access' 
        });
    }
};