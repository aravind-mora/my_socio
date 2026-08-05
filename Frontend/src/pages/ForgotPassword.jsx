import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Spinner } from "../components/Misc";
import { useToast } from "../context/ToastContext";
import { apiForgotPassword, errMsg } from "../api/client";
import { isValidEmail } from "../utils/helpers";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return toast.error("Enter a valid email 📧");
    setBusy(true);
    try {
      await apiForgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      toast.error(errMsg(err, "Couldn't send reset link."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <motion.div className="glass glass-strong" style={{ maxWidth: 440, margin: "0 auto", padding: "36px 30px" }} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}>
        <button className="btn btn-ghost btn-sm mb-20" onClick={() => navigate("/auth")}><ArrowLeft size={15} /> Back</button>
        <div className="center mb-20">
          <div style={{ fontSize: "2.6rem" }}>🔑</div>
          <h1 style={{ fontSize: "1.6rem", marginTop: 8 }}>Forgot <span className="grad-text">password</span>?</h1>
          <p className="muted" style={{ fontSize: "0.9rem", marginTop: 6 }}>
            We'll email you a reset link (valid for 15 minutes).
          </p>
        </div>

        {sent ? (
          <div className="center">
            <div style={{ fontSize: "3rem", marginBottom: 10 }}>📬</div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Check your inbox!</h2>
            <p className="muted" style={{ fontSize: "0.92rem", marginBottom: 18 }}>
              If an account exists for <strong style={{ color: "#ffd166" }}>{email}</strong>, a reset link is on its way.
            </p>
            <Link to="/auth" className="btn btn-primary">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label><Mail size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? <Spinner /> : <><Send size={17} /> Send reset link</>}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
