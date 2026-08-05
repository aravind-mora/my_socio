import express from "express";
import auth from "../middleware/auth.js";
import Payment from "../models/Payment.js";
import ServiceRequest from "../models/ServiceRequest.js";
import { getProviderProfile } from "../controllers/provider.controller.js";

const router = express.Router();

/* ==========================================
   PROVIDER DASHBOARD
   ⚠️ MUST be declared BEFORE "/:providerId" —
   otherwise Express matches "/dashboard" as an
   id and Mongoose throws a CastError (crash).
========================================== */
router.get("/dashboard", auth, async (req, res) => {

    if (req.user.role !== "SERVICE_PROVIDER") {
        return res.status(403).json({ error: "Provider only" });
    }

    try {
        const totalEarnings = await Payment.aggregate([
            { $match: { provider: req.user._id } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const completedJobs = await ServiceRequest.countDocuments({
            provider: req.user._id,
            status: "COMPLETED"
        });

        const paidJobs = await ServiceRequest.countDocuments({
            provider: req.user._id,
            status: "PAID"
        });

        const pendingJobs = await ServiceRequest.countDocuments({
            provider: req.user._id,
            status: { $in: ["PENDING", "ACCEPTED"] }
        });

        res.json({
            totalEarnings: totalEarnings[0]?.total || 0,
            completedJobs,
            paidJobs,
            pendingJobs
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ error: "Failed to load dashboard" });
    }
});

router.get("/:providerId", getProviderProfile);

export default router;
