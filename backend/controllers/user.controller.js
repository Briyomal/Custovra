import { User } from "../models/User.js";
import { Form } from "../models/Form.js";
import { Submission } from "../models/Submission.js";
import { Payment } from "../models/Payment.js";
import { GenieSubscription } from "../models/GenieSubscription.js";

export const getAllUsers = async (req, res, next) =>{
   try {
    const users = await User.find({}, '-password'); // Exclude password field for security
    
    // Enhance users with additional information
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      const userObject = user.toObject();
      
      // Get form count for this user
      const formCount = await Form.countDocuments({ user_id: user._id });
      
      // Get all forms for this user to calculate submission count
      const userForms = await Form.find({ user_id: user._id }).select('_id');
      const formIds = userForms.map(form => form._id);
      
      // Get submission count for all forms of this user
      const submissionCount = await Submission.countDocuments({ form_id: { $in: formIds } });
      
      // Get the most recent ACTIVE payment to get the actual plan name
      const now = new Date();
      const activePayment = await Payment.findOne({
        user_id: user._id,
        subscription_expiry: { $gte: now } // Only get active subscriptions
      }).sort({ subscription_expiry: -1 }).select('plan subscription_id subscription_expiry');

      // If no active payment, get the most recent payment for fallback
      const recentPayment = await Payment.findOne({
        user_id: user._id
      }).sort({ created_at: -1 }).select('plan subscription_id subscription_expiry');

      // Get the most recent active Genie subscription
      const activeGenieSubscription = await GenieSubscription.findOne({
        user_id: user._id,
        status: 'active'
      }).sort({ subscription_end: -1 });

      // Get the most recent Genie subscription (active or inactive)
      const recentGenieSubscription = await GenieSubscription.findOne({
        user_id: user._id
      }).sort({ subscription_end: -1 });

      // Determine plan name with multiple fallbacks - PRIORITY: Manual subscription data first
      let planName = 'Free'; // Default plan
      let subscriptionStatus = userObject.subscription_status || 'inactive';
      
      // Priority 1: Use plan from active Genie subscription if available
      if (activeGenieSubscription && activeGenieSubscription.plan_name) {
        planName = activeGenieSubscription.plan_name;
        subscriptionStatus = activeGenieSubscription.status;
      }
      // Priority 2: Use plan from recent Genie subscription if available
      else if (recentGenieSubscription && recentGenieSubscription.plan_name) {
        planName = recentGenieSubscription.plan_name;
        subscriptionStatus = recentGenieSubscription.status;
      }
      // Priority 3: Use user's subscription_plan from User model
      else if (userObject.subscription_plan) {
        planName = userObject.subscription_plan;
      }
      // Priority 4: Use plan from active payment if available
      else if (activePayment && activePayment.plan) {
        // Capitalize first letter for display
        planName = activePayment.plan.charAt(0).toUpperCase() + activePayment.plan.slice(1);
      }
      // Priority 5: Use plan from recent payment if available
      else if (recentPayment && recentPayment.plan) {
        // Capitalize first letter for display
        planName = recentPayment.plan.charAt(0).toUpperCase() + recentPayment.plan.slice(1);
      } 
      // Priority 6: If user has active subscription status, assume Basic plan
      else if (userObject.subscription_status === 'active') {
        planName = 'Basic';
      }
      
      // Determine subscription ID with priority
      let subscriptionId = userObject.subscription_id || null;
      if (activeGenieSubscription) {
        subscriptionId = activeGenieSubscription._id;
      } else if (recentGenieSubscription) {
        subscriptionId = recentGenieSubscription._id;
      } else if (activePayment) {
        subscriptionId = activePayment.subscription_id;
      } else if (recentPayment) {
        subscriptionId = recentPayment.subscription_id;
      }

      // Determine subscription expiry with priority
      let subscriptionExpiry = userObject.subscription_expiry || null;
      if (activeGenieSubscription) {
        subscriptionExpiry = activeGenieSubscription.subscription_end;
      } else if (recentGenieSubscription) {
        subscriptionExpiry = recentGenieSubscription.subscription_end;
      }

      return {
        ...userObject,
        phone: userObject.phone || 'N/A',
        subscription_plan: planName,
        subscription_status: subscriptionStatus,
        subscription_id: subscriptionId,
        subscription_expiry: subscriptionExpiry,
        formCount,
        submissionCount
      };
    }));
    
   res.status(200).json(enhancedUsers);
   } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
   }
}

// Get a single user by ID
export const getUserById = async (req, res) => {
   try {
       const user = await User.findById(req.params.id);
       if (!user) return res.status(404).json({ message: 'User not found' });
       res.status(200).json(user);
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
};

// Create a new user
export const createUser = async (req, res) => {
   try {
       const newUser = new User(req.body);
       await newUser.save();
       res.status(201).json(newUser);
   } catch (error) {
       res.status(400).json({ error: error.message });
   }
};

// Update a user
export const updateUser = async (req, res) => {
   try {
       const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
       if (!updatedUser) return res.status(404).json({ message: 'User not found' });
       res.status(200).json(updatedUser);
   } catch (error) {
       res.status(400).json({ error: error.message });
   }
};

// Delete a user
export const deleteUser = async (req, res) => {
   try {
       // First, find all forms associated with this user
       const userForms = await Form.find({ user_id: req.params.id }).select('_id');
       const formIds = userForms.map(form => form._id);
       
       // Delete all submissions associated with these forms
       if (formIds.length > 0) {
           await Submission.deleteMany({ form_id: { $in: formIds } });
       }
       
       // Delete all forms associated with this user
       await Form.deleteMany({ user_id: req.params.id });
       
       // Delete all payments associated with this user
       await Payment.deleteMany({ user_id: req.params.id });
       
       // Finally, delete the user
       const deletedUser = await User.findByIdAndDelete(req.params.id);
       if (!deletedUser) return res.status(404).json({ message: 'User not found' });
       
       res.status(200).json({ message: 'User and all associated data deleted successfully' });
   } catch (error) {
       console.error("Error deleting user:", error);
       res.status(500).json({ error: error.message });
   }
};