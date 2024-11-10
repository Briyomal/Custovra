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