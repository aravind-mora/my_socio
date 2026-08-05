import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Spinner } from "../components/Misc";
import { useToast } from "../context/ToastContext";
import { apiResetPassword, errMsg } from "../api/client";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    if (!token) return toast.error("Reset token is missing from the link.");
    setBusy(true);
    try {
      await apiResetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/auth"), 2600);
    } catch (err) {
      toast.error(errMsg(err, "Couldn't reset password. The link may be invalid or expired."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <motion.div className="glass glass-strong" style={{ maxWidth: 440, margin: "0 auto", padding: "36px 30px" }} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}>
        <div className="center mb-20">
          <div style={{ fontSize: "2.6rem" }}>🔐</div>
          <h1 style={{ fontSize: "1.6rem", marginTop: 8 }}>Set a <span className="grad-text">new password</span></h1>
        </div>

        {done ? (
          <div className="center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px", background: "var(--grad-lime)", display: "grid", placeItems: "center" }}>
              <CheckCircle2 size={36} color="#10240a" />
            </motion.div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 6 }}>Password updated!</h2>
            <p className="muted" style={{ fontSize: "0.92rem" }}>Redirecting you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label><Lock size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> New password</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={show ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div className="field">
              <label><KeyRound size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Confirm password</label>
              <input className="input" type="password" placeholder="Repeat new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? <Spinner /> : "Reset password"}
            </button>
            <p className="tiny center mt-12"><Link to="/auth" style={{ color: "#ffb3e6" }}>Back to sign in</Link></p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
