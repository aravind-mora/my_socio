import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL
    || `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`;

console.log("=== PASSPORT INIT ===");
console.log("CALLBACK_URL:", CALLBACK_URL);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING");
console.log("====================");

// Register the Google strategy ONLY if credentials exist.
// Without this guard, missing env vars throw "OAuth2Strategy requires a
// clientID option" at import time → server crashes before listening →
// container health check fails. Now the server boots and only /auth/google
// errors, while logs clearly say GOOGLE_CLIENT_ID is MISSING.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const selectedRole =
            req.query.role === "SERVICE_PROVIDER"
              ? "SERVICE_PROVIDER"
              : "CUSTOMER";

          let user = await User.findOne({
            email: profile.emails[0].value
          });

          if (!user) {
            user = await User.create({
              fullName: profile.displayName,
              email: profile.emails[0].value,
              mobile: "0000000000",
              password: "google-oauth",
              role: selectedRole,
              isVerified: true,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log("✅ Google OAuth strategy registered");
} else {
  console.warn("⚠️  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing — Google login disabled (server keeps running).");
}

export default passport;
