import express from "express";
import { googleCallback } from "../controllers/auth.controller.js";

import {
    sendOTP,
    verifyOTP,
    signup,
    login,
    verifyLoginOTP,
    upgradeToProvider,
    googleLogin   // ✅ added
} from "../controllers/auth.controller.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/signup", signup);
router.post("/login", login);
router.post("/login/verify-otp", verifyLoginOTP);

import passport from "passport";
import jwt from "jsonwebtoken";

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    async (req, res) => {
        try {
            const FRONTEND = process.env.FRONTEND_URL;
            const user = req.user;
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );
            return res.redirect(`${FRONTEND}/#/login-success?token=${token}`);
        } catch (err) {
            return res.redirect(`${process.env.FRONTEND_URL}/#/login-failed`);
        }
    }
);



router.post("/upgrade-provider", auth, upgradeToProvider);

export default router;
