import Message from "../models/Message.js";
import Channel from "../models/Channel.js";

/* ✅ SEND MESSAGE */
export const sendMessage = async (req, res) => {
    const { channelId, text } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
    }

    // user must be part of channel
    if (!channel.participants.includes(req.user.id)) {
        return res.status(403).json({ error: "Not part of this channel" });
    }

    const message = await Message.create({
        channel: channelId,
        sender: req.user.id,
        text,
        readBy: [req.user.id]
    });

    // update channel last message
    channel.lastMessage = text;
    channel.lastMessageAt = new Date();
    await channel.save();

    res.status(201).json(message);
};
// MARK MESSAGES AS READ

export const markAsRead = async (req, res) => {
    try {
        const { channelId } = req.body;

        await Message.updateMany(
            {
                channel: channelId,
                readBy: { $ne: req.user._id }
            },
            {
                $addToSet: { readBy: req.user._id }
            }
        );

        res.json({ message: "Messages marked as read" });
    } catch (err) {
        console.error("Mark read error:", err);
        res.status(500).json({ error: "Failed to mark messages as read" });
    }
};


/* ✅ GET MESSAGES OF A CHANNEL */
export const getChannelMessages = async (req, res) => {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
    }

    if (!channel.participants.includes(req.user.id)) {
        return res.status(403).json({ error: "Not part of this channel" });
    }

    const messages = await Message.find({ channel: channelId })
        .populate("sender", "fullName role")
        .sort({ createdAt: 1 });

    res.json(messages);
};
