import Review from "../models/Review.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import { sendNotification } from "../utils/notify.js";
import ServiceRequest from "../models/ServiceRequest.js";

export const createReview = async (req, res) => {
    try {
        const { serviceId, rating, comment } = req.body;
        const serviceRequest = await ServiceRequest.findOne({
            service: serviceId,
            customer: req.user._id
        });

        if (
            !serviceRequest ||
            (serviceRequest.paymentStatus !== "PAID" && serviceRequest.status !== "PAID")
        ) {
            return res.status(400).json({ error: "You can review only after payment" });
        }

        const existingReview = await Review.findOne({
            service: serviceId,
            customer: req.user._id
        });

        if (existingReview) {
            return res.status(400).json({
                error: "You have already reviewed this service"
            });
        }
        const service = await Service.findById(serviceId);
        if (!service) return res.status(404).json({ message: "Service not found" });

        const review = await Review.create({
            service: serviceId,
            provider: service.provider,
            customer: req.user.id,
            rating,
            comment
        });
        const stats = await Review.aggregate([
            { $match: { provider: review.provider } },
            {
                $group: {
                    _id: "$provider",
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 }
                }
            }
        ]);

        await User.findByIdAndUpdate(review.provider, {
            averageRating: stats[0].avgRating,
            totalReviews: stats[0].count
        });
        // Send notification to provider
        await sendNotification(req.io, service.provider, {
            type: "NEW_REVIEW",
            title: "New Review Received",
            message: `You received a ${rating}⭐ rating`,
            meta: { serviceId }
        });

        res.json(review);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

