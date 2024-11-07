import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized - no token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) return res.status(401).json({ success: false, message: "Unauthorized - invalid token" });

        // Retrieve the user details, including the role
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        req.userId = user._id;
        req.userRole = user.role; // Attach user role to the request for further checks

        next();
    } catch (error) {
        console.log("Error in verifyToken", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const adminRoute = (req, res, next) => {
    if (req.userRole == "admin") {
        next();
    } else {
        
        return res.status(403).json({ success: false, message: "Access denied - Admins only" });
    }
};