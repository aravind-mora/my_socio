import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

/**
 * Netflix / JioHotstar style intro — logo draws itself, pulses, then
 * auto-forwards to auth (or straight home if already signed in).
 */
export default function Launch() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [phase, setPhase] = useState("draw"); // draw -> pop -> done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("pop"), 2100);
    const t2 = setTimeout(() => navigate(user ? "/home" : "/auth", { replace: true }), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [navigate, user]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
      <div className="bg-blobs"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>

      <motion.div
        style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          animate={phase === "pop" ? { scale: [1, 1.28, 1], rotate: [0, 6, -6, 0] } : { scale: 1 }}
          transition={phase === "pop" ? { duration: 0.8, times: [0, 0.5, 0.85, 1] } : {}}
          style={{ display: "grid", placeItems: "center" }}
        >
          <Logo size={170} animate />
        </motion.div>

        <motion.h1
          className="display"
          style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)", letterSpacing: 1 }}
          initial={{ y: 34, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.7, ease: [0.22, 1.4, 0.36, 1] }}
        >
          Socio<span className="grad-text">Sphere</span>
        </motion.h1>

        <motion.p
          className="muted"
          style={{ fontSize: "1.05rem", maxWidth: 420 }}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          Your neighbourhood, one sphere away 🪐
        </motion.p>

        <motion.div
          className="row"
          style={{ gap: 8, marginTop: 8 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--grad)" }}
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.16 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
