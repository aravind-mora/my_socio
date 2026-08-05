import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User as UserIcon, Phone, Mail, ShieldCheck, Rocket, KeyRound, BadgeCheck, LogOut, HandCoins, Package, Hourglass } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiUpdateProfile, apiUpgradeProvider, apiForgotPassword, apiProviderDashboard, errMsg } from "../api/client";
import { Spinner } from "../components/Misc";
import { isValidPhone, initialsOf, fmtMoney, fmtDate } from "../utils/helpers";

export default function Profile() {
  const { user, refresh, isProvider, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({ fullName: "", mobile: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [dash, setDash] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({ fullName: user.fullName || "", mobile: user.mobile || "" });
      setForgotEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (isProvider) {
      apiProviderDashboard().then(setDash).catch(() => {});
    }
  }, [isProvider]);

  if (!user) return null;

  const saveProfile = async () => {
    if (form.fullName.trim().length < 2) return toast.error("Name looks too short");
    if (form.mobile && !isValidPhone(form.mobile)) return toast.error("Enter a valid 10-digit mobile");
    setBusy(true);
    try {
      await apiUpdateProfile({ fullName: form.fullName.trim(), mobile: form.mobile.trim() });
      await refresh();
      toast.success("Profile updated ✅");
    } catch (err) {
      toast.error(errMsg(err, "Couldn't update profile."));
    } finally {
      setBusy(false);
    }
  };

  const doUpgrade = async () => {
    setBusy(true);
    try {
      await apiUpgradeProvider();
      await refresh();
      toast.success("Upgraded! Await admin verification. 🚀");
    } catch (err) {
      toast.error(errMsg(err, "Couldn't upgrade. Only customers can upgrade."));
    } finally {
      setBusy(false);
    }
  };

  const sendResetLink = async () => {
    if (!forgotEmail.trim()) return toast.error("Enter your email first");
    setBusy(true);
    try {
      await apiForgotPassword(forgotEmail.trim());
      toast.success("Reset link sent to your email 📬");
    } catch (err) {
      toast.error(errMsg(err, "Couldn't send reset link."));
    } finally {
      setBusy(false);
    }
  };

  const roleLabel = isProvider ? "Service Provider" : user.role === "ADMIN" ? "Admin" : "Customer";
  const roleEmoji = isProvider ? "🚀" : user.role === "ADMIN" ? "🛡️" : "🧑‍💼";

  return (
    <div className="container page">
      <motion.h1 className="section-title" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        My <span className="grad-text">Profile</span> 🪐
      </motion.h1>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 26, alignItems: "start" }} className="profile-grid">
        {/* sidebar card */}
        <motion.div className="glass glass-strong center" style={{ padding: 30 }} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }}>
          <span className="avatar avatar-xl" style={{ marginBottom: 16 }}>{initialsOf(user.fullName)}</span>
          <h2 style={{ fontSize: "1.3rem" }}>{user.fullName}</h2>
          <p className="tiny mb-12">{user.email} · {user.mobile || "no mobile"}</p>
          <span className="tag" style={{ background: isProvider ? "var(--grad)" : "rgba(255,255,255,0.08)", color: isProvider ? "#1a0814" : "var(--text-dim)", marginBottom: 8, display: "inline-block" }}>
            {roleEmoji} {roleLabel}
          </span>
          <div className="tiny mb-20">
            {isProvider && !user.isVerified && (
              <span className="row" style={{ justifyContent: "center", gap: 5, color: "#ffd166" }}>
                <Hourglass size={13} /> Awaiting admin verification
              </span>
            )}
            {isProvider && user.isVerified && (
              <span className="row" style={{ justifyContent: "center", gap: 5, color: "#34d399" }}>
                <BadgeCheck size={13} /> Verified provider
              </span>
            )}
          </div>

          {isProvider && dash && (
            <div className="grid-stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="glass" style={{ padding: 12, borderRadius: 14 }}>
                <div className="row" style={{ justifyContent: "center", gap: 5 }}><HandCoins size={13} color="#ffd166" /></div>
                <div className="display" style={{ fontSize: "1.05rem" }}>{fmtMoney(dash.totalEarnings)}</div>
                <div className="tiny">Earnings</div>
              </div>
              <div className="glass" style={{ padding: 12, borderRadius: 14 }}>
                <div className="row" style={{ justifyContent: "center", gap: 5 }}><Package size={13} color="#5cf2c9" /></div>
                <div className="display" style={{ fontSize: "1.05rem" }}>{dash.completedJobs}</div>
                <div className="tiny">Completed</div>
              </div>
              <div className="glass" style={{ padding: 12, borderRadius: 14 }}>
                <div className="display" style={{ fontSize: "1.05rem" }}>{dash.pendingJobs}</div>
                <div className="tiny">Pending</div>
              </div>
              <div className="glass" style={{ padding: 12, borderRadius: 14 }}>
                <div className="display" style={{ fontSize: "1.05rem" }}>{dash.paidJobs}</div>
                <div className="tiny">Paid</div>
              </div>
            </div>
          )}

          <div className="row" style={{ justifyContent: "center", gap: 10, marginTop: 20 }}>
            <div className="glass" style={{ padding: "10px 16px", borderRadius: 14 }}>
              <div className="tiny">Rating</div>
              <strong>{(user.averageRating || 0).toFixed(1)} ⭐</strong>
            </div>
            <div className="glass" style={{ padding: "10px 16px", borderRadius: 14 }}>
              <div className="tiny">Reviews</div>
              <strong>{user.totalReviews || 0}</strong>
            </div>
            <div className="glass" style={{ padding: "10px 16px", borderRadius: 14 }}>
              <div className="tiny">Joined</div>
              <strong style={{ fontSize: "0.8rem" }}>{fmtDate(user.createdAt)}</strong>
            </div>
          </div>

          <div className="divider" />
          <button className="btn btn-ghost btn-sm btn-block" onClick={() => { logout(); toast.success("Logged out 👋"); navigate("/auth"); }}>
            <LogOut size={15} /> Logout
          </button>
        </motion.div>

        {/* main column */}
        <motion.div style={{ display: "flex", flexDirection: "column", gap: 20 }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="row wrap" style={{ gap: 10 }}>
            <button className={`chip ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}><UserIcon size={14} /> Edit profile</button>
            <button className={`chip ${tab === "security" ? "active" : ""}`} onClick={() => setTab("security")}><KeyRound size={14} /> Password</button>
            {!isProvider && (
              <button className={`chip ${tab === "upgrade" ? "active" : ""}`} onClick={() => setTab("upgrade")}><Rocket size={14} /> Become provider</button>
            )}
          </div>

          {tab === "profile" && (
            <div className="glass glass-strong" style={{ padding: 28 }}>
              <h3 className="mb-20">Personal details</h3>
              <div className="field">
                <label><UserIcon size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Full name</label>
                <input className="input" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div className="field">
                <label><Mail size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Email <span className="tiny">(can't change)</span></label>
                <input className="input" value={user.email || ""} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="field">
                <label><Phone size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Mobile</label>
                <input className="input" inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "") }))} />
              </div>
              <button className="btn btn-primary" onClick={saveProfile} disabled={busy}>{busy ? <Spinner /> : "Save changes"}</button>
            </div>
          )}

          {tab === "security" && (
            <div className="glass glass-strong" style={{ padding: 28 }}>
              <h3 className="mb-20">Reset password</h3>
              <p className="muted" style={{ fontSize: "0.92rem", marginBottom: 16, lineHeight: 1.6 }}>
                The backend resets passwords via a secure email link. Enter your email and we'll send you a reset link — it expires in 15 minutes. 🔐
              </p>
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={sendResetLink} disabled={busy}>
                {busy ? <Spinner /> : <><KeyRound size={16} /> Send reset link</>}
              </button>
            </div>
          )}

          {!isProvider && tab === "upgrade" && (
            <div className="glass glass-strong" style={{ padding: 28, borderColor: "rgba(255,154,61,0.4)" }}>
              <div className="row mb-8" style={{ gap: 12 }}>
                <div style={{ fontSize: "2.4rem" }}>🚀</div>
                <div>
                  <h3>Become a provider</h3>
                  <p className="muted" style={{ fontSize: "0.9rem" }}>
                    Create services, get requests, bid & chat with customers, earn. After upgrading, an admin verifies your account before you can publish services.
                  </p>
                </div>
              </div>
              <div className="row wrap" style={{ gap: 10, marginTop: 12 }}>
                <button className="btn btn-lime" onClick={doUpgrade} disabled={busy}>
                  {busy ? <Spinner /> : <><Rocket size={17} /> Upgrade me!</>}
                </button>
                <span className="tiny row" style={{ gap: 5 }}><ShieldCheck size={14} color="#5cf2c9" /> Free to upgrade · Admin review needed</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
