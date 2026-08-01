import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service"
    },
    amount: Number,
    status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED"],
        default: "PENDING"
    }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
