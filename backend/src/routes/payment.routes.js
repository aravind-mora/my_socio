import express from "express";
import { createPayment, verifyPayment } from "../controllers/payment.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/create", auth, createPayment);
router.post("/verify", auth, verifyPayment);

export default router;
