import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, MessageCircle, Star, Wallet, Sparkles, Users, Zap, Heart } from "lucide-react";
import Logo from "../components/Logo";
import { TiltCard, Stat } from "../components/Misc";

const HOW = [
  { emoji: "🔍", title: "Discover", text: "Search hundreds of trusted local services with ratings, reviews and fair prices." },
  { emoji: "📅", title: "Book", text: "Pick a date & time, confirm with a secure demo payment — it takes under a minute." },
  { emoji: "💬", title: "Chat live", text: "A private channel opens instantly so you and the provider can coordinate in real time." },
  { emoji: "⭐", title: "Review", text: "After the job, rate and review. Great work gets rewarded with visibility." },
];

const FEATURES = [
  { icon: <ShieldCheck size={22} />, title: "Verified community", text: "Email OTP verification and ratings keep the sphere trustworthy." },
  { icon: <MessageCircle size={22} />, title: "Real-time channels", text: "Bookings auto-create a chat channel — no phone numbers exchanged." },
  { icon: <Wallet size={22} />, title: "Demo payments", text: "A realistic checkout to feel the flow — no real money, ever." },
  { icon: <Sparkles size={22} />, title: "Sphere-bot", text: "A Gemini-powered assistant that answers your questions instantly." },
];

const FAQS = [
  { q: "Is SocioSphere free to use?", a: "Yes! Booking is free. Providers can list services free too. Our demo payments never charge real money." },
  { q: "How do providers get paid?", a: "In this demo build, payments are simulated. In production the amount would be released to the provider after the customer confirms completion." },
  { q: "What if I need to cancel?", a: "You can cancel pending or confirmed bookings from your Activity page anytime before the service starts." },
  { q: "How does the channel work?", a: "When a provider starts a service, a private channel is created and both sides can chat in real time until the job is done." },
];

export default function About() {
  return (
    <div className="container page">
      {/* hero */}
      <section className="hero">
        <motion.div className="hero-badge" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Heart size={14} /> Made for neighbourhoods
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          One sphere. <span className="grad-text">Every skill.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          SocioSphere is a social services marketplace — a place where people who need a hand and
          people who can lend one find each other. Friendly, fast, and a little bit cosmic. 🪐
        </motion.p>
        <motion.div className="row" style={{ justifyContent: "center", gap: 14 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Link to="/auth" className="btn btn-primary">Join the sphere</Link>
          <Link to="/home" className="btn btn-ghost">Browse services</Link>
        </motion.div>
      </section>

      {/* stats */}
      <motion.div className="grid-stats mt-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <TiltCard><Stat emoji="🧰" value="1,200+" label="Services" /></TiltCard>
        <TiltCard><Stat emoji="👥" value="850+" label="Providers" /></TiltCard>
        <TiltCard><Stat emoji="🏘️" value="40+" label="Cities" /></TiltCard>
        <TiltCard><Stat emoji="💬" value="25k+" label="Chat messages" /></TiltCard>
      </motion.div>

      {/* how it works */}
      <h2 className="section-title center mt-40">How it <span className="grad-text">works</span></h2>
      <div className="grid-services mt-20" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {HOW.map((h, i) => (
          <motion.div key={i} className="glass card-hover" style={{ padding: 26 }} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div style={{ fontSize: "2.4rem", marginBottom: 12 }}>{h.emoji}</div>
            <h3 className="mb-8" style={{ fontSize: "1.1rem" }}>{h.title}</h3>
            <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.6 }}>{h.text}</p>
          </motion.div>
        ))}
      </div>

      {/* features */}
      <h2 className="section-title center mt-40">Why people <span className="grad-text-lime">love</span> it</h2>
      <div className="grid-services mt-20" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {FEATURES.map((f, i) => (
          <motion.div key={i} className="glass card-hover" style={{ padding: 24 }} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <span style={{ display: "inline-grid", placeItems: "center", width: 46, height: 46, borderRadius: 14, background: "var(--grad)", color: "#1a0814", marginBottom: 14 }}>{f.icon}</span>
            <h3 className="mb-8" style={{ fontSize: "1.05rem" }}>{f.title}</h3>
            <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.6 }}>{f.text}</p>
          </motion.div>
        ))}
      </div>

      {/* FAQ */}
      <h2 className="section-title center mt-40">Common <span className="grad-text">questions</span></h2>
      <div style={{ maxWidth: 720, margin: "20px auto 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {FAQS.map((f, i) => (
          <motion.details key={i} className="glass" style={{ padding: "18px 22px", borderRadius: 18 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1rem" }}>{f.q}</summary>
            <p className="muted mt-12" style={{ fontSize: "0.94rem", lineHeight: 1.65 }}>{f.a}</p>
          </motion.details>
        ))}
      </div>

      {/* CTA */}
      <motion.div className="glass mt-40 center" style={{ padding: "44px 26px", background: "var(--grad-soft)", borderColor: "rgba(255,78,205,0.35)" }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <Logo size={80} />
        <h2 style={{ fontSize: "1.7rem", margin: "12px 0 8px" }}>Ready to join the sphere?</h2>
        <p className="muted" style={{ marginBottom: 22 }}>Free to join. Two minutes to set up. <Users size={14} style={{ verticalAlign: "-2px" }} /> Thousands already here.</p>
        <div className="row" style={{ justifyContent: "center", gap: 12 }}>
          <Link to="/auth?mode=signup&role=customer" className="btn btn-primary">Sign up as customer</Link>
          <Link to="/auth?mode=signup&role=provider" className="btn btn-lime"><Zap size={16} /> Sign up as provider</Link>
        </div>
      </motion.div>
    </div>
  );
}
