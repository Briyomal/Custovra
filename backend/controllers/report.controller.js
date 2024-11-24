// controllers/ReportController.js
import { Report } from '../models/Report.js';
import { Response } from '../models/Response.js';

// Generate and save a report for a form
export const generateReport = async (req, res) => {
    try {
        // Fetch responses for the form
        const responses = await Response.find({ form_id: req.params.formId });

        // Calculate report data
        const totalResponses = responses.length;
        const averageRating = responses
            .filter((r) => r.rating !== undefined)
            .reduce((sum, r) => sum + r.rating, 0) / totalResponses || 0;

        // Save the report
        const report = new Report({
            form_id: req.params.formId,
            total_responses: totalResponses,
            average_rating: averageRating,
        });

        await report.save();
        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a saved report
export const getReport = async (req, res) => {
    try {
        const report = await Report.findOne({ form_id: req.params.formId });
        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
