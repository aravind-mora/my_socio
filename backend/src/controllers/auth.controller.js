import express from "express";
import { googleCallback } from "../controllers/auth.controller.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import passport from "passport";

import {
    sendOTP,
    verifyOTP,
    signup,
    login,
    verifyLoginOTP,
    upgradeToProvider,
    googleLogin
} from "../controllers/auth.controller.js";

import auth from "../middleware/auth.js";

const router = express.Router();

/* ============ EMAIL OTP FLOW (website + app) ============ */
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/signup", signup);
router.post("/login", login);
router.post("/login/verify-otp", verifyLoginOTP);

/* ============ GOOGLE OAUTH ============
   state=app  → Android app user → redirect back into the APP (deep link)
   no state   → website user     → redirect to website
========================================= */
router.get(
    "/google",
    (req, res, next) => {
        passport.authenticate("google", {
            scope: ["profile", "email"],
            session: false,
            state: req.query.state || undefined, // pass through state (e.g. "app")
        })(req, res, next);
    }
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    async (req, res) => {
        try {
            const FRONTEND = process.env.FRONTEND_URL;
            const isApp = req.query.state === "app"; // came from the Android app
            const APP_SCHEME = "com.sociosphere.neon"; // Android deep-link scheme
            const user = req.user;
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            // App users get redirected back into the app via deep link
            if (isApp) {
                return res.redirect(`${APP_SCHEME}://login-success?token=${token}`);
            }
            // Website users → website hash route
            return res.redirect(`${FRONTEND}/#/login-success?token=${token}`);
        } catch (err) {
            if (req.query.state === "app") {
                return res.redirect("com.sociosphere.neon://login-failed");
            }
            return res.redirect(`${process.env.FRONTEND_URL}/#/login-failed`);
        }
    }
);

/* ============ ROLE UPGRADE ============ */
router.post("/upgrade-provider", auth, upgradeToProvider);

/* ==========================================================
   DEMO / COMPANY ACCESS — one-click login without OTP
   (only works for the configured demo account)
   Used by the "View Live Demo" button on the landing page.
========================================================== */
router.post("/demo-login", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const demoEmail = process.env.DEMO_EMAIL || "demouser17896@gmail.com";
        const demoPass = process.env.DEMO_PASSWORD || "demouser@14369";

        if (email !== demoEmail || password !== demoPass) {
            return res.status(401).json({ error: "Invalid demo credentials" });
        }

        const user = await User.findOne({ email: demoEmail });
        if (!user) {
            return res.status(404).json({ error: "Demo user not found. Please create the demo account first." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.json({
            token,
            role: user.role,
            user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error("Demo login error:", err.message);
        return res.status(500).json({ error: "Demo login failed" });
    }
});

export default router;
