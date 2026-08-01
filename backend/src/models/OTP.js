import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    purpose: {
        type: String,
        enum: [
            "LOGIN",
            "CUSTOMER_SIGNUP",
            "PROVIDER_SIGNUP",
            "ADMIN_SIGNUP"
        ],
        required: true
    },
    expiresAt: Date,
    verified: { type: Boolean, default: false }
});

export default mongoose.model("OTP", otpSchema);
otpSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
    }
});
