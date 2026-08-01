import express from "express";
import { sendMessage, getChannelMessages, markAsRead } from "../controllers/message.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, sendMessage);
router.get("/:channelId", auth, getChannelMessages);
router.post("/read", auth, markAsRead);

export default router;
