import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: [
                "NEW_BID",
                "BID_ACCEPTED",
                "SERVICE_BOOKED",
                "PAYMENT_SUCCESS",
                "NEW_REVIEW",
                "NEW_MESSAGE"
            ],
            required: true
        },
        title: String,
        message: String,
        isRead: {
            type: Boolean,
            default: false
        },
        meta: {
            type: Object
        }
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
notificationSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
    }
});
