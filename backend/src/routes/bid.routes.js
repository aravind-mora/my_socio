import express from "express";
import auth from "../middleware/auth.js";
import {
    placeBid,
    getCustomerBids,
    withdrawBid
} from "../controllers/bid.controller.js";

const router = express.Router();

router.post("/", auth, placeBid);
router.get("/customer", auth, getCustomerBids);
router.delete("/:id", auth, withdrawBid);

export default router;
