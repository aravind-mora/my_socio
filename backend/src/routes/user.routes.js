import express from "express";
import auth from "../middleware/auth.js";
import { updateProfile, getCurrentUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", auth, getCurrentUser);
router.put("/me", auth, updateProfile);

export default router;
