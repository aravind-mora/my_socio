import User from "../models/User.js";
import { sendProviderVerifiedEmail } from "../config/mail.js";

export const verifyProvider = async (req, res) => {
    try {
        const provider = await User.findById(req.params.id);

        if (!provider || provider.role !== "SERVICE_PROVIDER") {
            return res.status(404).json({ error: "Provider not found" });
        }

        provider.isVerified = true;
        await provider.save();

        // ✅ Send verification email
        try {
            await sendProviderVerifiedEmail(
                provider.email,
                provider.fullName
            );
        } catch (err) {
            console.log("Verification email failed but provider verified");
        }

        res.json({
            message: "Provider verified successfully"
        });

    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
};

export const getPendingProviders = async (req, res) => {
    try {
        const providers = await User.find({
            role: "SERVICE_PROVIDER",
            isVerified: false
        });

        res.json(providers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load providers" });
    }
};
