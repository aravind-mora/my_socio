import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
    {
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        price: {
            type: Number,
            required: true
        },

        slots: {
            type: [String],
            required: true
        },
        images: {
            type: [String],
            default: []
        },



        // ✅ NEW: GEO LOCATION
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
                default: "Point"
            },
            coordinates: {
                type: [Number], // [lng, lat]
                required: true
            }
        }
    },
    { timestamps: true }
);

/* ✅ GEO INDEX (IMPORTANT FOR FUTURE NEARBY SEARCH) */
serviceSchema.index({ location: "2dsphere" });

export default mongoose.model("Service", serviceSchema);
serviceSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
    }
});
