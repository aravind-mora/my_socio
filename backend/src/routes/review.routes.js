import express from "express";
import { createReview } from "../controllers/review.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createReview);

export default router;
