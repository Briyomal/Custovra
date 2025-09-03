// controllers/ReportController.js
import { Report } from '../models/Report.js';
import { Response } from '../models/Response.js';
import { Form } from '../models/Form.js';

// Generate and save a report for a form (only if user owns the form)
export const generateReport = async (req, res) => {
    try {
        const userId = req.userId; // From verifyToken middleware
        const { formId } = req.params;
        
        // SECURITY: Verify form ownership before generating report
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
                error: "Access denied. You can only generate reports for your own forms." 
            });
        }
        
        // Fetch responses for the form
        const responses = await Response.find({ form_id: formId });

        // Calculate report data
        const totalResponses = responses.length;
        const averageRating = responses
            .filter((r) => r.rating !== undefined)
            .reduce((sum, r) => sum + r.rating, 0) / totalResponses || 0;

        // Save the report
        const report = new Report({
            form_id: formId,
            total_responses: totalResponses,
            average_rating: averageRating,
        });

        await report.save();
        res.status(201).json(report);
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ error: "Server error. Unable to generate report." });
    }
};

// Get a saved report (only if user owns the form)
export const getReport = async (req, res) => {
    try {
        const userId = req.userId; // From verifyToken middleware
        const { formId } = req.params;
        
        // SECURITY: Verify form ownership before showing report
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
                error: "Access denied. You can only view reports for your own forms." 
            });
        }
        
        const report = await Report.findOne({ form_id: formId });
        if (!report) {
            return res.status(404).json({ 
                success: false, 
                error: 'Report not found' 
            });
        }
        
        res.status(200).json(report);
    } catch (error) {
        console.error("Error fetching report:", error);
        res.status(500).json({ error: "Server error. Unable to fetch report." });
    }
};
