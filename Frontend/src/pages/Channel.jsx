import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Phone, Video, CheckCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiMyChannels, apiGetMessages, apiSendMessage, apiMarkMessagesRead, socketConnect, errMsg } from "../api/client";
import { fmtDateTime, initialsOf, fmtMoney, statusInfo } from "../utils/helpers";
import { FullScreenLoader, EmptyState, Spinner } from "../components/Misc";

/**
 * Real-time channel chat.
 * REST for persistence + Socket.io for live push (auth via handshake token),
 * with a light polling fallback so it works even if sockets are blocked.
 */
export default function Channel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const seenRef = useRef(new Set());
  const meId = String(user?.id || user?._id || "");

  const scrollBottom = (smooth = true) => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: 999999, behavior: smooth ? "smooth" : "auto" });
  };

  const loadMessages = useCallback(async (silent = false) => {
    try {
      const res = await apiGetMessages(id);
      const list = Array.isArray(res) ? res : [];
      list.forEach((m) => seenRef.current.add(`${m.sender?.id || m.sender?._id}|${m.text}|${m.createdAt}`));
      setMessages(list);
      if (!silent) scrollBottom(true);
    } catch { /* polling failures are fine */ }
  }, [id]);

  /* ----- initial load: find channel from my channels + messages ----- */
  useEffect(() => {
    (async () => {
      try {
        const channels = await apiMyChannels();
        const ch = (Array.isArray(channels) ? channels : []).find((c) => String(c.id || c._id) === String(id));
        if (!ch) throw new Error("Channel not found or you're not a participant.");
        setChannel(ch);
        setLoading(false);
        await loadMessages(true);
        apiMarkMessagesRead(id).catch(() => { });
        scrollBottom(true);
      } catch (e) {
        setError(errMsg(e, "Channel not found or you're not a participant."));
        setLoading(false);
      }
    })();
  }, [id, loadMessages]);

  /* ----- socket ----- */
  useEffect(() => {
    if (!id || !meId) return;
    const socket = socketConnect();
    socketRef.current = socket;
    socket.on("connect", () => {
      setOnline(true);
      socket.emit("join-channel", id);
    });
    socket.on("disconnect", () => setOnline(false));
    socket.on("connect_error", () => setOnline(false));

    socket.on("new-message", (msg) => {
      const key = `${msg.sender?.id}|${msg.text}|${msg.createdAt}`;
      if (seenRef.current.has(key)) return; // already persisted via REST
      seenRef.current.add(key);
      setMessages((m) => [...m, { ...msg, sender: msg.sender || {} }]);
      scrollBottom(true);
    });
    socket.on("typing", ({ user: name }) => setTypingUser(name || "Someone"));
    socket.on("stop-typing", () => setTypingUser(null));
    socket.on("messages-seen", () => setSeen(true));

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [id, meId]);

  /* ----- polling fallback ----- */
  useEffect(() => {
    if (!id) return;
    const t = setInterval(() => loadMessages(true), 4000);
    return () => clearInterval(t);
  }, [id, loadMessages]);

  const [typingUser, setTypingUser] = useState(null);
  const [seen, setSeen] = useState(false);

  if (loading) return <FullScreenLoader text="Opening channel…" />;
  if (error || !channel) return <div className="container page"><EmptyState emoji="📵" title="Channel unavailable" text={error} action={<button className="btn btn-primary" onClick={() => navigate("/activity")}>Back to activity</button>} /></div>;

  const serviceRequest = channel.serviceRequest || {};
  const service = serviceRequest.service || {};
  const other = (channel.participants || []).find((p) => String(p.id || p._id) !== meId) || {};
  const otherName = other.fullName || "Participant";
  const st = statusInfo(serviceRequest.status);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const saved = await apiSendMessage(id, text);
      seenRef.current.add(`${meId}|${text}|${saved.createdAt}`);
      setInput("");
      inputRef.current?.focus();
      // optimistic local append
      setMessages((m) => [...m, { ...saved, sender: { id: meId, fullName: user?.fullName } }]);
      // notify others live
      socketRef.current?.emit("send-message", { channelId: id, text });
      scrollBottom(true);
    } catch (e) {
      toast.error(errMsg(e, "Couldn't send message. Check your connection."));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socketRef.current?.emit("typing", { channelId: id });
  };

  return (
    <div className="container page" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 90px)", maxHeight: "860px" }}>
      <button className="btn btn-ghost btn-sm mb-12" style={{ alignSelf: "flex-start" }} onClick={() => navigate("/channels")}>
        <ArrowLeft size={15} /> Back to channels
      </button>

      <div className="glass glass-strong" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        {/* header */}
        <div className="row" style={{ gap: 13, padding: "16px 20px", borderBottom: "1px solid var(--stroke)" }}>
          <span className="avatar avatar-lg">{initialsOf(otherName)}</span>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 8 }}>
              <strong style={{ fontSize: "1.05rem" }}>{otherName}</strong>
              <span className={`status-badge`} style={{ color: online ? "#34d399" : "var(--text-faint)", borderColor: (online ? "#34d399" : "#94a3b8") + "44" }}>
                <span className="status-dot" style={{ background: online ? "#34d399" : "#94a3b8" }} /> {online ? "online" : "offline"}
              </span>
            </div>
            <div className="tiny" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60vw" }}>
              {service.title || "Service"} {service.price ? `· ${fmtMoney(service.price)}` : ""} · slot: {serviceRequest.requestedSlot || "—"}
            </div>
          </div>
          <span className="status-badge" style={{ color: st.color, borderColor: st.color + "44" }}><span className="status-dot" style={{ background: st.color }} /> {st.label}</span>
          <button className="btn btn-ghost btn-sm" title="Call (demo)" onClick={() => toast.info("📞 Demo: calls coming soon!")}><Phone size={16} /></button>
          <button className="btn btn-ghost btn-sm" title="Video (demo)" onClick={() => toast.info("🎥 Demo: video calls coming soon!")}><Video size={16} /></button>
        </div>

        {/* messages */}
        <div className="chat-body" style={{ flex: 1, background: "transparent" }} ref={bodyRef}>
          <div className="center tiny" style={{ marginBottom: 10 }}>
            <ShieldCheck size={12} style={{ verticalAlign: "-2px" }} /> Channel for request #{String(serviceRequest.id || serviceRequest._id).slice(0, 8)} · live via socket.io {online ? "🟢" : "🟡"}
          </div>
          {messages.length === 0 && (
            <div className="center" style={{ margin: "auto", padding: 30 }}>
              <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>🪐</div>
              <p className="muted">No messages yet. Say hi to {otherName}!</p>
            </div>
          )}
          {messages.map((m, i) => {
            const mine = String(m.sender?.id || m.sender?._id) === meId;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className={`msg ${mine ? "user" : "bot"}`} style={{ marginBottom: 4 }}>
                  {!mine && <div className="tiny" style={{ fontWeight: 700, marginBottom: 2, opacity: 0.7 }}>{m.sender?.fullName || "Them"}</div>}
                  {m.text || m.content}
                  <span className="tiny" style={{ display: "block", marginTop: 4, opacity: 0.6, fontSize: "0.66rem" }}>
                    {fmtDateTime(m.createdAt)} {mine && <CheckCheck size={11} style={{ verticalAlign: "-1px" }} />}
                  </span>
                </div>
              </motion.div>
            );
          })}
          {typingUser && <div className="msg bot typing">{typingUser} is typing… ✍️</div>}
          {seen && <div className="tiny center" style={{ opacity: 0.6 }}>✅ messages seen</div>}
        </div>

        {/* input */}
        <div className="chat-input-row">
          <input
            ref={inputRef}
            placeholder={`Message ${otherName}…`}
            value={input}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
              if (e.key === "Backspace") socketRef.current?.emit("stop-typing", { channelId: id });
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={send} disabled={!input.trim() || sending} style={{ borderRadius: "50%", width: 46, height: 46, padding: 0 }}>
            {sending ? <Spinner size={17} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
