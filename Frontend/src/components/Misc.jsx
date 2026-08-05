import { motion } from "framer-motion";
import { Loader2, Inbox } from "lucide-react";

export function Spinner({ size = 22 }) {
  return <Loader2 size={size} className="spin" />;
}

export function FullScreenLoader({ text = "Loading SocioSphere…" }) {
  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="center">
        <motion.div
          style={{ width: 54, height: 54, borderRadius: "50%", margin: "0 auto 18px", background: "var(--grad)" }}
          animate={{ rotate: 360, scale: [1, 1.12, 1] }}
          transition={{ rotate: { duration: 1.4, repeat: Infinity, ease: "linear" }, scale: { duration: 0.9, repeat: Infinity } }}
        />
        <p className="muted">{text}</p>
      </div>
    </div>
  );
}

export function EmptyState({ emoji = "🛰️", title, text, action }) {
  return (
    <motion.div
      className="glass center"
      style={{ padding: "60px 26px" }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ fontSize: "3.4rem", marginBottom: 12 }}>{emoji}</div>
      <h3 className="mb-8">{title}</h3>
      <p className="muted" style={{ maxWidth: 380, margin: "0 auto 22px" }}>{text}</p>
      {action}
    </motion.div>
  );
}

export function TiltCard({ children, className = "", style, max = 10 }) {
  const onMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-3px)`;
  };
  const onLeave = (e) => {
    e.currentTarget.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
  };
  return (
    <div className={`tilt ${className}`} style={style} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

export function Stat({ emoji, value, label }) {
  return (
    <div className="glass center" style={{ padding: "22px 12px" }}>
      <div style={{ fontSize: "1.9rem" }}>{emoji}</div>
      <div className="display" style={{ fontSize: "1.5rem" }}>{value}</div>
      <div className="tiny">{label}</div>
    </div>
  );
}

export function InlineIcon({ children }) {
  return <span style={{ marginRight: 6 }}>{children}</span>;
}
