import User from "../models/User.js";
import Service from "../models/Service.js";
import { mapUser, mapService } from "../utils/mapper.js";

export const getProviderProfile = async (req, res) => {
    const provider = await User.findById(req.params.providerId);

    if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
    }

    const services = await Service.find({ provider: provider._id });

    res.json({
        provider: mapUser(provider),
        services: services.map(mapService)
    });
};
