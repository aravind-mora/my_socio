import express from "express";
import Notification from "../models/Notification.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* GET ALL USER NOTIFICATIONS */
router.get("/", auth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user._id
        }).sort({ createdAt: -1 });

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

/* MARK AS READ */
router.patch("/:id/read", auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification)
            return res.status(404).json({ error: "Not found" });

        if (notification.user.toString() !== req.user._id.toString())
            return res.status(403).json({ error: "Not authorized" });

        notification.isRead = true;
        await notification.save();

        res.json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update notification" });
    }
});
router.get("/unread-count", auth, async (req, res) => {
    const count = await Notification.countDocuments({
        user: req.user._id,
        isRead: false
    });

    res.json({ unread: count });
});

export default router;
