import Channel from "../models/Channel.js";

export const getMyChannels = async (req, res) => {
    const channels = await Channel.find({
        participants: req.user._id
    })
        .populate("participants", "fullName email role")
        .populate("serviceRequest");

    res.json(channels);
};
export const debugAllChannels = async (req, res) => {
    const channels = await Channel.find({});
    res.json(channels);
};
import ServiceRequest from "../models/ServiceRequest.js";

export const repairChannelParticipants = async (req, res) => {
    const { serviceRequestId } = req.body;

    const request = await ServiceRequest.findById(serviceRequestId);
    if (!request) {
        return res.status(404).json({ error: "ServiceRequest not found" });
    }

    const channel = await Channel.findOne({ serviceRequest: serviceRequestId });
    if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
    }

    channel.participants = [
        request.customer,
        request.provider
    ];

    await channel.save();

    res.json({
        message: "Channel participants repaired",
        channel
    });
};
