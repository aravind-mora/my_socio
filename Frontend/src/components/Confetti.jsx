import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#ff4ecd", "#ff9a3d", "#ffd166", "#b6ff5c", "#5cf2c9", "#a78bfa"];

/** Burst of falling confetti — used on payment success & OTP verified. */
export default function Confetti({ count = 90 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2.4 + Math.random() * 2.2,
        rotate: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 240,
      })),
    [count]
  );

  return (
    <>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}vw`,
            width: p.w,
            height: p.h,
            background: p.color,
            borderRadius: p.id % 3 === 0 ? "50%" : 3,
          }}
          initial={{ y: -40, opacity: 1, rotate: 0 }}
          animate={{ y: "105vh", opacity: [1, 1, 0.6], rotate: p.rotate, x: p.drift }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </>
  );
}
