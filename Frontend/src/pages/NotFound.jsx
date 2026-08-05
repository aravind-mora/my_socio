import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../components/Logo";

export default function NotFound() {
  return (
    <div className="container page center" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <motion.div style={{ display: "inline-block" }} animate={{ y: [0, -14, 0], rotate: [0, -4, 4, 0] }} transition={{ duration: 3, repeat: Infinity }}>
          <Logo size={120} />
        </motion.div>
        <h1 style={{ fontSize: "4rem", margin: "16px 0 6px" }} className="display">4<span className="grad-text">0</span>4</h1>
        <h2 className="mb-12">This planet drifted away 🛸</h2>
        <p className="muted mb-20" style={{ maxWidth: 380, margin: "0 auto 22px" }}>The page you're looking for doesn't exist or has moved. Let's get you back to the sphere.</p>
        <Link to="/home" className="btn btn-primary">Back to home</Link>
      </motion.div>
    </div>
  );
}
