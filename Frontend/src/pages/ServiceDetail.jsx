import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock, MapPin, MessageCircle, ShieldCheck, Star, User } from "lucide-react";
import StarRating from "../components/StarRating";
import Modal from "../components/Modal";
import { EmptyState, FullScreenLoader, Spinner } from "../components/Misc";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiGetService, apiCreateRequest, apiCreateReview, errMsg } from "../api/client";
import { categoryArt, gradFor, fmtMoney, fmtDate, initialsOf } from "../utils/helpers";

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isProvider } = useAuth();

  const [data, setData] = useState(null); // { service, reviewCount, reviews }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookOpen, setBookOpen] = useState(false);
  const [slot, setSlot] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [busy, setBusy] = useState(false);
  const [requestMade, setRequestMade] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGetService(id);
      setData(res);
    } catch (e) {
      setError(errMsg(e, "Service not found."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <FullScreenLoader text="Warming up the service…" />;
  if (error || !data?.service) return <div className="container page"><EmptyState emoji="🛸" title="Service not found" text={error} action={<button className="btn btn-primary" onClick={() => navigate("/home")}>Back home</button>} /></div>;

  const { service, reviewCount, reviews } = data;
  const provider = service.provider || {};
  const images = service.images?.length ? service.images : [];
  const art = categoryArt(service.category);
  const mine = user && (String(provider.id || provider._id) === String(user.id || user._id));

  const submitRequest = async () => {
    if (!slot) return toast.error("Pick a time slot first 🕐");
    setBusy(true);
    try {
      await apiCreateRequest(service.id || service._id, slot);
      setRequestMade(true);
      setBookOpen(false);
      toast.success("Request sent! Track it in Activity 🧾");
    } catch (e) {
      toast.error(errMsg(e, "Couldn't create the request. Check the message."));
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async () => {
    if (review.rating < 1) return toast.error("Tap the stars to rate ⭐");
    setBusy(true);
    try {
      await apiCreateReview({ serviceId: service.id || service._id, rating: review.rating, comment: review.comment.trim() });
      toast.success("Thanks for the review! ⭐");
      setReviewOpen(false);
      setReview({ rating: 5, comment: "" });
      load();
    } catch (e) {
      toast.error(errMsg(e, "Reviews are allowed after your request is paid."));
    } finally {
      setBusy(false);
    }
  };

  const openChannel = async () => {
    toast.info("Open Activity → My bookings to jump into your channel after a provider is accepted. 💬");
    navigate("/activity");
  };

  return (
    <div className="container page">
      <button className="btn btn-ghost btn-sm mb-20" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button>

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 30, alignItems: "start" }} className="detail-grid">
        {/* left: media + info */}
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass" style={{ overflow: "hidden", borderRadius: "var(--r-lg)" }}>
            {images.length ? (
              <img src={images[0]} alt={service.title} style={{ width: "100%", height: "min(420px, 55vw)", objectFit: "cover" }} />
            ) : (
              <div style={{ height: "min(420px, 55vw)", display: "grid", placeItems: "center", background: gradFor(service.category), fontSize: "6rem" }}>{art.emoji}</div>
            )}
          </div>

          <div className="glass mt-20" style={{ padding: 26 }}>
            <div className="row wrap mb-12">
              <span className="tag" style={{ background: "var(--grad)", color: "#1a0814" }}>{art.emoji} {art.label}</span>
              {mine && <span className="tag" style={{ background: "rgba(255,209,102,0.15)", color: "#ffd166" }}>Your service</span>}
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", marginBottom: 10 }}>{service.title}</h1>
            <div className="row wrap" style={{ gap: 18, marginBottom: 16 }}>
              <span className="row" style={{ gap: 5 }}><Star size={15} color="#ffd166" /> <strong>{Number(provider.averageRating || service.averageRating || 0).toFixed(1)}</strong> <span className="tiny">({reviewCount || 0} reviews)</span></span>
              <span className="row" style={{ gap: 5 }}><Clock size={15} color="#5cf2c9" /> {service.slots?.length || 0} daily slots</span>
              {service.location && (
                <span className="row" style={{ gap: 5 }}><MapPin size={15} color="#ff9a3d" /> {service.location?.coordinates ? `${service.location.coordinates[1]?.toFixed(2)}, ${service.location.coordinates[0]?.toFixed(2)}` : "Location set"}</span>
              )}
            </div>
            <h3 className="display" style={{ fontSize: "1.8rem", marginBottom: 14 }}><span className="grad-text">{fmtMoney(service.price)}</span> <span className="tiny">/ service</span></h3>
            <div className="divider" />
            <h3 className="mb-12">About this service</h3>
            <p className="muted" style={{ lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{service.description || "No description provided."}</p>

            {service.slots?.length > 0 && (
              <>
                <div className="divider" />
                <h3 className="mb-12">Available slots</h3>
                <div className="row wrap" style={{ gap: 8 }}>
                  {service.slots.map((s) => (
                    <span key={s} className="chip" style={{ cursor: "default" }}>🕐 {s}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* reviews */}
          <div className="glass mt-20" style={{ padding: 26 }}>
            <div className="row-between wrap mb-20">
              <h3>Reviews <span className="grad-text">⭐</span></h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setReviewOpen(true)}>Write a review</button>
            </div>
            {!reviews?.length ? (
              <p className="muted" style={{ fontSize: "0.94rem" }}>No reviews yet — after your request is paid, share your experience!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {reviews.map((r, i) => (
                  <motion.div key={r.id || r._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass" style={{ padding: 16, borderRadius: "var(--r-md)" }}>
                    <div className="row mb-8">
                      <span className="avatar" style={{ width: 34, height: 34, fontSize: "0.85rem" }}>
                        {initialsOf(r.customer?.fullName)}
                      </span>
                      <div className="grow">
                        <strong style={{ fontSize: "0.95rem" }}>{r.customer?.fullName || "Anonymous"}</strong>
                        <div className="tiny">{fmtDate(r.createdAt)}</div>
                      </div>
                      <StarRating value={r.rating} size="0.9rem" />
                    </div>
                    {r.comment && <p className="muted" style={{ fontSize: "0.93rem", lineHeight: 1.6 }}>{r.comment}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* right: provider + book */}
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="sticky-col">
          <div className="glass glass-strong" style={{ padding: 26 }}>
            <h3 className="mb-20">Your provider</h3>
            <div className="row mb-12">
              <span className="avatar avatar-lg">{initialsOf(provider.fullName)}</span>
              <div>
                <strong style={{ fontSize: "1.08rem" }}>{provider.fullName || "Provider"}</strong>
                <div className="row" style={{ gap: 4, color: "var(--text-faint)", fontSize: "0.82rem" }}>
                  <User size={12} /> {provider.role === "SERVICE_PROVIDER" ? "Service provider" : "Pro"}
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 5 }}>
              <StarRating value={provider.averageRating || 0} size="1rem" />
              <span className="tiny">{Number(provider.averageRating || 0).toFixed(1)} ({provider.totalReviews || 0})</span>
            </div>
            <div className="divider" />
            <div className="row wrap" style={{ gap: 10, marginBottom: 8 }}>
              <div className="glass" style={{ padding: "10px 14px", borderRadius: 14, flex: 1, minWidth: 110 }}>
                <div className="tiny">Rating</div>
                <strong>{(provider.averageRating || 0).toFixed(1)} ⭐</strong>
              </div>
              <div className="glass" style={{ padding: "10px 14px", borderRadius: 14, flex: 1, minWidth: 110 }}>
                <div className="tiny">Reviews</div>
                <strong>{provider.totalReviews || 0}</strong>
              </div>
            </div>

            {mine ? (
              <div className="center" style={{ padding: 16, borderRadius: 14, background: "rgba(255,209,102,0.08)", border: "1px dashed rgba(255,209,102,0.4)" }}>
                🪞 This is your own service — customers request it from here!
              </div>
            ) : (
              <>
                <button className="btn btn-primary btn-lg btn-block" onClick={() => (user ? setBookOpen(true) : (toast.info("Sign in to request this service 🔐"), navigate("/auth")))}>
                  <CalendarDays size={18} /> Request this service
                </button>
                {isProvider && (
                  <p className="tiny center mt-8" style={{ color: "var(--text-faint)", lineHeight: 1.5 }}>
                    As a provider you can still request other providers' services — just not ones in categories you already offer (platform rule).
                  </p>
                )}
              </>
            )}

            <div className="row mt-12" style={{ gap: 7, color: "var(--text-faint)", fontSize: "0.8rem", justifyContent: "center" }}>
              <ShieldCheck size={14} color="#5cf2c9" /> OTP-verified users · Demo payments · Track in Activity
            </div>
          </div>
        </motion.div>
      </div>

      {/* booking modal — picks a slot & sends a ServiceRequest */}
      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title={`Request • ${service.title}`}>
        <div className="row-between wrap mb-20" style={{ background: "var(--grad-soft)", padding: 14, borderRadius: 14 }}>
          <div>
            <div className="tiny">Service price (demo)</div>
            <strong className="display" style={{ fontSize: "1.5rem" }}>{fmtMoney(service.price)}</strong>
          </div>
          <div className="tiny" style={{ textAlign: "right" }}>
            Payment happens after<br />a provider accepts 🛡️
          </div>
        </div>

        <div className="field">
          <label>🕐 Pick a time slot</label>
          {service.slots?.length ? (
            <div className="row wrap" style={{ gap: 8 }}>
              {service.slots.map((s) => (
                <button key={s} type="button" className={`chip ${slot === s ? "active" : ""}`} onClick={() => setSlot(s)}>🕐 {s}</button>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: "0.9rem" }}>This provider hasn't listed slots — pick any time below.</p>
          )}
        </div>

        <div className="field">
          <label>Custom slot <span className="tiny">(if not listed above)</span></label>
          <input className="input" placeholder="e.g. Tomorrow 6:30 PM" value={slot === "" ? "" : slot} onChange={(e) => setSlot(e.target.value)} />
        </div>

        <button className="btn btn-primary btn-lg btn-block" onClick={submitRequest} disabled={busy || !slot}>
          {busy ? <Spinner /> : requestMade ? "Request sent ✓" : "Send request →"}
        </button>
        <p className="tiny center mt-12">
          The provider gets your request. You'll see bids & status in <Link to="/activity" style={{ color: "#ffb3e6" }}>Activity</Link>.
        </p>
      </Modal>

      {/* review modal */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Rate this service">
        <div className="center mb-12">
          <StarRating value={review.rating} onChange={(v) => setReview((r) => ({ ...r, rating: v }))} size="2.2rem" />
        </div>
        <div className="field">
          <label>💬 Your experience</label>
          <textarea className="textarea" placeholder="How was the service? Be specific — it helps the community…" value={review.comment} onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))} />
        </div>
        <button className="btn btn-primary btn-lg btn-block" onClick={submitReview} disabled={busy}>
          {busy ? <Spinner /> : "Submit review ⭐"}
        </button>
        <p className="tiny center mt-12">Reviews unlock once your request is paid (backend rule).</p>
      </Modal>
    </div>
  );
}
