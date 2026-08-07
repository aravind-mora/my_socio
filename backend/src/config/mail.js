import dotenv from "dotenv";
dotenv.config();

// Uses Brevo HTTP API — no SMTP ports needed (works on Render free tier)
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM = { name: "SocioSphere", email: process.env.OTP_EMAIL || "sociosphere.project@gmail.com" };

async function sendEmail(to, subject, html) {
    console.log("BREVO_API_KEY present:", !!process.env.BREVO_API_KEY);
    console.log("BREVO_API_KEY starts with:", process.env.BREVO_API_KEY?.slice(0, 12));
    const res = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
            sender: FROM,
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Brevo API error: ${err}`);
    }
    console.log("✅ Email sent to:", to);
}

export const sendOTPEmail = async (to, otp) => {
    await sendEmail(to, "Your OTP Code - SocioSphere", `
        <h2>OTP Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:8px">${otp}</h1>
        <p>Valid for 5 minutes. Do not share this with anyone.</p>
    `);
};

export const sendResetPasswordEmail = async (email, resetLink) => {
    // build an Android app deep link from the token in the web link
    const token = (String(resetLink).split("reset-password/")[1] || "").split("?")[0];
    const appLink = token ? `com.sociosphere.neon://reset-password/${token}` : null;
    await sendEmail(email, "Reset Your Password - SocioSphere", `
        <h3>Password Reset Request</h3>
        ${appLink ? `
        <p>Open in the <strong>SocioSphere app</strong>:</p>
        <a href="${appLink}" style="display:inline-block;background:#00e676;color:#04140b;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold;margin:6px 0;">Reset in App</a>
        <br/>` : ""}
        <p>Or click the link below in your browser:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
    `);
};

export const sendSignupEmail = async (email, fullName) => {
    try {
        await sendEmail(email, "🎉 Welcome to SocioSphere!", `
            <h2>Hello ${fullName},</h2>
            <p>Thank you for joining <b>SocioSphere</b>!</p>
            <p>Best Regards,<br/>SocioSphere Team 🚀</p>
        `);
    } catch (err) { console.error("❌ Signup Email Error:", err.message); }
};

export const sendLoginEmail = async (email, fullName) => {
    try {
        await sendEmail(email, "👋 Welcome Back to SocioSphere", `
            <h2>Hi ${fullName},</h2>
            <p>You have successfully logged in. If this wasn't you, please reset your password immediately.</p>
            <p>SocioSphere Team</p>
        `);
    } catch (err) { console.error("❌ Login Email Error:", err.message); }
};

export const sendUpgradeEmail = async (email, fullName) => {
    try {
        await sendEmail(email, "🚀 You're Now a Service Provider!", `
            <h2>Congratulations ${fullName}! 🎉</h2>
            <p>Your account has been upgraded to <b>Service Provider</b> on SocioSphere.</p>
            <p>SocioSphere Team</p>
        `);
    } catch (err) { console.error("❌ Upgrade Email Error:", err.message); }
};

export const sendProviderVerifiedEmail = async (email, fullName) => {
    try {
        await sendEmail(email, "✅ Your Provider Account Has Been Verified!", `
            <h2>Congratulations ${fullName}! 🎉</h2>
            <p>Your Service Provider account has been <b>successfully verified</b>.</p>
            <p>SocioSphere Team 🚀</p>
        `);
    } catch (err) { console.error("❌ Verified Email Error:", err.message); }
};

export const sendPaymentSuccessEmail = async (email, fullName, amount) => {
    try {
        await sendEmail(email, "💳 Payment Successful - SocioSphere", `
            <h2>Hello ${fullName},</h2>
            <p>Your payment of <b>₹${amount}</b> has been successfully completed.</p>
            <p>SocioSphere Team 🚀</p>
        `);
    } catch (err) { console.error("❌ Payment Email Error:", err.message); }
};
