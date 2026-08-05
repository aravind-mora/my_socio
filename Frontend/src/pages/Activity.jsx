import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, MessageCircle, CheckCircle2, XCircle, Star, Wallet, ChevronRight, HandCoins, BadgeCheck, Gavel } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  apiCustomerRequests, apiProviderRequests, apiCustomerBids, apiPlaceBid, apiWithdrawBid,
  apiAcceptBid, apiCancelRequest, apiMarkRequestCompleted, apiRequestPayment,
  apiVerifyPaymentByProvider, apiMyChannels, apiGetServices, apiCreateReview, errMsg,
} from "../api/client";
import { statusInfo, paymentStatusInfo, fmtMoney, fmtDateTime, categoryArt, gradFor, initialsOf } from "../utils/helpers";
import { REQUEST_STATUSES, PAYMENT_STATUSES } from "../config";
import { EmptyState, FullScreenLoader, Spinner } from "../components/Misc";
import StarRating from "../components/StarRating";
import Modal from "../components/Modal";

export default function Activity() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isProvider } = useAuth();

  const [tab, setTab] = useState(isProvider ? "orders" : "mine"); // providers: orders | customers: mine
  const [statusFilter, setStatusFilter] = useState("ALL"); // status filter chip
  const [sortDir, setSortDir] = useState("newest"); // newest | oldest
  const [mine, setMine] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bids, setBids] = useState([]);
  const [channels, setChannels] = useState([]);
  const [servicesMap, setServicesMap] = useState({});
  const [placedBids, setPlacedBids] = useState({}); // requestId -> my bidId
  const [loading, setLoading] = useState(true);

  /* persist my placed bid ids locally (backend has no "my bids" endpoint) */
  const readPlacedBids = () => {
    try { return JSON.parse(localStorage.getItem("sociosphere_my_bids") || "{}"); }
    catch { return {}; }
  };
  const writePlacedBids = (map) => {
    try { localStorage.setItem("sociosphere_my_bids", JSON.stringify(map)); } catch { /* ignore */ }
    setPlacedBids(map);
  };
  const [busyId, setBusyId] = useState(null);
  const [bidTarget, setBidTarget] = useState(null);
  const [bidForm, setBidForm] = useState({ amount: "", message: "" });
  const [bidBusy, setBidBusy] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPlacedBids(readPlacedBids());
    try {
      // Everyone can be a customer (request + accept bids); providers ALSO
      // receive requests on their own services. So always fetch both sides.
      const [m, o, b, ch, sv] = await Promise.all([
        apiCustomerRequests().catch(() => []),
        isProvider ? apiProviderRequests().catch(() => []) : Promise.resolve([]),
        apiCustomerBids().catch(() => []),
        apiMyChannels().catch(() => []),
        apiGetServices().catch(() => []),
      ]);
      setMine(Array.isArray(m) ? m : []);
      setOrders(Array.isArray(o) ? o : []);
      setBids(Array.isArray(b) ? b : []);
      setChannels(Array.isArray(ch) ? ch : []);
      const map = {};
      (Array.isArray(sv) ? sv : []).forEach((s) => (map[s.id || s._id] = s));
      setServicesMap(map);
      // remember bids I (provider) placed this session
      const placed = {};
      (Array.isArray(b) ? b : []).forEach((bid) => {
        if (bid.provider?.id && String(bid.provider.id) === String(user?.id)) {
          placed[bid.serviceRequest?.id || bid.serviceRequest?._id] = bid.id || bid._id;
        }
      });
      setPlacedBids(placed);
    } catch (e) {
      toast.error(errMsg(e, "Couldn't load your activity."));
    } finally {
      setLoading(false);
    }
  }, [isProvider, user, toast]);

  useEffect(() => { load(); }, [load]);

  const myId = user?.id || user?._id;

  const channelFor = (requestId) =>
    channels.find((c) => String(c.serviceRequest?.id || c.serviceRequest?._id) === String(requestId));

  const openChannel = async (requestId) => {
    setBusyId("ch:" + requestId);
    try {
      let ch = channelFor(requestId);
      if (!ch) {
        const list = await apiMyChannels().catch(() => []);
        setChannels(Array.isArray(list) ? list : []);
        ch = (Array.isArray(list) ? list : []).find((c) => String(c.serviceRequest?.id || c.serviceRequest?._id) === String(requestId));
      }
      if (!ch) { toast.error("No channel for this request yet."); return; }
      navigate(`/channel/${ch.id || ch._id}`);
    } finally {
      setBusyId(null);
    }
  };

  const acceptBid = async (requestId, bidId) => {
    setBusyId("acc:" + requestId);
    try {
      await apiAcceptBid(requestId, bidId);
      toast.success("Bid accepted — channel created! 🎉");
      // refetch channels so we can jump into the fresh one
      const list = await apiMyChannels().catch(() => []);
      setChannels(Array.isArray(list) ? list : []);
      const ch = (Array.isArray(list) ? list : []).find((c) => String(c.serviceRequest?.id || c.serviceRequest?._id) === String(requestId));
      if (ch) navigate(`/channel/${ch.id || ch._id}`);
      load();
    } catch (e) {
      toast.error(errMsg(e, "Couldn't accept the bid."));
    } finally {
      setBusyId(null);
    }
  };

  const act = async (id, fn, label) => {
    setBusyId(id);
    try { await fn(); toast.success(label); await load(); }
    catch (e) { toast.error(errMsg(e, "Action failed. Try again.")); }
    finally { setBusyId(null); }
  };

  const submitBid = async () => {
    const amount = Number(bidForm.amount);
    if (!bidTarget) return;
    if (!amount || amount <= 0) return toast.error("Enter a valid bid amount 💰");
    setBidBusy(true);
    try {
      const res = await apiPlaceBid(bidTarget.id || bidTarget._id, amount, bidForm.message.trim());
      const bidId = res?.id || res?._id;
      const requestId = bidTarget.id || bidTarget._id;
      const map = readPlacedBids();
      if (bidId) map[requestId] = bidId;
      writePlacedBids(map);
      toast.success("Bid placed! The customer can now accept it 🤝");
      setBidTarget(null);
      setBidForm({ amount: "", message: "" });
      load();
    } catch (e) {
      toast.error(errMsg(e, "Couldn't place bid."));
    } finally {
      setBidBusy(false);
    }
  };

  const withdrawBid = async (requestId) => {
    const map = readPlacedBids();
    const bidId = map[requestId];
    if (!bidId) return toast.info("Bid id not found locally — try withdrawing from your list.");
    setBusyId("wd:" + requestId);
    try {
      await apiWithdrawBid(bidId);
      delete map[requestId];
      writePlacedBids(map);
      toast.success("Bid withdrawn 🗑️");
      load();
    } catch (e) {
      toast.error(errMsg(e, "Couldn't withdraw bid."));
    } finally {
      setBusyId(null);
    }
  };

  const submitReview = async () => {
    if (review.rating < 1) return toast.error("Pick a rating ⭐");
    setReviewBusy(true);
    try {
      await apiCreateReview({ serviceId: reviewTarget?.serviceId, rating: review.rating, comment: review.comment.trim() });
      toast.success("Review posted — thanks! ⭐");
      setReviewTarget(null);
      setReview({ rating: 5, comment: "" });
    } catch (e) {
      toast.error(errMsg(e, "Couldn't post review."));
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) return <FullScreenLoader text="Fetching your activity…" />;

  /* ---------- render helpers ---------- */
  const svcOf = (r) => r.service || servicesMap[r.service] || {};
  const artOf = (r) => categoryArt(svcOf(r).category);

  const paymentBadge = (r) => {
    const p = paymentStatusInfo(r.paymentStatus);
    return (
      <span className="status-badge" style={{ color: p.color, borderColor: p.color + "44" }}>
        <span className="status-dot" style={{ background: p.color }} /> {p.label}
      </span>
    );
  };

  /* ----- sort + filter ----- */
  const reqDate = (r) => new Date(r.updatedAt || r.createdAt || 0).getTime();

  const sortedAndFiltered = (list) => {
    const filtered = statusFilter === "ALL"
      ? [...list]
      : list.filter((r) => (r.status || "") === statusFilter);
    return filtered.sort((a, b) =>
      sortDir === "newest" ? reqDate(b) - reqDate(a) : reqDate(a) - reqDate(b)
    );
  };

  const STATUS_FILTERS = [
    { key: "ALL", label: "All", emoji: "✨" },
    ...REQUEST_STATUSES.map((s) => ({ key: s.key, label: s.label, emoji: "•" })),
  ];

  const customerActions = (r) => {
    const id = r.id || r._id;
    const actions = [];
    const b = bids.filter((x) => String(x.serviceRequest?.id || x.serviceRequest?._id) === String(id));
    if (r.status === "PENDING") {
      actions.push(
        <button key="cancel" className="btn btn-ghost btn-sm" disabled={busyId === id} onClick={() => act(id, () => apiCancelRequest(id), "Request cancelled 🗑️")}>
          <XCircle size={15} /> Cancel
        </button>
      );
    }
    if (r.status === "ACCEPTED") {
      actions.push(
        <button key="chat" className="btn btn-ghost btn-sm" disabled={busyId === "ch:" + id} onClick={() => openChannel(id)}>
          <MessageCircle size={15} /> Open chat
        </button>
      );
      if (["NONE", "PAYMENT_REQUESTED"].includes(r.paymentStatus)) {
        actions.push(
          <button key="pay" className="btn btn-primary btn-sm" onClick={() => navigate(`/payment/${id}`)}>
            <Wallet size={15} /> Pay now
          </button>
        );
      }
    }
    if (r.status === "COMPLETED" && r.paymentStatus !== "PAID") {
      actions.push(
        <button key="pay" className="btn btn-primary btn-sm" onClick={() => navigate(`/payment/${id}`)}>
          <Wallet size={15} /> Pay now
        </button>
      );
    }
    if (r.paymentStatus === "PAID" || r.status === "PAID") {
      actions.push(
        <button key="review" className="btn btn-lime btn-sm" onClick={() => setReviewTarget({ serviceId: svcOf(r).id || svcOf(r)._id, title: svcOf(r).title })}>
          <Star size={15} /> Write review
        </button>
      );
    }
    actions.push(
      <button key="details" className="btn btn-ghost btn-sm" onClick={() => svcOf(r).id || svcOf(r)._id ? navigate(`/service/${svcOf(r).id || svcOf(r)._id}`) : toast.info("Service details unavailable")}>
        Details <ChevronRight size={14} />
      </button>
    );
    return { actions, bids: b };
  };

  const providerActions = (r) => {
    const id = r.id || r._id;
    const actions = [];
    if (r.status === "PENDING") {
      actions.push(
        <button key="bid" className="btn btn-lime btn-sm" onClick={() => setBidTarget(r)}>
          <Gavel size={15} /> Place bid
        </button>
      );
      if (placedBids[id]) {
        actions.push(
          <button key="wd" className="btn btn-ghost btn-sm" disabled={busyId === "wd:" + id} onClick={() => withdrawBid(id)}>
            <XCircle size={15} /> Withdraw bid
          </button>
        );
      }
    }
    if (r.status === "ACCEPTED") {
      actions.push(
        <button key="chat" className="btn btn-ghost btn-sm" disabled={busyId === "ch:" + id} onClick={() => openChannel(id)}>
          <MessageCircle size={15} /> Open chat
        </button>,
        <button key="done" className="btn btn-lime btn-sm" disabled={busyId === id} onClick={() => act(id, () => apiMarkRequestCompleted(id), "Marked completed 🎉")}>
          <CheckCircle2 size={15} /> Mark completed
        </button>
      );
    }
    if (r.status === "COMPLETED") {
      actions.push(
        <button key="reqpay" className="btn btn-primary btn-sm" disabled={busyId === id} onClick={() => act(id, () => apiRequestPayment(id), "Payment requested 💸")}>
          <HandCoins size={15} /> Request payment
        </button>
      );
    }
    if (r.paymentStatus === "PAID_PENDING_VERIFICATION") {
      actions.push(
        <button key="verify" className="btn btn-lime btn-sm" disabled={busyId === id} onClick={() => act(id, () => apiVerifyPaymentByProvider(id), "Payment verified — great! ✅")}>
          <BadgeCheck size={15} /> Verify payment received
        </button>
      );
    }
    return actions;
  };

  const renderCard = (r, mode) => {
    const s = svcOf(r);
    const st = statusInfo(r.status);
    const id = r.id || r._id;
    const art = artOf(r);
    const other = mode === "mine" ? r.provider : r.customer;
    const otherName = other?.fullName || "—";
    const { actions, bids: reqBids } = mode === "mine" ? customerActions(r) : { actions: providerActions(r), bids: [] };

    return (
      <motion.div key={id} className="glass card-hover" style={{ padding: 20 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
          <div className="service-thumb" style={{ width: 76, height: 76, borderRadius: 16, fontSize: "1.8rem", flexShrink: 0, background: gradFor(s.category || "") }}>
            {s.images?.[0] ? <img src={s.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : art.emoji}
          </div>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="row-between wrap" style={{ gap: 8 }}>
              <h3 style={{ fontSize: "1.05rem", wordBreak: "break-word" }}>{s.title || "Service"}</h3>
              <span className="status-badge" style={{ color: st.color, borderColor: st.color + "44" }}>
                <span className="status-dot" style={{ background: st.color }} /> {st.label}
              </span>
            </div>
            <div className="row wrap mt-8" style={{ gap: 14, fontSize: "0.85rem", color: "var(--text-dim)" }}>
              <span className="row" style={{ gap: 5 }}><CalendarDays size={13} /> {fmtDateTime(r.createdAt)}</span>
              <span className="row" style={{ gap: 5 }}>🕐 Slot: <strong>{r.requestedSlot || "—"}</strong></span>
              <span className="display" style={{ fontSize: "1rem" }}>{fmtMoney(s.price)}</span>
            </div>
            <div className="row wrap mt-8" style={{ gap: 10 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="avatar" style={{ width: 28, height: 28, fontSize: "0.72rem" }}>{initialsOf(otherName)}</span>
                <span className="tiny">{mode === "mine" ? "Provider" : "Customer"}: <strong style={{ color: "var(--text)" }}>{otherName}</strong></span>
              </div>
              {paymentBadge(r)}
            </div>

            {/* bids on customer side */}
            {mode === "mine" && reqBids.length > 0 && (
              <div className="mt-12" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="tiny row" style={{ gap: 5 }}><Gavel size={12} /> Bids from providers:</div>
                {reqBids.map((b) => (
                  <div key={b.id || b._id} className="glass" style={{ padding: "12px 14px", borderRadius: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span className="avatar" style={{ width: 30, height: 30, fontSize: "0.75rem" }}>{initialsOf(b.provider?.fullName)}</span>
                    <div className="grow">
                      <strong style={{ fontSize: "0.92rem" }}>{b.provider?.fullName || "Provider"}</strong>
                      {b.message && <div className="tiny" style={{ marginTop: 2 }}>“{b.message}”</div>}
                    </div>
                    <strong className="display" style={{ fontSize: "1.05rem" }}>{fmtMoney(b.amount)}</strong>
                    {r.status === "PENDING" ? (
                      <button className="btn btn-lime btn-sm" disabled={busyId === "acc:" + r.id} onClick={() => acceptBid(r.id || r._id, b.id || b._id)}>
                        {busyId === "acc:" + r.id ? <Spinner size={14} /> : <CheckCircle2 size={14} />} Accept → opens channel
                      </button>
                    ) : (
                      <span className="tag">in review</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {actions.length > 0 && (
          <div className="row wrap" style={{ gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            {actions}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="container page">
      <motion.h1 className="section-title" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        Your <span className="grad-text">Activity</span> 🧾
      </motion.h1>
      <p className="muted mb-20">
        Requests you made as a customer — and, if you're a provider, requests customers sent on your services.
      </p>

      <div className="row wrap mb-12" style={{ gap: 10 }}>
        <button className={`chip ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>
          🛍️ My requests ({mine.length})
        </button>
        {isProvider && (
          <button className={`chip ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>
            🧰 Requests on my services ({orders.length})
          </button>
        )}
        <span className="grow" />
        {/* date sort toggle */}
        <div className="row" style={{ gap: 6 }}>
          <button
            className={`chip ${sortDir === "newest" ? "active" : ""}`}
            onClick={() => setSortDir("newest")}
            title="Sort by newest first"
          >
            ⬇️ Newest
          </button>
          <button
            className={`chip ${sortDir === "oldest" ? "active" : ""}`}
            onClick={() => setSortDir("oldest")}
            title="Sort by oldest first"
          >
            ⬆️ Oldest
          </button>
        </div>
      </div>

      {/* status filter chips */}
      <div className="row wrap mb-30" style={{ gap: 8 }}>
        {STATUS_FILTERS.map((f) => {
          const count = (tab === "mine" ? mine : orders).filter((r) =>
            f.key === "ALL" ? true : (r.status || "") === f.key
          ).length;
          const color = f.key === "ALL" ? undefined : statusInfo(f.key).color;
          return (
            <button
              key={f.key}
              className={`chip ${statusFilter === f.key ? "active" : ""}`}
              onClick={() => setStatusFilter(f.key)}
              style={statusFilter === f.key && color ? { background: "none", borderColor: color, color } : undefined}
            >
              <span style={color && statusFilter !== f.key ? { color, fontSize: "0.8rem" } : undefined}>{f.emoji === "•" ? "●" : f.emoji}</span>
              {f.label}
              <span className="tiny" style={{ opacity: 0.8 }}>({count})</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab + statusFilter + sortDir} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          {tab === "mine" && (
            mine.length === 0 ? (
              <EmptyState emoji="🛍️" title="No requests yet" text="Request a service from the home page — providers will bid and you pick the best!" action={<button className="btn btn-primary" onClick={() => navigate("/home")}>Explore services</button>} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {sortedAndFiltered(mine).map((r) => renderCard(r, "mine"))}
              </div>
            )
          )}
          {tab === "orders" && (
            orders.length === 0 ? (
              <EmptyState emoji="🧰" title="No requests yet" text="When customers request your services they'll appear here. Create services to get requests!" action={<button className="btn btn-lime" onClick={() => navigate("/provider")}>Manage my services</button>} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {sortedAndFiltered(orders).map((r) => renderCard(r, "orders"))}
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* place bid modal (provider) */}
      <Modal open={!!bidTarget} onClose={() => setBidTarget(null)} title="Place a bid">
        {bidTarget && (
          <>
            <div className="glass" style={{ padding: 14, borderRadius: 14, marginBottom: 18 }}>
              <strong style={{ fontSize: "0.98rem" }}>{svcOf(bidTarget).title || "Service"}</strong>
              <div className="tiny mt-8">Customer: {bidTarget.customer?.fullName || "—"} · Slot: {bidTarget.requestedSlot || "—"}</div>
            </div>
            <div className="field">
              <label>💰 Bid amount (₹)</label>
              <input className="input" inputMode="numeric" placeholder="e.g. 450" value={bidForm.amount} onChange={(e) => setBidForm((f) => ({ ...f, amount: e.target.value.replace(/\D/g, "") }))} />
            </div>
            <div className="field">
              <label>💬 Message to customer</label>
              <textarea className="textarea" placeholder="Why should they pick you? Experience, timing, extras…" value={bidForm.message} onChange={(e) => setBidForm((f) => ({ ...f, message: e.target.value }))} />
            </div>
            <button className="btn btn-lime btn-lg btn-block" onClick={submitBid} disabled={bidBusy}>
              {bidBusy ? <Spinner /> : <><Gavel size={17} /> Place bid</>}
            </button>
            <p className="tiny center mt-12">When the customer accepts your bid, a private channel opens automatically 🤝</p>
          </>
        )}
      </Modal>

      {/* review modal */}
      <Modal open={!!reviewTarget} onClose={() => setReviewTarget(null)} title="Review this service">
        {reviewTarget && (
          <>
            <div className="center mb-12">
              <StarRating value={review.rating} onChange={(v) => setReview((r) => ({ ...r, rating: v }))} size="2.2rem" />
            </div>
            <div className="field">
              <label>💬 Your experience</label>
              <textarea className="textarea" placeholder="Share the details — it helps other customers and the provider…" value={review.comment} onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-lg btn-block" onClick={submitReview} disabled={reviewBusy}>
              {reviewBusy ? <Spinner /> : "Submit review ⭐"}
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
