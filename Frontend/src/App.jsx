import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { setToken } from "./api/client";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import OrbitalSphere from "./components/OrbitalSphere";
import { FullScreenLoader } from "./components/Misc";

import Launch from "./pages/Launch";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";
import Payment from "./pages/Payment";
import Activity from "./pages/Activity";
import Channels from "./pages/Channels";
import Channel from "./pages/Channel";
import Profile from "./pages/Profile";
import Provider from "./pages/Provider";
import About from "./pages/About";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

/** Scroll to top on every route change. */
function ScrollToTop() {
  const { pathname } = useLocation();
  // Braces are essential: window.scrollTo() returns a Promise in modern Chrome,
  // and returning a Promise from useEffect makes React call it as a cleanup
  // function → "destroy is not a function" → blank page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

/**
 * The backend redirects Google OAuth & password reset to
 * `${FRONTEND_URL}/#/login-success?token=…`, `#/login-failed`,
 * `#/reset-password/TOKEN`. We catch those hashes here and
 * translate them into app routes.
 */
function HashBridge() {
  const { login } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.startsWith("#/login-success")) {
      const q = new URLSearchParams(hash.split("?")[1] || "");
      const t = q.get("token");
      if (t) {
        setToken(t);
        login(t).then(() => {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          navigate("/home", { replace: true });
        });
      }
    } else if (hash.startsWith("#/login-failed")) {
      window.history.replaceState(null, "", window.location.pathname);
      navigate("/auth", { replace: true });
    } else if (hash.startsWith("#/reset-password/")) {
      const token = hash.replace("#/reset-password/", "").split("?")[0];
      window.history.replaceState(null, "", window.location.pathname);
      navigate(`/reset-password/${encodeURIComponent(token)}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Pages that require a signed-in user. */
function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader text="Checking your session…" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}

/** App shell with navbar/footer/chatbot. */
function Shell() {
  return (
    <>
      <ScrollToTop />
      {/* rotating 3D sphere — transparent website background (behind all UI) */}
      <div className="website-sphere-bg">
        <OrbitalSphere size={440} opacity={0.55} />
      </div>
      <div className="site-content-wrap">
        <div className="bg-blobs"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
      <ChatWidget />
    </>
  );
}

export default function App() {
  return (
    <>
      <HashBridge />
      <Routes>
        {/* intro animation */}
        <Route path="/" element={<Launch />} />

        {/* auth */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* app shell */}
        <Route element={<Shell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/activity" element={<Protected />}>
            <Route index element={<Activity />} />
          </Route>
          <Route path="/channels" element={<Protected />}>
            <Route index element={<Channels />} />
          </Route>
          <Route path="/payment/:id" element={<Protected />}>
            <Route index element={<Payment />} />
          </Route>
          <Route path="/channel/:id" element={<Protected />}>
            <Route index element={<Channel />} />
          </Route>
          <Route path="/profile" element={<Protected />}>
            <Route index element={<Profile />} />
          </Route>
          <Route path="/provider" element={<Protected />}>
            <Route index element={<Provider />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
