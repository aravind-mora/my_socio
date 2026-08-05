import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, ChevronRight, Send, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiMyChannels, apiGetService, errMsg } from "../api/client";
import { statusInfo, timeAgo, initialsOf, fmtMoney } from "../utils/helpers";
import { EmptyState, FullScreenLoader, Spinner } from "../components/Misc";

/**
 * My Channels — every conversation attached to a service request.
 * Backed by GET /api/channels (participants + serviceRequest populated).
 */
export default function Channels() {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();

    const [channels, setChannels] = useState([]);
    const [serviceTitles, setServiceTitles] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const meId = String(user?.id || user?._id || "");

    const load = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true); else setLoading(true);
        setError("");
        try {
            const res = await apiMyChannels();
            const list = Array.isArray(res) ? res : [];

            // WhatsApp-style: sort by most recent activity (lastMessageAt or updatedAt)
            const sorted = [...list].sort((a, b) => {
                const ta = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
                const tb = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
                return tb - ta; // newest first
            });
            setChannels(sorted);

            // best-effort: resolve service titles (service isn't populated by the backend)
            const ids = [
                ...new Set(
                    list
                        .map((c) => c.serviceRequest?.service)
                        .filter((s) => s && typeof s === "string")
                ),
            ].slice(0, 20);
            const titles = {};
            await Promise.all(
                ids.map(async (sid) => {
                    try {
                        const data = await apiGetService(sid);
                        const s = data?.service || data;
                        titles[sid] = s?.title || "Service";
                    } catch { titles[sid] = "Service"; }
                })
            );
            setServiceTitles(titles);
        } catch (e) {
            setError(errMsg(e, "Couldn't load your channels."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <FullScreenLoader text="Loading your channels…" />;

    const otherOf = (c) =>
        (c.participants || []).find((p) => String(p.id || p._id) !== meId) || {};

    return (
        <div className="container page">
            <div className="row-between wrap mb-20" style={{ gap: 12 }}>
                <div>
                    <motion.h1 className="section-title" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                        My <span className="grad-text">Channels</span> 💬
                    </motion.h1>
                    <p className="muted">
                        Every conversation tied to a service request — when a bid is accepted, a channel opens here.
                    </p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={refreshing}>
                    {refreshing ? <Spinner size={15} /> : <RefreshCw size={15} />} Refresh
                </button>
            </div>

            {error ? (
                <EmptyState
                    emoji="📡"
                    title="Couldn't load channels"
                    text={error}
                    action={<button className="btn btn-primary" onClick={load}>Retry</button>}
                />
            ) : channels.length === 0 ? (
                <EmptyState
                    emoji="🪐"
                    title="No channels yet"
                    text="When a provider's bid is accepted on one of your requests, a private channel is created automatically and shows up here."
                    action={<button className="btn btn-primary" onClick={() => navigate("/home")}>Browse services</button>}
                />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {channels.map((c, i) => {
                        const id = c.id || c._id;
                        const other = otherOf(c);
                        const sr = c.serviceRequest || {};
                        const st = statusInfo(sr.status);
                        const sid = sr.service;
                        const title = serviceTitles[sid] || (sid && typeof sid === "object" ? sid.title : null) || "Service request";

                        return (
                            <motion.button
                                key={id}
                                className="glass card-hover"
                                style={{
                                    width: "100%", cursor: "pointer", textAlign: "left", padding: "16px 18px",
                                    display: "flex", alignItems: "center", gap: 14, fontFamily: "inherit", color: "inherit",
                                }}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => navigate(`/channel/${id}`)}
                            >
                                <span className="avatar avatar-lg">
                                    {other.avatar ? <img src={other.avatar} alt="" /> : initialsOf(other.fullName)}
                                </span>

                                <div className="grow" style={{ minWidth: 0 }}>
                                    <div className="row-between wrap" style={{ gap: 6 }}>
                                        <strong style={{ fontSize: "1.02rem" }}>{other.fullName || "Participant"}</strong>
                                        <span className="tiny">{timeAgo(c.lastMessageAt || c.updatedAt)}</span>
                                    </div>
                                    <div className="tiny" style={{ marginTop: 3, opacity: 0.9 }}>
                                        🧰 {title} {sr.requestedSlot ? `· ${sr.requestedSlot}` : ""} {sr.price ? `· ${fmtMoney(sr.price)}` : ""}
                                    </div>
                                    <div className="tiny" style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
                                        <Send size={12} />
                                        <span style={{ color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "55vw" }}>
                                            {c.lastMessage || "Say hello to start the conversation…"}
                                        </span>
                                    </div>
                                </div>

                                <span className="status-badge" style={{ color: st.color, borderColor: st.color + "44", flexShrink: 0 }}>
                                    <span className="status-dot" style={{ background: st.color }} /> {st.label}
                                </span>
                                <ChevronRight size={18} color="var(--text-faint)" style={{ flexShrink: 0 }} />
                            </motion.button>
                        );
                    })}

                    <div className="center tiny mt-12" style={{ opacity: 0.7 }}>
                        <ShieldCheck size={13} style={{ verticalAlign: "-2px" }} /> Channels are private — only you and the other participant can see them.
                    </div>
                </div>
            )}
        </div>
    );
}
