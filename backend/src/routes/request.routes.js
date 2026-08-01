import express from "express";
import auth from "../middleware/auth.js";
import {
    createServiceRequest,
    getProviderRequests,
    getCustomerRequests,
    acceptRequest,
    cancelRequest,
    markCompleted,
    requestRefund,
    requestPayment,
    createChannelPayment,
    confirmChannelPayment,
    verifyPaymentByProvider,
    getServiceRequestById,

} from "../controllers/request.controller.js";
import ServiceRequest from "../models/ServiceRequest.js";

const router = express.Router();

router.post("/", auth, createServiceRequest);
router.get("/provider", auth, getProviderRequests);
router.get("/customer", auth, getCustomerRequests);
router.get("/:id", auth, getServiceRequestById);

router.post("/accept", auth, acceptRequest);
router.delete("/:id", auth, cancelRequest);
router.patch("/:id/complete", auth, markCompleted);

router.patch("/:id/request-refund", auth, requestRefund);
router.post("/:id/request-payment", auth, requestPayment);

router.post("/:id/create-payment", auth, createChannelPayment);

router.post("/confirm-payment", auth, confirmChannelPayment);

router.post("/:id/verify-payment", auth, verifyPaymentByProvider);
router.get("/:id", auth, async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id)
            .populate("service")
            .populate("customer", "fullName email")
            .populate("provider", "fullName email");

        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        res.json(request);
    } catch (err) {
        console.error("Get request by id error:", err);
        res.status(500).json({ error: "Failed to fetch request" });
    }
});

export default router;
