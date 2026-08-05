import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { apiChatbot, errMsg } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PrettyBotText from "./PrettyBotText";

const GREETING = `Hey! 👋 I'm **Sphere-bot**, SocioSphere's friendly assistant.

You can ask me:
• "Find plumbing services near me"
• "Cheapest electricians"
• "How do I become a provider?"

Just say hi to get started! 🪐`;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: "bot", text: GREETING }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef(null);
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [messages, typing, open]);

  /** Best-effort geolocation for "near me" queries (5s cap, never blocks). */
  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000, maximumAge: 600000 }
      );
    });

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    if (!user) {
      toast.info("Sign in to chat with Sphere-bot 🔐");
      navigate("/auth");
      return;
    }
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);

    // hard safety cap so "thinking…" can never hang forever
    const watchdog = setTimeout(() => setTyping(false), 35000);

    try {
      const wantsNear = /near|nearby|close|around/i.test(text);
      const location = wantsNear ? await getLocation() : null;
      const res = await apiChatbot(text, location);
      const reply = res?.reply || res?.response || res?.message;
      if (!reply) throw new Error("Empty reply");
      setMessages((m) => [...m, { from: "bot", text: reply }]);
    } catch (e) {
      toast.error("Chatbot unavailable right now. " + errMsg(e, ""));
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Oops! My brain is offline for a second. Please try again in a moment. 🤖💫" },
      ]);
    } finally {
      clearTimeout(watchdog);
      setTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-strong chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <div className="chat-head">
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(26,8,20,0.25)", display: "grid", placeItems: "center" }}>
                <Bot size={20} />
              </span>
              <div className="grow">
                <div>Sphere-bot</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 500, opacity: 0.75, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1f6f43", display: "inline-block" }} /> online
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#1a0814", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div className="chat-body" ref={bodyRef}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  className={`msg ${m.from}`}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                >
                  {m.from === "bot" ? <PrettyBotText text={m.text} /> : m.text}
                </motion.div>
              ))}
              {typing && (
                <div className="msg bot typing">
                  <span className="typing-dots"><span /> <span /> <span /></span> Sphere-bot is thinking…
                </div>
              )}
            </div>

            <div className="chat-input-row">
              <input
                placeholder="Ask me anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="btn btn-primary btn-sm" onClick={send} disabled={!input.trim() || typing} style={{ borderRadius: "50%", width: 44, height: 44, padding: 0 }}>
                <Send size={17} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        title="Chat with Sphere-bot"
      >
        {open ? <X size={26} /> : <Sparkles size={26} />}
      </motion.button>
    </>
  );
}
