import { createContext, useContext, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const ICONS = { success: "✨", error: "⚠️", info: "💡" };

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message) => {
    const id = ++idSeq;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const toast = useCallback(
    (message, type = "info") => push(type, message),
    [push]
  );
  toast.success = (m) => push("success", m);
  toast.error = (m) => push("error", m);
  toast.info = (m) => push("info", m);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`toast ${t.type}`}
            >
              <span className="toast-icon">{ICONS[t.type]}</span>
              <div>{t.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
