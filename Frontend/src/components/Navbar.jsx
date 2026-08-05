import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, History, Store, User, Info, LogOut, Menu, X, Star, Bell, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiNotifications, apiNotificationRead, apiUnreadCount, timeAgo } from "../utils/navbarApi";

export default function Navbar() {
  const { user, isProvider, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* notifications — only when signed in */
  useEffect(() => {
    if (!user) { setNotifs([]); setUnread(0); return; }
    const load = async () => {
      try {
        const [list, count] = await Promise.all([apiNotifications(), apiUnreadCount()]);
        setNotifs(Array.isArray(list) ? list : []);
        setUnread(count?.unread ?? 0);
      } catch { /* silent */ }
    };
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const openNotifs = async () => {
    setNotifOpen((o) => !o);
    if (!notifOpen && notifs.length) {
      try {
        await Promise.all(notifs.filter((n) => !n.isRead).map((n) => apiNotificationRead(n.id || n._id).catch(() => { })));
        setUnread(0);
      } catch { /* fine */ }
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out. See you soon! 👋");
    navigate("/auth");
  };

  const initials = (user?.fullName || "SS")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const links = (
    <>
      <NavLink to="/home" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
        <Home size={16} /> Home
      </NavLink>
      <NavLink to="/activity" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
        <History size={16} />My Activity
      </NavLink>
      <NavLink to="/channels" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
        <MessageCircle size={16} /> My Channels
      </NavLink>
      {user && (
        <NavLink to="/provider" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          <Store size={16} /> {isProvider ? "My Services" : "Become Provider"}
        </NavLink>
      )}
      <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
        <Info size={16} /> About
      </NavLink>
    </>
  );

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-inner">
        <Link to="/home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Logo size={40} glow={false} />
          <span className="display" style={{ fontSize: "1.28rem", color: "var(--text)" }}>
            Socio<span className="grad-text">Sphere</span>
          </span>
        </Link>

        <nav className="nav-links desktop">{links}</nav>

        <div className="row" style={{ gap: 10 }}>
          {user ? (
            <>
              {isProvider && (
                <Link to="/provider" title="My Studio">
                  <span className="tag" style={{ background: "var(--grad)", color: "#1a0814" }}>
                    <Star size={11} style={{ verticalAlign: "-1px", marginRight: 3 }} /> Provider
                  </span>
                </Link>
              )}
              {/* notifications */}
              <div style={{ position: "relative" }} ref={bellRef}>
                <button onClick={openNotifs} title="Notifications" style={{ position: "relative", width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1.5px solid var(--stroke)", color: "var(--text)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Bell size={18} />
                  {unread > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: "absolute", top: -3, right: -3, minWidth: 19, height: 19, borderRadius: "50%", background: "var(--grad)", color: "#1a0814", fontSize: "0.68rem", fontWeight: 800, display: "grid", placeItems: "center", padding: "0 4px" }}>
                      {unread > 9 ? "9+" : unread}
                    </motion.span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} className="glass glass-strong" style={{ position: "absolute", right: 0, top: 52, width: 320, maxHeight: 380, overflowY: "auto", borderRadius: 18, padding: 10, zIndex: 300 }}>
                      <div className="row-between" style={{ padding: "8px 10px" }}>
                        <strong style={{ fontSize: "0.95rem" }}>🔔 Notifications</strong>
                        <span className="tiny">{notifs.length}</span>
                      </div>
                      {notifs.length === 0 ? (
                        <p className="tiny center" style={{ padding: 20 }}>Nothing yet — you're all caught up! ✨</p>
                      ) : (
                        notifs.map((n) => (
                          <div key={n.id || n._id} style={{ padding: "10px 12px", borderRadius: 12, background: n.isRead ? "transparent" : "rgba(255,78,205,0.08)", border: n.isRead ? "none" : "1px solid rgba(255,78,205,0.25)", marginBottom: 6 }}>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{n.title || "Update"}</div>
                            <div className="tiny" style={{ margin: "3px 0" }}>{n.message}</div>
                            <div className="tiny" style={{ opacity: 0.6 }}>{timeAgo(n.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <NavLink to="/profile" title="Profile">
                <span className="nav-avatar">{initials}</span>
              </NavLink>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
                <LogOut size={15} />
                <span className="d-none-mobile">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">Sign In</Link>
          )}
          <button className="hamburger" onClick={() => setMenuOpen((m) => !m)}>
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onClick={() => setMenuOpen(false)}
          >
            {links}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
