import { motion } from "framer-motion";

/**
 * SocioSphere animated logo — a molten sphere with a golden orbit ring.
 * `animate` toggles the draw-in animation (used on the launch screen).
 */
export default function Logo({ size = 130, animate = false, glow = true }) {
  const gid = "ss-grad-" + (Math.random() * 1e9 | 0);

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={glow ? { filter: "drop-shadow(0 0 26px rgba(255,78,205,0.55))" } : undefined}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4ecd" />
          <stop offset="55%" stopColor="#ff7a59" />
          <stop offset="100%" stopColor="#ff9a3d" />
        </linearGradient>
      </defs>

      {/* orbit ring */}
      {animate ? (
        <motion.ellipse
          cx="50" cy="50" rx="44" ry="15"
          stroke={`url(#${gid})`} strokeWidth="3.4"
          transform="rotate(-20 50 50)"
          initial={{ pathLength: 0, opacity: 0, rotate: -140 }}
          animate={{ pathLength: 1, opacity: 1, rotate: -20 }}
          transition={{ duration: 1.1, delay: 0.55, ease: "easeOut" }}
        />
      ) : (
        <ellipse cx="50" cy="50" rx="44" ry="15" stroke={`url(#${gid})`} strokeWidth="3.4" transform="rotate(-20 50 50)" />
      )}

      {/* small orbit moon */}
      <motion.circle
        cx="82" cy="26" r="5" fill="#ffd166"
        initial={animate ? { scale: 0, opacity: 0 } : false}
        animate={animate ? { scale: 1, opacity: 1 } : undefined}
        transition={{ delay: 1.35, type: "spring", stiffness: 300, damping: 12 }}
      />

      {/* planet */}
      {animate ? (
        <motion.circle
          cx="50" cy="50" r="24"
          fill={`url(#${gid})`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 14 }}
        />
      ) : (
        <circle cx="50" cy="50" r="24" fill={`url(#${gid})`} />
      )}

      {/* soft shine on the planet */}
      <circle cx="42" cy="42" r="9" fill="rgba(255,255,255,0.35)" opacity={animate ? 0.4 : 0.5} />

      {/* sparkles */}
      {animate && (
        <>
          <motion.circle cx="14" cy="62" r="2" fill="#ffd166" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: 1.2, duration: 1.4, repeat: Infinity }} />
          <motion.circle cx="30" cy="14" r="1.6" fill="#ff9a3d" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: 1.5, duration: 1.8, repeat: Infinity }} />
        </>
      )}
    </motion.svg>
  );
}
