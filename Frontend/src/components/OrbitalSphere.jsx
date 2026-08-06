import { useEffect, useRef } from "react";

/**
 * OrbitalSphere — a 3D-looking rotating sphere for the website background.
 * Pure CSS 3D (no WebGL/libraries). Solar-Flare palette:
 * magenta core, orange ring, gold orbit. Rotates 24/7 via requestAnimationFrame.
 * Transparent + pointer-events:none so it never blocks the UI.
 */
export default function OrbitalSphere({ size = 340, opacity = 0.35, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    let raf;
    let angle = 0;
    const el = ref.current;
    if (!el) return;
    const tick = () => {
      angle += 0.4;
      const lat = el.querySelector(".os-lat");
      if (lat) lat.style.transform = `rotateX(${angle}deg)`;
      const lon = el.querySelector(".os-lon");
      if (lon) lon.style.transform = `rotateY(${angle * 0.7}deg)`;
      const inner = el.querySelector(".os-inner");
      if (inner) inner.style.transform = `rotate3d(1, 0.6, 0.2, ${angle}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className={`os ${className}`}
      style={{ width: size, height: size, opacity, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <div className="os-orbit" />
      <div className="os-globe">
        <div className="os-inner">
          <div className="os-lat" style={{ transform: "rotateX(0deg)" }} />
          <div className="os-lat" style={{ transform: "rotateX(0deg)", scale: "0.82" }} />
          <div className="os-lat" style={{ transform: "rotateX(0deg)", scale: "0.6" }} />
          <div className="os-lon" style={{ transform: "rotateY(0deg)" }} />
        </div>
      </div>
      <div className="os-glow" />
    </div>
  );
}
