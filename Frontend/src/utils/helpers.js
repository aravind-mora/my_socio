import { CATEGORIES, REQUEST_STATUSES, PAYMENT_STATUSES } from "../config";

/** Status helpers (request status + payment status) */
export const statusInfo = (status) =>
  REQUEST_STATUSES.find((s) => s.key === status) || {
    key: status,
    label: status || "Unknown",
    color: "#94a3b8",
  };

export const paymentStatusInfo = (status) =>
  PAYMENT_STATUSES.find((s) => s.key === status) || {
    key: status,
    label: status || "—",
    color: "#94a3b8",
  };

/** Look up emoji + label for a category (backend stores e.g. "Plumbing"). */
export const categoryArt = (cat = "") => {
  const c = CATEGORIES.find((x) => x.id.toLowerCase() === String(cat).toLowerCase());
  return { emoji: c?.emoji || "🛠️", label: c?.label || cat || "Service" };
};

export const GRADS = [
  "linear-gradient(140deg,#ff4ecd,#ff9a3d)",
  "linear-gradient(140deg,#a78bfa,#ff4ecd)",
  "linear-gradient(140deg,#ff9a3d,#ffd166)",
  "linear-gradient(140deg,#5cf2c9,#a3e635)",
  "linear-gradient(140deg,#ff5c7a,#ff9a3d)",
  "linear-gradient(140deg,#38bdf8,#a78bfa)",
];

export const gradFor = (seed) =>
  GRADS[Math.abs(String(seed || "").length + ((String(seed).charCodeAt(0)) || 0)) % GRADS.length];

export const fmtMoney = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const fmtDateTime = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

export const timeAgo = (d) => {
  if (!d) return "";
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
};

export const initialsOf = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SS";

export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isValidPhone = (p) => /^[6-9]\d{9}$/.test(String(p || ""));

/** Service from backend: id, title, description, category, price, slots, images, location, provider{id, fullName, averageRating, ...} */
export const normService = (s = {}) => ({
  ...s,
  id: s.id || s._id,
  provider: s.provider || {},
  category: s.category || "General",
});

/** Backend request: id, service, customer, provider, requestedSlot, status, paymentStatus, paymentId */
export const normRequest = (r = {}) => ({
  ...r,
  id: r.id || r._id,
  service: r.service || {},
  customer: r.customer || {},
  provider: r.provider || {},
});
