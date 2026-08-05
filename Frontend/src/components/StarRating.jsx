import { motion } from "framer-motion";

/** Reusable star rating — read-only display or interactive input. */
export default function StarRating({ value = 0, onChange, size = "1.2rem", count = 5 }) {
  return (
    <div className="stars" style={{ fontSize: size }}>
      {Array.from({ length: count }).map((_, i) => {
        const star = i + 1;
        const on = star <= Math.round(value);
        if (onChange) {
          return (
            <button
              key={i}
              type="button"
              className={`star-btn ${on ? "on" : ""}`}
              onClick={() => onChange(star)}
            >
              ★
            </button>
          );
        }
        return (
          <motion.span
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 15 }}
            style={{ color: on ? "var(--amber)" : "rgba(255,255,255,0.22)", textShadow: on ? "0 0 12px rgba(255,209,102,0.5)" : "none" }}
          >
            ★
          </motion.span>
        );
      })}
    </div>
  );
}
