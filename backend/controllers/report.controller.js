// controllers/ReportController.js
import { Report } from '../models/Report.js';
import { Response } from '../models/Response.js';
import { Form } from '../models/Form.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';

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

// Helper function to extract rating from submission data
const extractRatingFromSubmission = (submissionsData) => {
    if (!submissionsData) return null;
    
    // Convert Map to plain object if needed
    let data = submissionsData;
    if (data instanceof Map) {
        data = Object.fromEntries(data);
    }
    
    // Look for rating fields (case insensitive and flexible naming)
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        // Check if this looks like a rating field
        if (lowerKey.includes('rating') || lowerKey.includes('rate')) {
            const ratingValue = parseFloat(value);
            if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
                return ratingValue;
            }
        }
        
        // Also check the value itself if it's a number between 0-5
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 5) {
            // Additional check to see if this might be a rating
            if (typeof value === 'string' && value.length <= 10) { // Ratings are typically short strings
                return numericValue;
            }
        }
    }
    
    return null;
};

// Admin function to get overall statistics
export const getAdminStats = async (req, res) => {
    try {
        // Only admin can access this
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: "Access denied. Admin only." 
            });
        }

        // Get total counts
        const totalUsers = await User.countDocuments();
        const totalForms = await Form.countDocuments();
        const totalSubmissions = await Submission.countDocuments();

        // Get forms with their types
        const forms = await Form.find({}, 'form_type');
        const formTypeCounts = {
            Review: forms.filter(form => form.form_type === 'Review').length,
            Complaint: forms.filter(form => form.form_type === 'Complaint').length
        };

        // Get all submissions to calculate average rating
        const allSubmissions = await Submission.find({}, 'submissions');
        
        let totalRating = 0;
        let ratingCount = 0;

        for (const submission of allSubmissions) {
            const rating = extractRatingFromSubmission(submission.submissions);
            if (rating !== null) {
                totalRating += rating;
                ratingCount++;
            }
        }

        const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "0.0";

        // Get revenue information
        const payments = await Payment.find({}, 'amount payment_date');
        
        // Calculate total revenue
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Calculate this month's revenue
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthPayments = payments.filter(payment => payment.payment_date >= startOfMonth);
        const thisMonthRevenue = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Get new users this month
        const newUsers = await User.find({ createdAt: { $gte: startOfMonth } });
        const newUsersCount = newUsers.length;

        res.status(200).json({
            totalUsers,
            totalForms,
            totalSubmissions,
            formTypeCounts,
            averageRating,
            totalRevenue,
            thisMonthRevenue,
            newUsersCount
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ error: "Server error. Unable to fetch admin statistics." });
    }
};

// Admin function to get user-specific statistics
export const getAdminUserStats = async (req, res) => {
    try {
        // Only admin can access this
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: "Access denied. Admin only." 
            });
        }

        const { userId: targetUserId } = req.params;

        // Get user details
        const targetUser = await User.findById(targetUserId, 'name email createdAt');
        if (!targetUser) {
            return res.status(404).json({ 
                success: false, 
                error: "User not found" 
            });
        }

        // Get user's forms
        const userForms = await Form.find({ user_id: targetUserId });
        const formCount = userForms.length;

        // Get form IDs for submission lookup
        const formIds = userForms.map(form => form._id);

        // Get user's submissions
        const userSubmissions = await Submission.find({ form_id: { $in: formIds } });
        const submissionCount = userSubmissions.length;

        // Calculate average rating for user's submissions
        let totalRating = 0;
        let ratingCount = 0;

        for (const submission of userSubmissions) {
            const rating = extractRatingFromSubmission(submission.submissions);
            if (rating !== null) {
                totalRating += rating;
                ratingCount++;
            }
        }

        const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "0.0";

        // Form type distribution
        const formTypeCounts = {
            Review: userForms.filter(form => form.form_type === 'Review').length,
            Complaint: userForms.filter(form => form.form_type === 'Complaint').length
        };

        res.status(200).json({
            user: targetUser,
            formCount,
            submissionCount,
            averageRating,
            formTypeCounts
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ error: "Server error. Unable to fetch user statistics." });
    }
};