import crypto from "crypto";
import bcrypt from "bcryptjs";          // ✅ FIX #1: was "bcrypt" (not installed), must be "bcryptjs"
import User from "../models/User.js";

import { sendResetPasswordEmail } from "../config/mail.js";

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal whether account exists
            return res.json({
                message: "If account exists, reset link sent"
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // ✅ FIX #2: was "resetPasswordExpires" (with 's') — doesn't match schema field

        await user.save();

        const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/#/reset-password/${resetToken}`;

        await sendResetPasswordEmail(email, resetLink);

        res.json({ message: "Reset link sent to your email" });

    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ error: "Failed to process reset" });
    }
};


/* ==========================================
   RESET PASSWORD
========================================== */

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token and new password are required" });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }  // ✅ correct field name, now works since forgotPassword saves it correctly
        });

        if (!user) {
            return res.status(400).json({
                error: "Invalid or expired token"
            });
        }

        // 🔐 Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;   // ✅ correct field name (no trailing 's')

        await user.save();

        res.json({ message: "Password reset successful" });

    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ error: "Password reset failed" });
    }
};
