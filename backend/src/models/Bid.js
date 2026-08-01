import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
    {
        serviceRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServiceRequest",
            required: true
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        message: {
            type: String
        }
    },
    { timestamps: true }
);

export default mongoose.model("Bid", bidSchema);
bidSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
    }
});
