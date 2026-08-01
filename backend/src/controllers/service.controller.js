import Service from "../models/Service.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Bid from "../models/Bid.js";
import Channel from "../models/Channel.js";
import Review from "../models/Review.js";
import { mapService } from "../utils/mapper.js";
/* =========================================================
   CREATE SERVICE (PROVIDER ONLY)
========================================================= */
export const createService = async (req, res) => {
    try {
        if (req.user.role !== "SERVICE_PROVIDER") {
            return res.status(403).json({ error: "Provider access only" });
        }
        if (!req.user.isVerified) {
            return res.status(403).json({
                error: "Provider not verified by admin"
            });
        }

        const { title, category, description, price, slots, location } = req.body;

        if (!title || !category || !price) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!location || location.lat == null || location.lng == null) {
            return res.status(400).json({ error: "Location is required" });
        }

        const lat = Number(location.lat);
        const lng = Number(location.lng);

        if (
            isNaN(lat) || isNaN(lng) ||
            lat < -90 || lat > 90 ||
            lng < -180 || lng > 180
        ) {
            return res.status(400).json({ error: "Invalid latitude or longitude" });
        }

        const imagePaths = req.files?.map(file => file.path) || [];

        const service = await Service.create({
            provider: req.user._id,
            title,
            category,
            description,
            price,
            slots,
            images: imagePaths, // ✅ SAVE IMAGES
            location: {
                type: "Point",
                coordinates: [lng, lat]
            }
        });




        res.status(200).json({
            service: mapService(service)
        });


    } catch (err) {
        console.error("Create service error:", err);
        res.status(500).json({ error: "Failed to create service" });
    }
};


/* =========================================================
   UPDATE SERVICE (OWNER ONLY)
========================================================= */
export const updateService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service)
            return res.status(404).json({ error: "Service not found" });

        if (service.provider.toString() !== req.user._id.toString())
            return res.status(403).json({ error: "Not authorized" });

        const { title, description, price, slots, category } = req.body;

        service.title = title ?? service.title;
        service.description = description ?? service.description;
        service.price = price ?? service.price;
        service.slots = slots ?? service.slots;
        service.category = category ?? service.category;

        // ✅ Handle new uploaded images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            service.images = [...(service.images || []), ...newImages];
        }

        await service.save();

        res.json({
            message: "Service updated successfully",
            service
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update service" });
    }
};




/* =========================================================
   GET ALL SERVICES (PUBLIC)
========================================================= */
export const getAllServices = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, minRating } = req.query;

        let filter = {};

        if (category) filter.category = category;

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        if (minRating) {
            filter.averageRating = { $gte: Number(minRating) };
        }

        const services = await Service.find(filter)
            .populate("provider", "fullName averageRating");

        res.json(services);

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch services" });
    }
};


/* =========================================================
   GET SINGLE SERVICE + PROVIDER PROFILE
========================================================= */
export const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)

            .populate("provider", "fullName email mobile role averageRating totalReviews");

        if (!service)
            return res.status(404).json({ error: "Service not found" });

        const reviews = await Review.find({ service: service._id })
            .populate("customer", "fullName")
            .sort({ createdAt: -1 });

        res.json({
            service,
            reviewCount: reviews.length,
            reviews
        });

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch service" });
    }
};


import cloudinary from "../config/cloudinary.js";

/* =========================================================
   DELETE SERVICE (SAFE DELETE)
========================================================= */
export const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service)
            return res.status(404).json({ error: "Service not found" });

        if (service.provider.toString() !== req.user._id.toString())
            return res.status(403).json({ error: "Not authorized" });

        // 🔥 Delete images from Cloudinary
        if (service.images && service.images.length > 0) {
            for (const imageUrl of service.images) {

                // Extract public_id from URL
                const parts = imageUrl.split("/");
                const fileName = parts[parts.length - 1];
                const publicId = `sociosphere/${fileName.split(".")[0]}`;

                await cloudinary.uploader.destroy(publicId);
            }
        }

        await service.deleteOne();

        res.json({ message: "Service deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete service" });
    }
};



/* =========================================================
   GET NEARBY SERVICES (GEO SEARCH)
========================================================= */
export const getNearbyServices = async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;

        const latitude = Number(lat);
        const longitude = Number(lng);
        const maxDistance = Number(radius);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ error: "Invalid coordinates" });
        }

        const services = await Service.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: maxDistance
                }
            }
        }).populate("provider", "fullName averageRating");

        res.json(services);

    } catch (err) {
        console.error("Geo search error:", err);
        res.status(500).json({ error: "Failed to fetch nearby services" });
    }
};
