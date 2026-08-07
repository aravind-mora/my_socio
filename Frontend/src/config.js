/**
 * ============================================================
 *  SocioSphere — GLOBAL CONFIG
 *  Aligned 1:1 with backend repo: github.com/aravind-mora/my_socio
 * ============================================================
 */

/** Base URL of the SocioSphere backend (Node server on port 5000). */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

/** FRONTEND_URL from backend .env — used for Google OAuth hash redirects. */
export const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

/** OTP expiry (minutes) — mirrors backend OTP (5 min). */
export const OTP_EXPIRY_MINUTES = 5;

/** Demo payment gateway — pure frontend simulation. */
export const DEMO_PAYMENT = true;

/**
 * Endpoint map — EXACT backend routes (src/server.js + src/routes/*).
 */
export const ENDPOINTS = {
  /* ---- Auth (auth.routes.js) ---- */
  sendOtp: "/api/auth/send-otp", // { email, purpose }
  verifyOtp: "/api/auth/verify-otp", // { email, otp, purpose }
  signup: "/api/auth/signup", // { fullName, email, mobile, password, role }
  login: "/api/auth/login", // { email, password } → sends login OTP
  verifyLoginOtp: "/api/auth/login/verify-otp", // { email, otp } → { token, role }
  google: "/api/auth/google", // GET ?role=CUSTOMER|SERVICE_PROVIDER
  demoLogin: "/api/auth/demo-login", // POST { email, password } → token (no OTP)
  upgradeProvider: "/api/auth/upgrade-provider", // POST (auth)

  /* ---- Users (user.routes.js) ---- */
  me: "/api/users/me", // GET / PUT { fullName, mobile }

  /* ---- Services (service.routes.js) ---- */
  services: "/api/services", // GET ?category&minPrice&maxPrice&minRating
  service: (id) => `/api/services/${id}`, // GET (returns {service, reviewCount, reviews})
  createService: "/api/services", // POST multipart (auth, provider verified)
  updateService: (id) => `/api/services/${id}`, // PUT multipart (auth, owner)
  deleteService: (id) => `/api/services/${id}`, // DELETE (auth, owner)
  nearbyServices: "/api/services/nearby", // GET ?lat&lng&radius

  /* ---- Service Requests (request.routes.js) = "bookings" ---- */
  createRequest: "/api/requests", // { serviceId, requestedSlot }
  providerRequests: "/api/requests/provider", // GET (auth, provider)
  customerRequests: "/api/requests/customer", // GET (auth, customer)
  requestById: (id) => `/api/requests/${id}`, // GET (auth, participant)
  acceptBid: "/api/requests/accept", // POST { requestId, bidId } (customer) → creates channel
  cancelRequest: (id) => `/api/requests/${id}`, // DELETE (customer, only PENDING)
  markRequestCompleted: (id) => `/api/requests/${id}/complete`, // PATCH (provider, ACCEPTED)
  requestPayment: (id) => `/api/requests/${id}/request-payment`, // PATCH (provider)
  createChannelPayment: (id) => `/api/requests/${id}/create-payment`, // POST (customer) → { paymentId }
  confirmChannelPayment: "/api/requests/confirm-payment", // POST { paymentId }
  verifyPaymentByProvider: (id) => `/api/requests/${id}/verify-payment`, // POST (provider)

  /* ---- Bids (bid.routes.js) ---- */
  placeBid: "/api/bids", // POST { serviceRequestId, amount, message } (provider)
  customerBids: "/api/bids/customer", // GET (customer)
  withdrawBid: (id) => `/api/bids/${id}`, // DELETE (provider)

  /* ---- Channels (channel.routes.js) ---- */
  myChannels: "/api/channels", // GET (auth)
  repairChannel: "/api/channels/repair", // POST { serviceRequestId }

  /* ---- Messages (message.routes.js) ---- */
  sendMessage: "/api/messages", // POST { channelId, text }
  channelMessages: (channelId) => `/api/messages/${channelId}`, // GET
  markMessagesRead: "/api/messages/read", // POST { channelId }

  /* ---- Reviews (review.routes.js) ---- */
  createReview: "/api/reviews", // POST { serviceId, rating, comment } (only after PAID)

  /* ---- Payment (payment.routes.js) ---- */
  createPayment: "/api/payment/create", // POST { serviceId } → { paymentId, amount }
  verifyPayment: "/api/payment/verify", // POST { paymentId, success }

  /* ---- Notifications (notification.routes.js) ---- */
  notifications: "/api/notifications", // GET
  notificationRead: (id) => `/api/notifications/${id}/read`, // PATCH
  unreadCount: "/api/notifications/unread-count", // GET

  /* ---- Providers (provider.routes.js) ---- */
  providerProfile: (providerId) => `/api/providers/${providerId}`, // GET
  providerDashboard: "/api/providers/dashboard", // GET (auth, provider)

  /* ---- Password (password.routes.js) ---- */
  forgotPassword: "/api/password/forgot-password", // POST { email }
  resetPassword: "/api/password/reset-password", // POST { token, newPassword }

  /* ---- AI Chatbot (chat.routes.js) ---- */
  chatbot: "/api/chat", // POST { message } (auth) → { success, reply }
};

/** Service categories (as stored in Service.category). */
export const CATEGORIES = [
  { id: "Plumbing", label: "Plumbing", emoji: "🚰" },
  { id: "Electrician", label: "Electrician", emoji: "⚡" },
  { id: "Cleaning", label: "Cleaning", emoji: "🧹" },
  { id: "Repair", label: "Repair & Fix", emoji: "🔧" },
  { id: "Beauty", label: "Beauty & Salon", emoji: "💅" },
  { id: "Fitness", label: "Fitness Trainer", emoji: "🏋️" },
  { id: "Tutoring", label: "Tutoring", emoji: "📚" },
  { id: "Delivery", label: "Delivery", emoji: "🛵" },
  { id: "Cooking", label: "Cooking & Catering", emoji: "🍳" },
  { id: "Photography", label: "Photography", emoji: "📸" },
  { id: "Events", label: "Events", emoji: "🎉" },
  { id: "PetCare", label: "Pet Care", emoji: "🐾" },
  { id: "PestControl", label: "Pest Control", emoji: "🪳" },
  { id: "Moving", label: "Moving & Shifting", emoji: "🚚" },
];

/** ServiceRequest status → badge info. */
export const REQUEST_STATUSES = [
  { key: "PENDING", label: "Pending", color: "#fbbf24" },
  { key: "ACCEPTED", label: "Accepted", color: "#a78bfa" },
  { key: "COMPLETED", label: "Completed", color: "#38bdf8" },
  { key: "PAID", label: "Paid", color: "#34d399" },
  { key: "CANCELLED", label: "Cancelled", color: "#fb7185" },
  { key: "REFUND_REQUESTED", label: "Refund requested", color: "#ff9a3d" },
  { key: "REFUNDED", label: "Refunded", color: "#94a3b8" },
];

/** ServiceRequest.paymentStatus → badge info. */
export const PAYMENT_STATUSES = [
  { key: "NONE", label: "No payment", color: "#94a3b8" },
  { key: "PAYMENT_REQUESTED", label: "Payment requested", color: "#ff9a3d" },
  { key: "PAYMENT_PENDING", label: "Payment pending", color: "#fbbf24" },
  { key: "PAID_PENDING_VERIFICATION", label: "Paid · awaiting verification", color: "#38bdf8" },
  { key: "PAID", label: "Paid", color: "#34d399" },
];

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

/** Indian city presets for service location (lat/lng for GeoJSON). */
export const CITY_COORDS = [
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Wanparti", lat: 16.3672, lng: 78.0689 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
];

/** Default time slots for new services. */
export const PRESET_SLOTS = [
  "09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM", "07:00 PM",
];
