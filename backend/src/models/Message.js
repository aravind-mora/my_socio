import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Channel",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        text: {
            type: String,
            required: true,
            trim: true
        },

        readBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
messageSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
    }
});
