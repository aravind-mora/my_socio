import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { ArrowLeft, Mail, KeyRound, Lock, User as UserIcon, Phone, Eye, EyeOff, ShieldCheck, PartyPopper } from "lucide-react";
import Logo from "../components/Logo";
import OTPInput from "../components/OTPInput";
import Confetti from "../components/Confetti";
import { Spinner } from "../components/Misc";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { OTP_EXPIRY_MINUTES } from "../config";
import { apiSendOtp, apiVerifyOtp, apiSignup, apiLogin, apiVerifyLoginOtp, apiGoogleUrl, setToken, errMsg } from "../api/client";
import { isValidEmail, isValidPhone } from "../utils/helpers";

const ROLES = {
  customer: { backend: "CUSTOMER", emoji: "🧑‍💼", tag: "I want to book services", blurb: "Find trusted pros near you — plumbers, tutors, trainers, stylists & more. Request a service, pick a slot, pay safely." },
  provider: { backend: "SERVICE_PROVIDER", emoji: "🚀", tag: "I want to offer services", blurb: "Turn your skills into income. Create your service, get requests, bid & chat with customers, grow your ratings." },
};

const SIGNUP_PURPOSE = {
  customer: "CUSTOMER_SIGNUP",
  provider: "PROVIDER_SIGNUP",
};

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();

  /* ----- state machine -----
     step: choose | form | otp | success
     mode: signup | signin     */
  const [step, setStep] = useState(params.get("mode") === "signup" ? "form" : "choose");
  const [role, setRole] = useState(params.get("role") || "customer");
  const [mode, setMode] = useState(params.get("mode") === "signin" ? "signin" : "signup");

  const [form, setForm] = useState({
    name: "",
    email: params.get("email") || "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  /* OTP state */
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_MINUTES * 60);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successRole, setSuccessRole] = useState("customer");
  const shake = useAnimation();

  const googleUrl = useMemo(() => apiGoogleUrl(ROLES[role]?.backend), [role]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  /* ----- OTP timers ----- */
  useEffect(() => {
    if (step !== "otp") return;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ----- Google OAuth hash return (#/login-success?token=… | #/login-failed) ----- */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#/login-success")) {
      const q = new URLSearchParams(hash.split("?")[1] || "");
      const t = q.get("token");
      if (t) {
        setToken(t);
        login(t).then(() => {
          window.history.replaceState(null, "", window.location.pathname);
          toast.success("Signed in with Google! 🎉");
          navigate("/home", { replace: true });
        });
      }
    } else if (hash.startsWith("#/login-failed")) {
      window.history.replaceState(null, "", window.location.pathname);
      toast.error("Google sign-in failed. Please try again or use email.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----- validation ----- */
  const validate = () => {
    const er = {};
    if (mode === "signup") {
      if (!form.name.trim()) er.name = "Please tell us your name";
      else if (form.name.trim().length < 2) er.name = "Name looks too short";
      if (!isValidEmail(form.email)) er.email = "That email doesn't look right";
      if (!isValidPhone(form.phone)) er.phone = "Enter a valid 10-digit Indian mobile (starts 6-9)";
      if (form.password.length < 6) er.password = "Password must be at least 6 characters";
      if (form.confirm !== form.password) er.confirm = "Passwords don't match";
    } else {
      if (!isValidEmail(form.email)) er.email = "That email doesn't look right";
      if (!form.password) er.password = "Enter your password";
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  /* ----- step 1 submit ----- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      shake.start({ x: [0, -10, 10, -7, 7, 0] });
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        // 1) request OTP (purpose based on role)
        const purpose = SIGNUP_PURPOSE[role];
        await apiSendOtp(form.email.trim().toLowerCase(), purpose);
        setSecondsLeft(OTP_EXPIRY_MINUTES * 60);
        setOtp("");
        setOtpError("");
        setStep("otp");
        toast.success("OTP sent to your email! Check your inbox 📬");
      } else {
        // 1) password check → backend sends a LOGIN otp
        await apiLogin(form.email.trim().toLowerCase(), form.password);
        setSecondsLeft(OTP_EXPIRY_MINUTES * 60);
        setOtp("");
        setOtpError("");
        setStep("otp");
        toast.info("Password looks good — now enter the OTP we emailed you. 📬");
      }
    } catch (err) {
      const msg = errMsg(err);
      if (mode === "signup" && /already exists/i.test(msg)) {
        toast.error(msg);
        setMode("signin");
        return;
      }
      if (/too many|wait before|rate/i.test(msg)) {
        toast.error(msg);
        return;
      }
      if (/locked/i.test(msg)) {
        toast.error(msg);
        return;
      }
      toast.error(msg);
      shake.start({ x: [0, -10, 10, -7, 7, 0] });
    } finally {
      setBusy(false);
    }
  };

  /* ----- step 2: verify OTP ----- */
  const verifyOtp = async (code = otp) => {
    if (code.length < 6) return;
    setBusy(true);
    setOtpError("");
    try {
      if (mode === "signup") {
        const purpose = SIGNUP_PURPOSE[role];
        await apiVerifyOtp(form.email.trim().toLowerCase(), code, purpose);
        // now create the account (backend requires verified OTP)
        await apiSignup({
          fullName: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          mobile: form.phone.trim(),
          password: form.password,
          role: ROLES[role].backend,
        });
        setSuccessRole(role);
        setStep("success");
        // per spec: new signup → redirect to sign in
        setTimeout(() => {
          setMode("signin");
          setStep("form");
          setOtp("");
        }, 4500);
      } else {
        const res = await apiVerifyLoginOtp(form.email.trim().toLowerCase(), code);
        const token = res?.token;
        if (!token) throw new Error("No token in login response");
        await login(token);
        toast.success("Welcome back! 🎉");
        navigate("/home", { replace: true });
      }
    } catch (err) {
      const msg = errMsg(err, "That OTP didn't match. Try again.");
      setOtpError(msg);
      shake.start({ x: [0, -12, 12, -8, 8, 0] });
    } finally {
      setBusy(false);
    }
  };

  /* ----- resend OTP ----- */
  const resend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setSecondsLeft(OTP_EXPIRY_MINUTES * 60);
    setOtp("");
    setOtpError("");
    try {
      if (mode === "signup") {
        await apiSendOtp(form.email.trim().toLowerCase(), SIGNUP_PURPOSE[role]);
      } else {
        await apiLogin(form.email.trim().toLowerCase(), form.password);
      }
      toast.success("Fresh OTP sent! 📬");
    } catch (err) {
      toast.error(errMsg(err, "Couldn't resend OTP right now."));
      setResendCooldown(0);
    }
  };

  const purposeLabel = mode === "signup" ? (role === "provider" ? "provider sign-up" : "sign-up") : "login";

  /* ================== SCREENS ================== */

  const chooseScreen = (
    <div className="container page">
      <motion.div className="center mb-30" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="row" style={{ justifyContent: "center", gap: 12 }}>
          <Logo size={54} />
          <div style={{ textAlign: "left" }}>
            <h1 style={{ fontSize: "1.9rem" }}>Socio<span className="grad-text">Sphere</span></h1>
            <p className="muted" style={{ fontSize: "0.95rem" }}>Join the sphere — book or be booked 🪐</p>
          </div>
        </div>
      </motion.div>

      <div className="split">
        {["customer", "provider"].map((r, i) => {
          const R = ROLES[r];
          return (
            <motion.div
              key={r}
              className={`half-panel ${r === "customer" ? "half-customer" : "half-provider"}`}
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.14, type: "spring", stiffness: 160, damping: 20 }}
            >
              <div>
                <motion.div className="big-emoji" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}>
                  {R.emoji}
                </motion.div>
                <h2>{r === "customer" ? "For Customers" : "For Providers"}</h2>
                <p className="tag" style={{ marginBottom: 12, display: "inline-block", background: "rgba(255,255,255,0.1)" }}>{R.tag}</p>
                <p>{R.blurb}</p>
              </div>
              <div className="half-actions">
                <button className="btn btn-primary" onClick={() => { setRole(r); setMode("signup"); setStep("form"); }}>
                  Create account
                </button>
                <button className="btn btn-ghost" onClick={() => { setRole(r); setMode("signin"); setStep("form"); }}>
                  Sign in
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="center mt-30">
        <p className="muted" style={{ fontSize: "0.92rem" }}>
          🔒 OTP verification via email · Demo payments · <Link to="/about" style={{ color: "#ffb3e6" }}>Learn more</Link>
        </p>
      </div>
    </div>
  );

  const formScreen = (
    <div className="container page">
      <motion.div className="glass glass-strong" style={{ maxWidth: 480, margin: "0 auto", padding: "34px 30px" }} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}>
        <button className="btn btn-ghost btn-sm mb-20" onClick={() => setStep("choose")}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="center mb-20">
          <div style={{ fontSize: "2.6rem" }}>{ROLES[mode === "signup" ? role : "customer"].emoji}</div>
          <h1 style={{ fontSize: "1.6rem", marginTop: 6 }}>
            {mode === "signup" ? <>Create {role} account</> : <>Welcome back 👋</>}
          </h1>
          <p className="muted" style={{ fontSize: "0.9rem", marginTop: 6 }}>
            {mode === "signup" ? (
              <>A one-time OTP will be emailed to you to verify your account.</>
            ) : (
              <>We'll verify it's you with an OTP sent to your email.</>
            )}
          </p>
        </div>

        <motion.form animate={shake} onSubmit={handleSubmit} noValidate>
          {mode === "signup" && (
            <>
              <div className="field">
                <label><UserIcon size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Full name</label>
                <input className={`input ${errors.name ? "input-error" : ""}`} placeholder="e.g. Priya Sharma" value={form.name} onChange={set("name")} />
                {errors.name && <div className="err-text">⚠️ {errors.name}</div>}
              </div>
              <div className="field">
                <label><Phone size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Mobile number</label>
                <input className={`input ${errors.phone ? "input-error" : ""}`} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={form.phone} onChange={(e) => set("phone")({ target: { value: e.target.value.replace(/\D/g, "") } })} />
                {errors.phone && <div className="err-text">⚠️ {errors.phone}</div>}
              </div>
            </>
          )}

          <div className="field">
            <label><Mail size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Email</label>
            <input className={`input ${errors.email ? "input-error" : ""}`} type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
            {errors.email && <div className="err-text">⚠️ {errors.email}</div>}
          </div>

          <div className="field">
            <label><Lock size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Password</label>
            <div style={{ position: "relative" }}>
              <input className={`input ${errors.password ? "input-error" : ""}`} type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={form.password} onChange={set("password")} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass((s) => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <div className="err-text">⚠️ {errors.password}</div>}
          </div>

          {mode === "signup" && (
            <div className="field">
              <label><KeyRound size={12} style={{ verticalAlign: "-1px", marginRight: 5 }} /> Confirm password</label>
              <div style={{ position: "relative" }}>
                <input className={`input ${errors.confirm ? "input-error" : ""}`} type={showConfirm ? "text" : "password"} placeholder="Repeat your password" value={form.confirm} onChange={set("confirm")} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowConfirm((s) => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.confirm && <div className="err-text">⚠️ {errors.confirm}</div>}
            </div>
          )}

          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? <Spinner /> : mode === "signup" ? "Send OTP →" : "Continue →"}
          </button>
        </motion.form>

        {mode === "signin" && (
          <div className="center mt-12">
            <button className="btn-link" style={{ background: "none", border: "none", color: "#ffb3e6", cursor: "pointer", fontSize: "0.9rem" }} onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </button>
          </div>
        )}

        <div className="row" style={{ alignItems: "center", gap: 14, margin: "22px 0 4px" }}>
          <div className="divider grow" />
          <span className="tiny">or</span>
          <div className="divider grow" />
        </div>

        <a href={googleUrl} className="btn btn-ghost btn-block" style={{ marginBottom: 14 }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.2 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.2 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
          Continue with Google
        </a>

        <div className="center">
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            {mode === "signup" ? (
              <>Already have an account? <button className="btn-link" onClick={() => setMode("signin")} style={{ background: "none", border: "none", color: "#ffb3e6", fontWeight: 700, cursor: "pointer" }}>Sign in</button></>
            ) : (
              <>New here? <button className="btn-link" onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: "#ffb3e6", fontWeight: 700, cursor: "pointer" }}>Create account</button></>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );

  const otpScreen = (
    <div className="container page">
      <motion.div className="glass glass-strong" style={{ maxWidth: 460, margin: "0 auto", padding: "36px 30px" }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="center mb-20">
          <motion.div style={{ fontSize: "3rem" }} animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
            📬
          </motion.div>
          <h1 style={{ fontSize: "1.55rem", margin: "10px 0 6px" }}>
            {mode === "signup" ? "Verify your email" : "One last step"}
          </h1>
          <p className="muted" style={{ fontSize: "0.92rem" }}>
            {mode === "signup" ? (
              <>We sent a 6-digit OTP to <strong style={{ color: "#ffd166" }}>{form.email}</strong> for your {purposeLabel}.<br />It expires in {OTP_EXPIRY_MINUTES} minutes.</>
            ) : (
              <>Enter the 6-digit OTP sent to <strong style={{ color: "#ffd166" }}>{form.email}</strong> to finish signing in.<br />It expires in {OTP_EXPIRY_MINUTES} minutes.</>
            )}
          </p>
        </div>

        <motion.div animate={shake}>
          <OTPInput length={6} value={otp} onChange={(v) => { setOtp(v); if (v.length === 6) verifyOtp(v); }} disabled={busy} />
          {otpError && <div className="err-text center" style={{ justifyContent: "center", marginTop: 12 }}>⚠️ {otpError}</div>}
          <div className="center mt-12 tiny">
            {secondsLeft > 0 ? <>⏳ OTP expires in <strong style={{ color: "#ffd166" }}>{mmss(secondsLeft)}</strong></> : <strong style={{ color: "#fb7185" }}>OTP expired!</strong>}
          </div>
        </motion.div>

        <button className="btn btn-primary btn-lg btn-block mt-20" disabled={busy || otp.length < 6} onClick={() => verifyOtp()}>
          {busy ? <Spinner /> : <><ShieldCheck size={18} /> {mode === "signup" ? "Verify & create account" : "Verify & sign in"}</>}
        </button>

        <div className="center mt-20" style={{ fontSize: "0.9rem" }}>
          <span className="muted">Didn't get it? </span>
          <button className="btn-link" onClick={resend} disabled={resendCooldown > 0} style={{ background: "none", border: "none", color: resendCooldown > 0 ? "var(--text-faint)" : "#ffb3e6", fontWeight: 700, cursor: resendCooldown > 0 ? "not-allowed" : "pointer" }}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
          </button>
        </div>

        <button className="btn btn-ghost btn-sm btn-block mt-12" onClick={() => setStep("form")} disabled={busy}>
          <ArrowLeft size={15} /> Edit details
        </button>
      </motion.div>
    </div>
  );

  const successScreen = (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
      <div className="bg-blobs"><div className="blob b1" /><div className="blob b2" /></div>
      <Confetti />
      <motion.div className="glass glass-strong center" style={{ maxWidth: 460, padding: "46px 34px" }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
        <motion.div style={{ fontSize: "4.4rem" }} animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
          {successRole === "provider" ? "🚀" : "🎉"}
        </motion.div>
        <h1 style={{ fontSize: "1.7rem", margin: "14px 0 8px" }}>You're <span className="grad-text">in</span>!</h1>
        <p className="muted" style={{ fontSize: "0.96rem", lineHeight: 1.6 }}>
          {successRole === "provider"
            ? "Your provider account is ready. Sign in to start creating services (admin verification may be needed)! 💰"
            : "Your customer account is ready. Sign in to explore services near you! 🛍️"}
        </p>
        <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 22 }}>
          <PartyPopper size={18} color="#ffd166" />
          <span className="tiny">Taking you to sign in…</span>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="bg-blobs"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
          {step === "choose" && chooseScreen}
          {step === "form" && formScreen}
          {step === "otp" && otpScreen}
          {step === "success" && successScreen}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
