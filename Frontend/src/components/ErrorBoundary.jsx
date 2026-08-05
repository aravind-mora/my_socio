import { Component } from "react";

/**
 * Error boundary — if any page throws, show a styled fallback instead of a
 * blank/white screen. Uses plain <a> tags (not react-router <Link>) so the
 * fallback works even if the router itself is the thing that crashed.
 * Also prints the error to the console for debugging.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    console.error("🛑 SocioSphere crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#0d0716",
            color: "#fdf3ea",
            fontFamily: "'Outfit', system-ui, sans-serif",
          }}
        >
          <div style={{ maxWidth: 460, textAlign: "center" }}>
            <div style={{ fontSize: "3rem" }}>💥</div>
            <h1 style={{ fontFamily: "'Fredoka', sans-serif", margin: "12px 0 8px", fontSize: "1.6rem" }}>
              Oops — something exploded
            </h1>
            <p style={{ opacity: 0.8, fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 8 }}>
              The page hit a bug. You can reload, or head home. The technical detail is below
              (it helps debugging).
            </p>
            <pre
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: 14,
                fontSize: "0.78rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                textAlign: "left",
                opacity: 0.85,
                marginBottom: 18,
              }}
            >
              {this.state.message}
            </pre>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
                style={{
                  fontFamily: "'Fredoka', sans-serif", fontWeight: 600, padding: "12px 22px",
                  borderRadius: 999, border: "none", cursor: "pointer", background: "linear-gradient(120deg,#ff4ecd,#ff9a3d)",
                }}
              >
                ↻ Reload
              </button>
              <a
                href="/home"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, padding: "12px 22px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.2)", color: "#fdf3ea", textDecoration: "none" }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
