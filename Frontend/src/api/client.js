/**
 * SocioSphere — API client
 * Axios instance + typed functions matching the backend repo 1:1
 * (github.com/aravind-mora/my_socio). All routes live in src/config.js.
 */
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL, ENDPOINTS } from "../config";

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/* ---------- token handling ---------- */
const TOKEN_KEY = "sociosphere_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      setToken(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(err);
  }
);

/* ---------- helpers ---------- */
export const errMsg = (err, fallback = "Something went wrong. Please try again.") => {
  const d = err?.response?.data;
  return d?.error || d?.message || (typeof d === "string" ? d : err?.message) || fallback;
};

/* ================= AUTH ================= */

/** POST /api/auth/send-otp { email, purpose: "CUSTOMER_SIGNUP"|"PROVIDER_SIGNUP"|"LOGIN" } */
export const apiSendOtp = (email, purpose) =>
  client.post(ENDPOINTS.sendOtp, { email, purpose }).then((r) => r.data);

/** POST /api/auth/verify-otp { email, otp, purpose } */
export const apiVerifyOtp = (email, otp, purpose) =>
  client.post(ENDPOINTS.verifyOtp, { email, otp, purpose }).then((r) => r.data);

/** POST /api/auth/signup { fullName, email, mobile, password, role } */
export const apiSignup = (payload) =>
  client.post(ENDPOINTS.signup, payload).then((r) => r.data);

/** POST /api/auth/login { email, password } → sends LOGIN otp */
export const apiLogin = (email, password) =>
  client.post(ENDPOINTS.login, { email, password }).then((r) => r.data);

/** POST /api/auth/login/verify-otp { email, otp } → { token, role } */
export const apiVerifyLoginOtp = (email, otp) =>
  client.post(ENDPOINTS.verifyLoginOtp, { email, otp }).then((r) => r.data);

/** GET /api/auth/google?role=… — full URL for the Google button */
export const apiGoogleUrl = (role) =>
  `${API_BASE_URL}${ENDPOINTS.google}?role=${role || "CUSTOMER"}`;

/** POST /api/auth/upgrade-provider (auth) */
export const apiUpgradeProvider = () =>
  client.post(ENDPOINTS.upgradeProvider).then((r) => r.data);

/* ================= USERS ================= */

/** GET /api/users/me */
export const apiMe = () => client.get(ENDPOINTS.me).then((r) => r.data);

/** PUT /api/users/me { fullName, mobile } */
export const apiUpdateProfile = (payload) =>
  client.put(ENDPOINTS.me, payload).then((r) => r.data);

/* ================= SERVICES ================= */

/** GET /api/services ?category&minPrice&maxPrice&minRating */
export const apiGetServices = (params = {}) =>
  client.get(ENDPOINTS.services, { params }).then((r) => r.data);

/** GET /api/services/:id → { service, reviewCount, reviews } */
export const apiGetService = (id) => client.get(ENDPOINTS.service(id)).then((r) => r.data);

/**
 * POST /api/services — multipart/form-data (image files + fields).
 * fields: title, category, description, price, slots (repeated),
 * location[lat], location[lng], images (files, max 5)
 */
export const apiCreateService = (formData) =>
  client.post(ENDPOINTS.createService, formData).then((r) => r.data);

/** PUT /api/services/:id — multipart (same fields; new files appended) */
export const apiUpdateService = (id, formData) =>
  client.put(ENDPOINTS.updateService(id), formData).then((r) => r.data);

/** DELETE /api/services/:id */
export const apiDeleteService = (id) =>
  client.delete(ENDPOINTS.deleteService(id)).then((r) => r.data);

/** GET /api/services/nearby ?lat&lng&radius */
export const apiNearbyServices = (lat, lng, radius = 5000) =>
  client.get(ENDPOINTS.nearbyServices, { params: { lat, lng, radius } }).then((r) => r.data);

/* ================= SERVICE REQUESTS ("bookings") ================= */

/** POST /api/requests { serviceId, requestedSlot } */
export const apiCreateRequest = (serviceId, requestedSlot) =>
  client.post(ENDPOINTS.createRequest, { serviceId, requestedSlot }).then((r) => r.data);

/** GET /api/requests/customer (customer's bookings, service populated) */
export const apiCustomerRequests = () =>
  client.get(ENDPOINTS.customerRequests).then((r) => r.data);

/** GET /api/requests/provider (orders on provider's services, customer populated) */
export const apiProviderRequests = () =>
  client.get(ENDPOINTS.providerRequests).then((r) => r.data);

/** GET /api/requests/:id (service + customer + provider populated) */
export const apiRequestById = (id) => client.get(ENDPOINTS.requestById(id)).then((r) => r.data);

/** POST /api/requests/accept { requestId, bidId } — customer accepts provider bid → channel created */
export const apiAcceptBid = (requestId, bidId) =>
  client.post(ENDPOINTS.acceptBid, { requestId, bidId }).then((r) => r.data);

/** DELETE /api/requests/:id — cancel (customer, PENDING only) */
export const apiCancelRequest = (id) =>
  client.delete(ENDPOINTS.cancelRequest(id)).then((r) => r.data);

/** PATCH /api/requests/:id/complete — provider marks completed (ACCEPTED only) */
export const apiMarkRequestCompleted = (id) =>
  client.patch(ENDPOINTS.markRequestCompleted(id)).then((r) => r.data);

/** PATCH /api/requests/:id/request-payment — provider asks customer to pay */
export const apiRequestPayment = (id) =>
  client.patch(ENDPOINTS.requestPayment(id)).then((r) => r.data);

/** POST /api/requests/:id/create-payment → { paymentId } (customer) */
export const apiCreateChannelPayment = (id) =>
  client.post(ENDPOINTS.createChannelPayment(id)).then((r) => r.data);

/** POST /api/requests/confirm-payment { paymentId } */
export const apiConfirmChannelPayment = (paymentId) =>
  client.post(ENDPOINTS.confirmChannelPayment, { paymentId }).then((r) => r.data);

/** POST /api/requests/:id/verify-payment — provider confirms money received */
export const apiVerifyPaymentByProvider = (id) =>
  client.post(ENDPOINTS.verifyPaymentByProvider(id)).then((r) => r.data);

/* ================= BIDS ================= */

/** POST /api/bids { serviceRequestId, amount, message } — provider places bid */
export const apiPlaceBid = (serviceRequestId, amount, message) =>
  client.post(ENDPOINTS.placeBid, { serviceRequestId, amount, message }).then((r) => r.data);

/** GET /api/bids/customer — bids on the customer's requests (provider populated) */
export const apiCustomerBids = () => client.get(ENDPOINTS.customerBids).then((r) => r.data);

/** DELETE /api/bids/:id — provider withdraws own bid (PENDING only) */
export const apiWithdrawBid = (id) =>
  client.delete(ENDPOINTS.withdrawBid(id)).then((r) => r.data);

/* ================= CHANNELS / MESSAGES ================= */

/** GET /api/channels — my channels (participants + serviceRequest populated) */
export const apiMyChannels = () => client.get(ENDPOINTS.myChannels).then((r) => r.data);

/** POST /api/messages { channelId, text } */
export const apiSendMessage = (channelId, text) =>
  client.post(ENDPOINTS.sendMessage, { channelId, text }).then((r) => r.data);

/** GET /api/messages/:channelId (sender populated) */
export const apiGetMessages = (channelId) =>
  client.get(ENDPOINTS.channelMessages(channelId)).then((r) => r.data);

/** POST /api/messages/read { channelId } */
export const apiMarkMessagesRead = (channelId) =>
  client.post(ENDPOINTS.markMessagesRead, { channelId }).then((r) => r.data);

/** Socket.io client (real-time chat). Auth via handshake token. */
export const socketConnect = () =>
  io(API_BASE_URL, {
    auth: { token: getToken() },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

/* ================= REVIEWS ================= */

/** POST /api/reviews { serviceId, rating, comment } — only after request PAID */
export const apiCreateReview = (payload) =>
  client.post(ENDPOINTS.createReview, payload).then((r) => r.data);

/* ================= PAYMENTS (demo) ================= */

/** POST /api/payment/create { serviceId } → { paymentId, amount } */
export const apiCreatePayment = (serviceId) =>
  client.post(ENDPOINTS.createPayment, { serviceId }).then((r) => r.data);

/** POST /api/payment/verify { paymentId, success } */
export const apiVerifyPayment = (paymentId, success) =>
  client.post(ENDPOINTS.verifyPayment, { paymentId, success }).then((r) => r.data);

/* ================= NOTIFICATIONS ================= */

/** GET /api/notifications */
export const apiNotifications = () => client.get(ENDPOINTS.notifications).then((r) => r.data);

/** PATCH /api/notifications/:id/read */
export const apiNotificationRead = (id) =>
  client.patch(ENDPOINTS.notificationRead(id)).then((r) => r.data);

/** GET /api/notifications/unread-count */
export const apiUnreadCount = () => client.get(ENDPOINTS.unreadCount).then((r) => r.data);

/* ================= PROVIDERS ================= */

/** GET /api/providers/:providerId → { provider, services } */
export const apiProviderProfile = (providerId) =>
  client.get(ENDPOINTS.providerProfile(providerId)).then((r) => r.data);

/** GET /api/providers/dashboard → { totalEarnings, completedJobs, paidJobs, pendingJobs } */
export const apiProviderDashboard = () =>
  client.get(ENDPOINTS.providerDashboard).then((r) => r.data);

/* ================= PASSWORD ================= */

/** POST /api/password/forgot-password { email } */
export const apiForgotPassword = (email) =>
  client.post(ENDPOINTS.forgotPassword, { email }).then((r) => r.data);

/** POST /api/password/reset-password { token, newPassword } */
export const apiResetPassword = (token, newPassword) =>
  client.post(ENDPOINTS.resetPassword, { token, newPassword }).then((r) => r.data);

/* ================= AI CHATBOT ================= */

/** POST /api/chat { message } → { success, reply } (auth required) */
export const apiChatbot = (message) =>
  client.post(ENDPOINTS.chatbot, { message }).then((r) => r.data);

export default client;
