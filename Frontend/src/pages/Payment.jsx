import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2, ArrowRight, CreditCard, AlertTriangle, Lock } from "lucide-react";
import Confetti from "../components/Confetti";
import { FullScreenLoader, Spinner } from "../components/Misc";
import { useToast } from "../context/ToastContext";
import { apiRequestById, apiCreateChannelPayment, apiConfirmChannelPayment, errMsg } from "../api/client";
import { fmtMoney, fmtDate } from "../utils/helpers";

const METHODS = [
  { id: "upi", label: "UPI", emoji: "📱", desc: "GPay, PhonePe, Paytm…" },
  { id: "card", label: "Card", emoji: "💳", desc: "Credit / Debit" },
  { id: "netbanking", label: "Netbanking", emoji: "🏦", desc: "All major banks" },
  { id: "wallet", label: "Wallet", emoji: "👛", desc: "Sphere Wallet" },
];

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("upi");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState({ no: "", exp: "", cvv: "" });
  const [phase, setPhase] = useState("pay"); // pay | creating | processing | success | failed
  const [orderRef, setOrderRef] = useState("");
  const [paymentId, setPaymentId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await apiRequestById(id);
        setRequest(r);
      } catch (e) {
        setError(errMsg(e, "Request not found or you're not part of it."));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <FullScreenLoader text="Preparing secure checkout…" />;
  if (error || !request) return <div className="container page center"><p className="muted">{error}</p><Link to="/activity" className="btn btn-primary mt-20">Back to activity</Link></div>;

  const service = request.service || {};
  const amount = service.price || 0;

  const pay = async () => {
    if (method === "upi" && upi.trim().length < 6) return toast.error("Enter a valid UPI ID (e.g. name@upi) 📱");
    if (method === "card" && card.no.replace(/\s/g, "").length < 12) return toast.error("Enter a valid card number 💳");
    setPhase("creating");
    try {
      const res = await apiCreateChannelPayment(request.id || request._id);
      setPaymentId(res?.paymentId || res);
      if (!res?.paymentId) throw new Error("No payment id returned");
      setPhase("processing");
      await new Promise((r) => setTimeout(r, 2600));
      await apiConfirmChannelPayment(res.paymentId);
      setOrderRef(`TXN-${Date.now().toString().slice(-8)}`);
      setPhase("success");
    } catch (e) {
      setPhase("failed");
      toast.error(errMsg(e, "Demo payment failed (intentionally?). Try again."));
    }
  };

  const fmtCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  const fmtExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  return (
    <div className="container page">
      <AnimatePresence mode="wait">
        {phase === "pay" && (
          <motion.div key="pay" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="glass glass-strong" style={{ maxWidth: 520, margin: "0 auto", padding: 34 }}>
            <div className="center mb-20">
              <div style={{ fontSize: "2.8rem" }}>💳</div>
              <h1 style={{ fontSize: "1.6rem", marginTop: 8 }}>Demo <span className="grad-text">Payment</span></h1>
              <p className="muted" style={{ fontSize: "0.9rem", marginTop: 6 }}>No real money is charged — this is a simulation 🔒</p>
            </div>

            <div className="glass" style={{ padding: 14, borderRadius: 14, marginBottom: 20 }}>
              <div className="row-between"><span className="muted" style={{ fontSize: "0.85rem" }}>{service.title || "Service"}</span><strong className="display" style={{ fontSize: "1.3rem" }}>{fmtMoney(amount)}</strong></div>
              <div className="row-between mt-8" style={{ fontSize: "0.8rem", color: "var(--text-faint)" }}>
                <span>Slot: {request.requestedSlot || "—"}</span>
                <span>Requested {fmtDate(request.createdAt)}</span>
              </div>
            </div>

            <h3 className="mb-12" style={{ fontSize: "1.05rem" }}>Choose payment method</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {METHODS.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)} className="glass" style={{ padding: "14px 12px", borderRadius: 16, cursor: "pointer", border: method === m.id ? "2px solid var(--magenta)" : "1px solid var(--stroke)", textAlign: "left", display: "flex", gap: 10, alignItems: "center", background: method === m.id ? "rgba(255,78,205,0.1)" : "var(--card)" }}>
                  <span style={{ fontSize: "1.5rem" }}>{m.emoji}</span>
                  <span><strong style={{ display: "block", fontSize: "0.9rem" }}>{m.label}</strong><span className="tiny">{m.desc}</span></span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {method === "upi" && (
                <motion.div key="upi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-20">
                  <label className="tiny" style={{ display: "block", marginBottom: 6 }}>Your UPI ID</label>
                  <input className="input" placeholder="yourname@upi" value={upi} onChange={(e) => setUpi(e.target.value)} />
                </motion.div>
              )}
              {method === "card" && (
                <motion.div key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-20">
                  <label className="tiny" style={{ display: "block", marginBottom: 6 }}>Card number</label>
                  <input className="input" placeholder="4242 4242 4242 4242" value={card.no} onChange={(e) => setCard((c) => ({ ...c, no: fmtCard(e.target.value) }))} />
                  <div className="row mt-8" style={{ gap: 10 }}>
                    <input className="input" style={{ width: "55%" }} placeholder="MM/YY" value={card.exp} onChange={(e) => setCard((c) => ({ ...c, exp: fmtExp(e.target.value) }))} />
                    <input className="input" style={{ width: "45%" }} placeholder="CVV" type="password" maxLength={4} value={card.cvv} onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "") }))} />
                  </div>
                </motion.div>
              )}
              {method === "netbanking" && (
                <motion.div key="nb" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-20">
                  <select className="input" defaultValue=""><option value="" disabled>Select your bank…</option><option>HDFC Bank</option><option>State Bank of India</option><option>ICICI Bank</option><option>Axis Bank</option><option>Other bank</option></select>
                </motion.div>
              )}
              {method === "wallet" && (
                <motion.div key="wallet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-20">
                  <div className="glass" style={{ padding: 16, borderRadius: 16 }}>
                    <div className="row-between"><span className="muted">Sphere Wallet balance</span><strong>₹0</strong></div>
                    <p className="tiny mt-8">Top up anytime in Profile. (demo)</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="row-between mb-20" style={{ padding: "14px 0", borderTop: "1px solid var(--stroke)", borderBottom: "1px solid var(--stroke)" }}>
              <span className="muted">Amount payable</span>
              <span className="display grad-text" style={{ fontSize: "1.7rem" }}>{fmtMoney(amount)}</span>
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={pay}>
              <Lock /> Pay {fmtMoney(amount)} <ArrowRight size={17} />
            </button>
            <p className="tiny center mt-12"><ShieldCheck size={12} style={{ verticalAlign: "-2px" }} /> Demo only · Provider verifies receipt after payment</p>
          </motion.div>
        )}

        {(phase === "creating" || phase === "processing") && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="center" style={{ paddingTop: 80 }}>
            <motion.div style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto 24px", background: "var(--grad)", display: "grid", placeItems: "center" }} animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
              <CreditCard size={38} color="#1a0814" />
            </motion.div>
            <h2>{phase === "creating" ? "Contacting the demo bank…" : "Processing your payment…"}</h2>
            <p className="muted mt-8">Please don't refresh the page.</p>
          </motion.div>
        )}

        {phase === "success" && (
          <motion.div key="suc" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 180, damping: 16 }} className="glass glass-strong center" style={{ maxWidth: 480, margin: "0 auto", padding: "44px 30px" }}>
            <Confetti count={70} />
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.15 }} style={{ width: 84, height: 84, borderRadius: "50%", margin: "0 auto 20px", background: "var(--grad-lime)", display: "grid", placeItems: "center" }}>
              <CheckCircle2 size={44} color="#10240a" />
            </motion.div>
            <h1 style={{ fontSize: "1.8rem" }}>Payment <span className="grad-text-lime">successful!</span></h1>
            <p className="muted" style={{ margin: "10px 0 18px", fontSize: "0.95rem" }}>The provider will verify the receipt. Track everything in Activity 🎊</p>
            <div className="glass" style={{ padding: 14, borderRadius: 14, marginBottom: 20 }}>
              <div className="row-between"><span className="tiny">Order reference</span><strong style={{ fontSize: "0.82rem", color: "#ffd166" }}>{orderRef}</strong></div>
              <div className="row-between mt-8"><span className="tiny">Paid via</span><strong style={{ fontSize: "0.82rem" }}>{method.toUpperCase()}</strong></div>
              <div className="row-between mt-8"><span className="tiny">Payment id</span><strong style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{String(paymentId).slice(0, 14)}…</strong></div>
              <div className="row-between mt-8"><span className="tiny">Status</span><span className="status-badge" style={{ color: "#38bdf8" }}><span className="status-dot" style={{ background: "#38bdf8" }} /> PAID · pending provider verification</span></div>
            </div>
            <div className="row" style={{ gap: 10, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => navigate("/activity")}>View activity →</button>
              <Link to="/home" className="btn btn-ghost">Back home</Link>
            </div>
          </motion.div>
        )}

        {phase === "failed" && (
          <motion.div key="fail" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass glass-strong center" style={{ maxWidth: 460, margin: "0 auto", padding: "40px 30px" }}>
            <div style={{ fontSize: "3.4rem" }}>😵</div>
            <h1 style={{ fontSize: "1.6rem", margin: "10px 0 8px" }}>Payment failed</h1>
            <p className="muted" style={{ marginBottom: 20 }}><AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Your demo payment didn't go through. Your request is still safe — retry anytime.</p>
            <div className="row" style={{ gap: 10, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => setPhase("pay")}>Retry payment</button>
              <button className="btn btn-ghost" onClick={() => navigate("/activity")}>Later</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
