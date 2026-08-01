import Bid from "../models/Bid.js";
import ServiceRequest from "../models/ServiceRequest.js";

export const placeBid = async (req, res) => {
    const { serviceRequestId, amount, message } = req.body;

    const request = await ServiceRequest.findById(serviceRequestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (req.user.role !== "SERVICE_PROVIDER") {
        return res.status(403).json({ error: "Providers only" });
    }
    const bid = await Bid.create({
        serviceRequest: serviceRequestId,
        provider: req.user._id,
        amount,
        message
    });

    res.status(201).json(bid);
};

export const getCustomerBids = async (req, res) => {
    const bids = await Bid.find()
        .populate("provider", "fullName")
        .populate({
            path: "serviceRequest",
            match: { customer: req.user._id }
        });

    res.json(bids.filter(b => b.serviceRequest));
};
export const withdrawBid = async (req, res) => {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: "Bid not found" });

    if (!bid.provider.equals(req.user.id)) {
        return res.status(403).json({ error: "Not authorized" });
    }

    const request = await ServiceRequest.findById(bid.serviceRequest);
    if (request.status !== "PENDING") {
        return res.status(400).json({ error: "Cannot withdraw bid" });
    }

    await bid.deleteOne();
    res.json({ message: "Bid withdrawn" });
};
