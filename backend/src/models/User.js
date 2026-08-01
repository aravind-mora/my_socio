import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },

    role: {
        type: String,
        enum: ['CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN'],
        default: 'CUSTOMER'
    },

    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },

    otpVerified: { type: Boolean, default: false },
    isVerified: {
        type: Boolean,
        default: false
    },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpire: {
        type: Date
    },


}, { timestamps: true });

export default mongoose.model("User", userSchema);
userSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
    }
});
