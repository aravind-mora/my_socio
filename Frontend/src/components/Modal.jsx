import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ open, onClose, children, title, wide = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass glass-strong modal-card"
            style={wide ? { maxWidth: 720 } : undefined}
            initial={{ y: 40, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="row-between mb-20">
                <h2 style={{ fontSize: "1.35rem" }}>{title}</h2>
                <button
                  onClick={onClose}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "var(--text)", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center" }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
