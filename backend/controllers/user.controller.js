import { User } from "../models/User.js";

export const getAllUsers = async (req, res, next) =>{
   try {
    const users = await User.find({}, '-password'); // Exclude password field for security
   res.status(200).json(users);
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
       const deletedUser = await User.findByIdAndDelete(req.params.id);
       if (!deletedUser) return res.status(404).json({ message: 'User not found' });
       res.status(200).json({ message: 'User deleted successfully' });
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
};