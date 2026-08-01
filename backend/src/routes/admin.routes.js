import express from "express";
import auth from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { getPendingProviders, verifyProvider } from "../controllers/admin.controller.js";

const router = express.Router();
router.put("/verify-provider/:id", auth, adminOnly, verifyProvider);

/* ==========================================
   GET ALL REQUESTS
========================================== */
router.get("/requests", auth, adminOnly, async (req, res) => {
    const requests = await ServiceRequest.find()
        .populate("customer", "fullName email mobile role averageRating totalReviews")
        .populate("provider", "fullName email mobile role averageRating totalReviews")
        .populate("service");

    res.json(requests);
});

/* ==========================================
   REVENUE ANALYTICS
========================================== */
router.get("/analytics", auth, adminOnly, async (req, res) => {
    const revenue = await Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const users = await User.countDocuments();
    const providers = await User.countDocuments({ role: "SERVICE_PROVIDER" });


    res.json({
        totalRevenue: revenue[0]?.total || 0,
        totalUsers: users,
        totalProviders: providers
    });
});
router.get("/providers", auth, adminOnly, getPendingProviders);

export default router;

