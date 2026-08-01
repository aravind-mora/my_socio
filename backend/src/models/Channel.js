import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
    {
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }],

        serviceRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServiceRequest",
            required: true
        },

        lastMessage: {
            type: String,
            default: ""
        },

        lastMessageAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    });

export default mongoose.model("Channel", channelSchema);
channelSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
    }
});
