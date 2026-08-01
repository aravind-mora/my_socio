import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { sendOTPEmail } from "../config/mail.js";
import { sendSignupEmail, sendLoginEmail, sendUpgradeEmail } from "../config/mail.js";
import { sendProviderVerifiedEmail } from "../config/mail.js";

import axios from "axios";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);


// ==============================
// GOOGLE LOGIN
// ==============================
// GOOGLE LOGIN
// ==============================
export const googleLogin = async (req, res) => {
    try {
        const { token, role } = req.body;

        if (!token) {
            return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/#/login-failed`);
        }

        if (!role || !["CUSTOMER", "SERVICE_PROVIDER"].includes(role)) {
            return res.status(400).json({
                error: "Invalid role selected"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        let user = await User.findOne({ email });

        // ✅ If user does NOT exist → create with selected role
        if (!user) {
            user = await User.create({
                fullName: name,
                email,
                password: "GOOGLE_USER",
                mobile: "0000000000",
                role: role,
                isVerified: role === "CUSTOMER", // Providers need admin verification
                otpVerified: true,
            });
        }

        // ❗ DO NOT update role if user already exists

        const jwtToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.redirect(
            `${process.env.FRONTEND_URL || "http://localhost:5173"}/#/login-success?token=${jwtToken}`
        );


    } catch (error) {
        console.error("Google login error:", error.message);
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/#/login-failed`);
    }
};




/* SEND OTP */
export const sendOTP = async (req, res) => {
    const { email, purpose } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const recentOTP = await OTP.findOne({
        email,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });

    if (recentOTP) {
        return res.status(429).json({
            error: "Please wait before requesting another OTP"
        });
    }

    await OTP.create({
        email,
        otp,
        purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOTPEmail(email, otp);
    res.json({ message: "OTP sent" });
};

/* VERIFY OTP */
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp, purpose } = req.body;

        const otpDoc = await OTP.findOne({
            email,
            otp,
            purpose,
            expiresAt: { $gt: new Date() }
        });

        if (!otpDoc) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // ✅ Mark OTP as verified
        otpDoc.verified = true;
        await otpDoc.save();

        res.json({ message: "OTP verified successfully" });

    } catch (err) {
        console.error("OTP verify error:", err);
        res.status(500).json({ error: "OTP verification failed" });
    }
};



/* SIGNUP */
export const signup = async (req, res) => {
    try {
        const { fullName, email, mobile, password, role, adminSecret } = req.body;

        // 🔐 Determine final role safely
        let finalRole = "CUSTOMER";

        if (role === "SERVICE_PROVIDER") {
            finalRole = "SERVICE_PROVIDER";
        }

        // 🔐 ADMIN creation with secret
        if (role === "ADMIN") {
            if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
                return res.status(403).json({
                    error: "Invalid admin secret"
                });
            }

            // Optional: allow only one admin
            const existingAdmin = await User.findOne({ role: "ADMIN" });
            if (existingAdmin) {
                return res.status(403).json({
                    error: "Admin already exists"
                });
            }

            finalRole = "ADMIN";
        }

        // 🔐 OTP purpose mapping
        const otp = await OTP.findOne({
            email,
            purpose:
                finalRole === "SERVICE_PROVIDER"
                    ? "PROVIDER_SIGNUP"
                    : finalRole === "ADMIN"
                        ? "ADMIN_SIGNUP"
                        : "CUSTOMER_SIGNUP",
            verified: true
        });

        if (!otp)
            return res.status(403).json({
                error: "OTP verification required"
            });

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ error: "Email already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            email,
            mobile,
            password: hashed,
            role: finalRole
        });
        // ✅ Send thank you email
        await sendSignupEmail(user.email, user.fullName);

        res.status(201).json({
            message: "Signup successful",
            role: user.role
        });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ error: "Signup failed" });
    }
};


/* LOGIN STEP 1 */
/* LOGIN STEP 1 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 🔐 Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({
                error: "Account temporarily locked. Try again later."
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {

            // 🔐 Increment failed attempts
            user.loginAttempts = (user.loginAttempts || 0) + 1;

            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
            }

            await user.save();

            return res.status(401).json({ error: "Invalid credentials" });
        }

        // ✅ Successful login → reset counters
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        // ✅ Generate OTP for step 2
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OTP.deleteMany({ email, purpose: "LOGIN" });

        await OTP.create({
            email,
            otp,
            purpose: "LOGIN",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });

        await sendOTPEmail(email, otp);

        res.json({ message: "OTP sent for login" });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
};



/* LOGIN STEP 2 */
export const verifyLoginOTP = async (req, res) => {
    const { email, otp } = req.body;

    const record = await OTP.findOne({
        email,
        otp,
        purpose: "LOGIN",
        expiresAt: { $gt: new Date() }
    });

    if (!record) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
    // ✅ Send welcome back email
    await sendLoginEmail(user.email, user.fullName);

    await OTP.deleteMany({ email, purpose: "LOGIN" });

    res.json({ token, role: user.role });
};


/* ROLE UPGRADE */
export const upgradeToProvider = async (req, res) => {
    try {
        if (req.user.role !== "CUSTOMER") {
            return res.status(400).json({
                error: "Only customers can upgrade"
            });
        }

        req.user.role = "SERVICE_PROVIDER";
        req.user.isVerified = false;

        await req.user.save();

        // ✅ Send upgrade email
        try {
            await sendUpgradeEmail(req.user.email, req.user.fullName);
        } catch (err) {
            console.log("Upgrade email failed but role updated");
        }

        res.json({ message: "Upgraded to service provider. Await admin verification." });

    } catch (err) {
        res.status(500).json({ error: "Upgrade failed" });
    }
};


/*google call back from google to server (token id)*/
export const googleCallback = async (req, res) => {
    try {
        const { code, role } = req.query;

        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/#/login-failed`);
        }

        if (!role || !["CUSTOMER", "SERVICE_PROVIDER"].includes(role)) {
            return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/#/login-failed`);
        }

        const { tokens } = await googleClient.getToken({
            code,
            redirect_uri: process.env.GOOGLE_CALLBACK_URL
        });

        googleClient.setCredentials(tokens);

        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                fullName: name,
                email,
                password: "GOOGLE_USER",
                mobile: "0000000000",
                role: role,
                isVerified: role === "CUSTOMER",
                otpVerified: true
            });

            try {
                console.log("📧 Google Signup Email...");
                await sendSignupEmail(user.email, user.fullName);
                console.log("✅ Google Signup Email Sent");
            } catch (mailErr) {
                console.error("❌ Google Signup Mail Error:", mailErr);
            }

        } else {
            try {
                console.log("📧 Google Login Email...");
                await sendLoginEmail(user.email, user.fullName);
                console.log("✅ Google Login Email Sent");
            } catch (mailErr) {
                console.error("❌ Google Login Mail Error:", mailErr);
            }
        }


        const jwtToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.redirect(
            `${process.env.FRONTEND_URL || "http://localhost:5173"}/#/login-success?token=${jwtToken}`
        );

    } catch (error) {
        console.error("Google login error FULL:", error);
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/#/login-failed`);
    }
};
