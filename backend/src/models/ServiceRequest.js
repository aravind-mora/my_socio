import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
    {
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        requestedSlot: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "COMPLETED",
                "PAID",
                "CANCELLED",
                "REFUND_REQUESTED",
                "REFUNDED"
            ],

            default: "PENDING"
        },
        paymentStatus: {
            type: String,
            enum: [
                "NONE",
                "PAYMENT_REQUESTED",
                "PAYMENT_PENDING",
                "PAID_PENDING_VERIFICATION",
                "PAID"
            ],
            default: "NONE"
        },

        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment"
        }

    },
    { timestamps: true }
);

export default mongoose.model("ServiceRequest", serviceRequestSchema);
serviceRequestSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
    }
});
