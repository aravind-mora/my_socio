import dotenv from "dotenv";
dotenv.config();
console.log("ENV CHECK → SMTP_HOST:", process.env.SMTP_HOST);
console.log("ENV CHECK → FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("ENV CHECK → BACKEND_URL:", process.env.BACKEND_URL);

import express from "express";
import http from "http";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";

// ===== DB & MAIL =====
import connectDB from "./config/db.js";
import "./config/mail.js";

// ===== MODELS =====
import User from "./models/User.js";

// ===== ROUTES =====
import authRoutes from "./routes/auth.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import requestRoutes from "./routes/request.routes.js";
import bidRoutes from "./routes/bid.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import messageRoutes from "./routes/message.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import providerRoutes from "./routes/provider.routes.js";
import userRoutes from "./routes/user.routes.js";
import passwordRoutes from "./routes/password.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import passport from "./config/passport.js";
// ===== EXPRESS APP =====
const app = express();
app.set('trust proxy', 1); // Required for Render/Heroku reverse proxy - fixes https redirect_uri_mismatch
const server = http.createServer(app);

// ===== SOCKET.IO =====
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Attach io to every request
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(cors({
    origin: function(origin, callback) {
        const allowed = [
            process.env.FRONTEND_URL,
            "http://localhost:5173",
            "http://localhost:3000"
        ].filter(Boolean);
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// ===== RATE LIMITING =====
// Relaxed in development; in production you can override via RATE_LIMIT_MAX
// (100/15min default is too low for real usage — set e.g. 1000).
const IS_DEV = process.env.NODE_ENV === "development";
const RATE_MAX = Number(process.env.RATE_LIMIT_MAX) || (IS_DEV ? 5000 : 1000);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: RATE_MAX,
    message: { error: "Too many requests, please try again later" }
});

app.use(limiter);

// ===== API ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payment", paymentRoutes);

app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
    res.send("SocioSphere Backend Running 🚀");
});

// ===== SOCKET AUTH (JWT) =====
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("No token provided"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) return next(new Error("User not found"));

        socket.user = user;
        next();
    } catch (err) {
        next(new Error("Socket authentication failed"));
    }
});

// ===== SOCKET EVENTS =====
io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.user.fullName);

    const userId = socket.user._id;
    socket.join(`user-${userId}`);

    socket.on("join-channel", (channelId) => {
        socket.join(channelId);
    });

    socket.on("send-message", ({ channelId, text }) => {
        io.to(channelId).emit("new-message", {
            channelId,
            sender: {
                id: socket.user._id,
                fullName: socket.user.fullName,
                role: socket.user.role
            },
            text,
            createdAt: new Date()
        });
    });

    socket.on("typing", ({ channelId }) => {
        socket.to(channelId).emit("typing", {
            user: socket.user.fullName
        });
    });

    socket.on("stop-typing", ({ channelId }) => {
        socket.to(channelId).emit("stop-typing");
    });

    socket.on("mark-read", ({ channelId }) => {
        socket.to(channelId).emit("messages-seen", {
            channelId,
            seenBy: socket.user.fullName
        });
    });

    socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.user.fullName);
    });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

connectDB();

server.listen(PORT, () => {
    console.log("🚀 Server + Socket running on port", PORT);
});
