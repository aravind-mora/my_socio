import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        comment: String
    },
    { timestamps: true }

);
reviewSchema.index({ service: 1, customer: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
reviewSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
    }
});
