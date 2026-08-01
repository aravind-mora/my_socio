import express from "express";
import { getMyChannels, debugAllChannels } from "../controllers/channel.controller.js";
import auth from "../middleware/auth.js";
import { repairChannelParticipants } from "../controllers/channel.controller.js";
const router = express.Router();

router.get("/", auth, getMyChannels);
router.get("/debug/all", debugAllChannels);
router.post("/repair", repairChannelParticipants);

export default router;
