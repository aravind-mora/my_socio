import User from "../models/User.js";
import Service from "../models/Service.js";
import { mapUser, mapService } from "../utils/mapper.js";
import mongoose from "mongoose";

export const getProviderProfile = async (req, res) => {
    try {
        const { providerId } = req.params;

        // Guard: non-ObjectId values (like "dashboard") must not crash the server
        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(400).json({ error: "Invalid provider id" });
        }

        const provider = await User.findById(providerId);

        if (!provider) {
            return res.status(404).json({ error: "Provider not found" });
        }

        const services = await Service.find({ provider: provider._id });

        res.json({
            provider: mapUser(provider),
            services: services.map(mapService)
        });
    } catch (err) {
        console.error("Provider profile error:", err);
        res.status(500).json({ error: "Failed to load provider profile" });
    }
};
