import { ManualPlan } from "../models/ManualPlan.js";

// Get all manual plans
export const getAllManualPlans = async (req, res) => {
    try {
        const plans = await ManualPlan.find();
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get active manual plans
export const getActiveManualPlans = async (req, res) => {
    try {
        const plans = await ManualPlan.find({ is_active: true });
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a manual plan by ID
export const getManualPlanById = async (req, res) => {
    try {
        const plan = await ManualPlan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Manual plan not found' });
        res.status(200).json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new manual plan
export const createManualPlan = async (req, res) => {
    try {
        const newPlan = new ManualPlan(req.body);
        await newPlan.save();
        res.status(201).json(newPlan);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a manual plan
export const updateManualPlan = async (req, res) => {
    try {
        const updatedPlan = await ManualPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPlan) return res.status(404).json({ message: 'Manual plan not found' });
        res.status(200).json(updatedPlan);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a manual plan
export const deleteManualPlan = async (req, res) => {
    try {
        const deletedPlan = await ManualPlan.findByIdAndDelete(req.params.id);
        if (!deletedPlan) return res.status(404).json({ message: 'Manual plan not found' });
        res.status(200).json({ message: 'Manual plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};