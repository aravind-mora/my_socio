import express from "express";
import auth from "../middleware/auth.js";
import upload from "../config/multer.js"; // ✅ for image upload

import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    getNearbyServices
} from "../controllers/service.controller.js";

const router = express.Router();

/* =========================================================
   PUBLIC ROUTES
========================================================= */

// ⚠️ ORDER MATTERS
router.get("/nearby", getNearbyServices);
router.get("/", getAllServices);
router.get("/:id", getServiceById);

/* =========================================================
   PROTECTED ROUTES
========================================================= */

// ✅ Create service (ONLY verified providers)
router.post(
    "/",
    auth,
    upload.array("images", 5), // ✅ allow max 5 images
    (req, res, next) => {
        if (req.user.role !== "SERVICE_PROVIDER") {
            return res.status(403).json({
                error: "Only service providers can create services"
            });
        }

        if (!req.user.isVerified) {
            return res.status(403).json({
                error: "Your account is not verified by admin yet."
            });
        }

        next();
    },
    createService
);

// ✅ Update service (Owner only — checked in controller)
router.put(
    "/:id",
    auth,
    upload.array("images", 5), // optional if updating images
    updateService
);

// ✅ Delete service
router.delete("/:id", auth, deleteService);

export default router;
