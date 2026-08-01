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

export default passport;