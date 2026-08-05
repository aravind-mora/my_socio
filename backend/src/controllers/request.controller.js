import ServiceRequest from "../models/ServiceRequest.js";
import Service from "../models/Service.js";
import Channel from "../models/Channel.js";
import Bid from "../models/Bid.js";
import Payment from "../models/Payment.js";


export const createServiceRequest = async (req, res) => {
    try {
        const { serviceId, requestedSlot } = req.body;

        const service = await Service.findById(serviceId);
        if (!service)
            return res.status(404).json({ error: "Service not found" });

        // ❌ Cannot request own service
        if (service.provider.equals(req.user._id))
            return res.status(403).json({
                error: "Cannot request your own service"
            });

        // 🔥 NEW RULE
        if (req.user.role === "SERVICE_PROVIDER") {

            // Find if provider already offers this category
            const existingService = await Service.findOne({
                provider: req.user._id,
                category: service.category
            });

            if (existingService) {
                return res.status(403).json({
                    error: `You cannot request services in "${service.category}" category because you already provide it.`
                });
            }
        }

        const already = await ServiceRequest.findOne({
            service: serviceId,
            customer: req.user._id
        });

        if (already)
            return res.status(409).json({
                error: "Already requested this service"
            });

        const request = await ServiceRequest.create({
            service: serviceId,
            customer: req.user._id,
            provider: service.provider,
            requestedSlot
        });

        res.status(201).json(request);

    } catch (err) {
        console.error("Create request error:", err);
        res.status(500).json({ error: "Failed to create request" });
    }
};


export const getProviderRequests = async (req, res) => {
    const requests = await ServiceRequest.find({
        provider: req.user._id
    }).populate("customer", "fullName email");

    res.json(requests);
};

export const getCustomerRequests = async (req, res) => {
    const requests = await ServiceRequest.find({
        customer: req.user._id
    }).populate("service");

    res.json(requests);
};

/* =========================================================
   CUSTOMER ACCEPTS A BID
========================================================= */
export const acceptRequest = async (req, res) => {
    try {
        const { requestId, bidId } = req.body;

        // Only CUSTOMER can accept


        const serviceRequest = await ServiceRequest.findById(requestId);

        if (!serviceRequest) {
            return res.status(404).json({
                error: "Service request not found"
            });
        }

        // Ownership check
        if (serviceRequest.customer.toString() !== req.user.id) {
            return res.status(403).json({
                error: "Not authorized to accept this request"
            });
        }

        // Status check
        if (serviceRequest.status !== "PENDING") {
            return res.status(400).json({
                error: "Request already processed"
            });
        }

        const bid = await Bid.findById(bidId);

        if (!bid || bid.serviceRequest.toString() !== serviceRequest._id.toString()) {
            return res.status(400).json({
                error: "Invalid bid for this request"
            });
        }

        // ✅ Accept the bid
        serviceRequest.status = "ACCEPTED";
        serviceRequest.acceptedBid = bidId;
        serviceRequest.provider = bid.provider;

        await serviceRequest.save();

        // ✅ Create communication channel
        // ✅ Create channel only if not exists
        let channel = await Channel.findOne({
            serviceRequest: requestId
        });

        if (!channel) {
            channel = await Channel.create({
                serviceRequest: requestId,
                participants: [
                    serviceRequest.customer,
                    bid.provider
                ]
            });
        }


        return res.status(200).json({
            message: "Bid accepted successfully",
            status: "ACCEPTED"
        });

    } catch (err) {
        console.error("❌ Accept Request Error:", err);
        return res.status(500).json({
            error: "Failed to accept bid"
        });
    }
};
export const cancelRequest = async (req, res) => {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ error: "Request not found" });

    if (!request.customer.equals(req.user.id)) {
        return res.status(403).json({ error: "Not authorized" });
    }

    if (request.status !== "PENDING")
        return res.status(400).json({ error: "Cannot cancel now" });

    request.status = "CANCELLED";
    await request.save();
    res.json({ message: "Request cancelled" });
};
export const requestRefund = async (req, res) => {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request)
        return res.status(404).json({ error: "Not found" });

    if (request.customer.toString() !== req.user._id.toString())
        return res.status(403).json({ error: "Not authorized" });

    if (request.paymentStatus !== "PAID")
        return res.status(400).json({
            error: "Refund only allowed after payment"
        });

    request.status = "REFUND_REQUESTED";
    await request.save();

    res.json({ message: "Refund requested" });
};
export const approveRefund = async (req, res) => {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request || request.status !== "REFUND_REQUESTED")
        return res.status(400).json({ error: "Invalid state" });

    request.status = "REFUNDED";
    await request.save();

    res.json({ message: "Refund completed" });
};

export const markCompleted = async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id);

        if (!request)
            return res.status(404).json({ error: "Request not found" });

        // Only provider can mark completed
        if (request.provider.toString() !== req.user._id.toString())
            return res.status(403).json({ error: "Not authorized" });

        if (request.status !== "ACCEPTED")
            return res.status(400).json({
                error: "Only accepted requests can be completed"
            });

        request.status = "COMPLETED";
        await request.save();

        res.json({ message: "Marked as COMPLETED" });

    } catch (err) {
        res.status(500).json({ error: "Failed to complete request" });
    }
};
export const requestPayment = async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id);

        if (!request)
            return res.status(404).json({ error: "Request not found" });

        if (req.user._id.toString() !== request.provider.toString())
            return res.status(403).json({ error: "Not authorized" });

        request.paymentStatus = "PAYMENT_REQUESTED";
        await request.save();

        res.json({ message: "Payment requested" });

    } catch (err) {
        res.status(500).json({ error: "Failed to request payment" });
    }
};
export const createChannelPayment = async (req, res) => {
    try {
        console.log("🟡 Creating payment for request:", req.params.id);

        const request = await ServiceRequest.findById(req.params.id);

        if (!request) {
            console.log("❌ Request not found");
            return res.status(404).json({ error: "Request not found" });
        }

        // Only customer can pay
        if (req.user._id.toString() !== request.customer.toString()) {
            console.log("❌ Not authorized to pay");
            return res.status(403).json({ error: "Not authorized" });
        }

        // 🔥 Fetch service manually
        const service = await Service.findById(request.service);

        if (!service) {
            console.log("❌ Service not found");
            return res.status(404).json({ error: "Service not found" });
        }

        console.log("Service price:", service.price);

        const payment = await Payment.create({
            user: req.user._id,
            service: service._id,
            amount: service.price,
            status: "PENDING"
        });

        console.log("✅ Payment created:", payment._id);

        request.paymentStatus = "PAYMENT_PENDING";
        request.paymentId = payment._id;
        await request.save();

        res.json({ paymentId: payment._id });

    } catch (err) {
        console.error("❌ Payment creation failed:", err);
        res.status(500).json({ error: "Payment creation failed" });
    }
};


export const confirmChannelPayment = async (req, res) => {
    try {
        console.log("🟡 Confirming payment:", req.body.paymentId);

        const { paymentId } = req.body;

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            console.log("❌ Payment not found");
            return res.status(404).json({ error: "Payment not found" });
        }

        payment.status = "SUCCESS";
        await payment.save();

        console.log("✅ Payment marked SUCCESS");

        const request = await ServiceRequest.findOne({ paymentId });

        if (!request) {
            console.log("❌ ServiceRequest not found for payment");
            return res.status(404).json({ error: "Service request not found" });
        }

        request.paymentStatus = "PAID_PENDING_VERIFICATION";
        await request.save();

        console.log("✅ Request updated to PAID_PENDING_VERIFICATION");

        res.json({ message: "Payment successful" });

    } catch (err) {
        console.error("❌ Payment confirmation failed:", err);
        res.status(500).json({ error: "Payment confirmation failed" });
    }
};

export const verifyPaymentByProvider = async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id);

        if (req.user._id.toString() !== request.provider.toString())
            return res.status(403).json({ error: "Not authorized" });

        request.paymentStatus = "PAID";
        await request.save();

        res.json({ message: "Payment verified successfully" });

    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
};
export const getServiceRequestById = async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id)
            .populate("service")
            .populate("customer", "fullName email")
            .populate("provider", "fullName email");

        if (!request)
            return res.status(404).json({ error: "Request not found" });

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch request" });
    }
};
