import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is not set in environment variables");
            return; // keep server up so logs/health checks work
        }
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Don't exit — keeps the container alive for health checks and
        // lets you read the real error in logs instead of a silent crash.
        console.error("❌ MongoDB connection failed:");
        console.error(error.message);
    }
};

export default connectDB;
