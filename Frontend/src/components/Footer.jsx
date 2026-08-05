import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="row mb-12" style={{ gap: 10 }}>
              <Logo size={36} glow={false} />
              <span className="display" style={{ fontSize: "1.15rem" }}>Socio<span className="grad-text">Sphere</span></span>
            </div>
            <p className="muted" style={{ fontSize: "0.92rem", maxWidth: 300, lineHeight: 1.6 }}>
              Your neighbourhood, one sphere away. Book trusted local services or turn your
              skills into income — all in one colourful place. 🪐
            </p>
          </div>
          <div>
            <h4 className="mb-12" style={{ fontSize: "1rem" }}>Explore</h4>
            <Link to="/home">Home</Link>
            <Link to="/activity">Activity</Link>
            <Link to="/channels">My Channels</Link>
            <Link to="/about">About</Link>
            <Link to="/provider">Provider Studio</Link>
          </div>
          <div>
            <h4 className="mb-12" style={{ fontSize: "1rem" }}>Account</h4>
            <Link to="/auth">Sign In</Link>
            <Link to="/auth?mode=signup&role=customer">Join as Customer</Link>
            <Link to="/auth?mode=signup&role=provider">Join as Provider</Link>
            <Link to="/profile">Profile</Link>
          </div>
          <div>
            <h4 className="mb-12" style={{ fontSize: "1rem" }}>Support</h4>
            <Link to="/about">Help Centre</Link>
            <Link to="/about">Safety</Link>
            <Link to="/about">Contact</Link>
            <span className="tiny">Made with 💖 & ☕</span>
          </div>
        </div>
        <div className="divider" />
        <div className="row-between wrap" style={{ fontSize: "0.85rem", color: "var(--text-faint)" }}>
          <span>© {new Date().getFullYear()} SocioSphere. All rights reserved.</span>
          <span>Demo payments · No real money involved</span>
        </div>
      </div>
    </footer>
  );
}
