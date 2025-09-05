import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export const getProfile = async (req, res) => {
    try {
        // Ensure the logged-in user can only fetch their own profile
        if (req.userId.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
 
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
 
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
 };
 
export const changePassword = async (req, res) => {
    try {
        console.log("Request Body:", req.body);
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId); // Assuming `req.userId` is from auth middleware

        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    const { name, company, email, phone } = req.body;

    try {
        const user = await User.findById(req.userId); // Assuming `req.user.id` is available from auth middleware

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.name = name || user.name;
        user.company = company || user.company;
        user.email = email || user.email;
        user.phone = phone || user.phone;

        await user.save();

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to update profile", error });
    }
};

// Generate 2FA secret and QR code
export const generate2FA = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a new secret
        const secret = authenticator.generateSecret();
        const appName = 'ReviewApp';
        const otpauth = authenticator.keyuri(user.email, appName, secret);

        // Generate QR code
        const qrCode = await QRCode.toDataURL(otpauth);

        // Save the secret to the user (but don't enable 2FA yet)
        user.twoFactorSecret = secret;
        await user.save();

        res.json({
            secret,
            qrCode,
            message: "2FA secret generated successfully"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify 2FA token and enable 2FA
export const verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: "2FA not initialized" });
        }

        // Verify the token
        const isValid = authenticator.check(token, user.twoFactorSecret);

        if (isValid) {
            user.twoFactorEnabled = true;
            await user.save();
            res.json({ message: "2FA enabled successfully" });
        } else {
            res.status(400).json({ message: "Invalid token" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.twoFactorSecret = undefined;
        user.twoFactorEnabled = false;
        await user.save();

        res.json({ message: "2FA disabled successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};