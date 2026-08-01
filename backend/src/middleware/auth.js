import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
    try {
        // TEMP DEBUG (keep for now)
        console.log("HEADERS RECEIVED:", req.headers);

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Authorization token missing"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("AUTH ERROR:", err.message);
        return res.status(401).json({ error: "Invalid token" });
    }
};

export default auth;
