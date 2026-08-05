<div align="center">

# 🪐 SocioSphere

### Your neighbourhood, one sphere away.

**A full-stack social services marketplace** — book trusted local services *or* turn your skills into income.
Request a service, receive bids, chat in real time, pay safely, review honestly.

![version](https://img.shields.io/badge/version-1.0.0-ff4ecd?style=for-the-badge)
![node](https://img.shields.io/badge/Node-%3E%3D18-ff9a3d?style=for-the-badge&logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-ff7a59?style=for-the-badge&logo=react&logoColor=white)
![mongo](https://img.shields.io/badge/MongoDB-8-5cf2c9?style=for-the-badge&logo=mongodb&logoColor=white)
![socket](https://img.shields.io/badge/Socket.io-real--time-ffd166?style=for-the-badge&logo=socket.io&logoColor=black)
![license](https://img.shields.io/badge/license-ISC-b6ff5c?style=for-the-badge)

---

**✨ Demo:** `https://sociosphere-zeta.vercel.app` · **📦 Backend repo:** [`aravind-mora/my_socio`](https://github.com/aravind-mora/my_socio)

</div>

---

## 🌟 Highlights

| | |
|---|---|
| 🧑‍💼 **Dual-sided marketplace** | Customers request services & accept bids; providers create services, bid & get paid |
| 📬 **Email OTP auth** | 6-digit OTP via Brevo SMTP for sign-up **and** login, plus Google OAuth |
| 💬 **Real-time channels** | Socket.io chat created the moment a bid is accepted |
| 💳 **Demo payments** | Realistic checkout (UPI / Card / Netbanking / Wallet) with provider verification |
| 🤖 **AI chatbot** | Gemini-powered "Sphere-bot" that answers questions & finds services |
| 🔍 **Geo-aware search** | "Near me" searches within a radius, price & rating sorting |
| 🎨 **"Solar Flare" theme** | Hand-crafted cosmic-ink + magenta→orange UI. Zero blue. 🚫🔵 |

---

## ✨ Features

### For Customers 🛍️
- Browse **1,200+ services** with live ratings & reviews
- Request a service, pick a slot, and get **bids from providers**
- **Accept the best bid** → a private chat **channel opens automatically**
- Pay through the demo gateway → provider verifies → unlock **reviews**
- Track every request with **status filters + newest-first sorting**

### For Providers 🚀
- Create / update / delete services with **photo uploads** (Cloudinary)
- Receive requests, **place bids**, chat, mark complete, request payment
- Provider dashboard: earnings, completed / pending / paid jobs
- Admin verification gate before publishing services

### Platform 🛠️
- JWT auth + role-based access (`CUSTOMER` / `SERVICE_PROVIDER` / `ADMIN`)
- Notifications bell with unread counts (Socket.io push)
- Password reset via email link
- Sphere-bot AI assistant on every page
- Beautiful launch animation (Netflix/JioHotstar style), confetti, 3D tilt cards

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · Vite 5 · React Router 6 · Framer Motion · axios · socket.io-client |
| **Backend** | Node.js · Express 4 · Socket.io · Passport (Google OAuth) · express-rate-limit |
| **Database** | MongoDB (Mongoose 8) — users, services, requests, bids, channels, messages, reviews, payments, notifications |
| **Media** | Cloudinary (multer-storage-cloudinary) for service images |
| **Email** | Nodemailer + Brevo SMTP (OTP, signup, login, payment, reset emails) |
| **AI** | Google Gemini (`gemini-flash-latest`) via `services/ai.service.js` with model failover |

---

## 🗂️ Project Structure

```
socio-sphere/
├── backend/                     # Node + Express API
│   └── src/
│       ├── config/              # db, mail, multer, passport, cloudinary
│       ├── controllers/         # auth, service, request, bid, channel,
│       │                        # message, review, payment, chat, ...
│       ├── middleware/          # auth (JWT), role, adminOnly, upload
│       ├── models/              # Mongoose schemas
│       ├── routes/              # REST route definitions
│       ├── services/            # ai.service, context, intent, notify
│       └── server.js            # Express + Socket.io entry
│
└── sociosphere-frontend/        # React SPA
    └── src/
        ├── api/                 # axios client + endpoint map
        ├── components/          # Navbar, ChatWidget, ServiceCard, ...
        ├── context/             # Auth, Toast providers
        ├── pages/               # Auth, Home, ServiceDetail, Activity,
        │                        # Channels, Channel, Payment, Profile, ...
        ├── config.js            # endpoints + constants (single source)
        └── utils/               # helpers, formatters
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas cluster (or local Mongo)
- A Brevo SMTP key, a Google OAuth app, a Cloudinary account, a Gemini API key

### 1 · Backend

```bash
cd backend
npm install
cp .env.example .env     # fill in your secrets
npm run dev              # http://localhost:5000
```

### 2 · Frontend

```bash
cd sociosphere-frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000
npm run dev              # http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend `.env`

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `FRONTEND_URL` | Public URL of the frontend (Google redirect + CORS) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `JWT_EXPIRE` | Token lifetime (e.g. `24h`) |
| `SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS` | Brevo SMTP for emails |
| `EMAIL_FROM` / `OTP_EMAIL` | From-address for OTPs |
| `OTP_EXPIRY_MINUTES` | OTP validity (default `5`) |
| `ADMIN_SECRET` | Secret to create admin accounts |
| `GEMINI_API_KEY` | Google Gemini key for the chatbot |
| `GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL` | Google OAuth |
| `CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET` | Image uploads |
| `SMTP_API` | Brevo API key |

### Frontend `.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:5000`) |
| `VITE_FRONTEND_URL` | This frontend's public URL |

---

## 🔄 The Core Flow

```
             CUSTOMER                              PROVIDER
        ┌───────────────┐                    ┌─────────────────┐
        │ Browse services│                    │ Create services │
        │ (search/filter)│                    │  (photos+slots) │
        └──────┬────────┘                    └────────┬────────┘
               │  Request (pick a slot)               │
               ▼                                       ▼
        ┌───────────────┐                    ┌─────────────────┐
        │  Request      │ ◄─────── bids ──── │  Place a bid    │
        │  (PENDING)    │                    │  (PENDING)      │
        └──────┬────────┘                    └─────────────────┘
               │  Accept best bid
               ▼
        ┌───────────────────────────────────────────────┐
        │  ✅ Channel created (Socket.io chat)          │
        │  Status → ACCEPTED                           │
        └───────────────────────────────────────────────┘
               │  Provider marks complete
               ▼
        ┌───────────────────────────────────────────────┐
        │  COMPLETED → payment requested → demo pay     │
        │  → provider verifies → PAID                   │
        └───────────────────────────────────────────────┘
               │
               ▼
        ⭐ Review unlocked → provider rating updates
```

---

## 🔌 API Overview

| Area | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/send-otp` · `verify-otp` · `signup` · `login` · `login/verify-otp` · `GET /api/auth/google` |
| **Users** | `GET /api/users/me` · `PUT /api/users/me` |
| **Services** | `GET/POST /api/services` · `GET/PUT/DELETE /api/services/:id` · `GET /api/services/nearby` |
| **Requests** | `POST /api/requests` · `GET /api/requests/customer|provider` · `PATCH /:id/complete` |
| **Bids** | `POST /api/bids` · `GET /api/bids/customer` · `DELETE /api/bids/:id` |
| **Channels** | `GET /api/channels` |
| **Messages** | `GET/POST /api/messages` · `POST /api/messages/read` |
| **Payment** | `POST /api/payment/create` · `verify` · request-flow endpoints |
| **Reviews** | `POST /api/reviews` |
| **Notifications** | `GET /api/notifications` · `PATCH /:id/read` · `GET /unread-count` |
| **AI Chat** | `POST /api/chat` |

> Full endpoint map lives in `sociosphere-frontend/src/config.js`.

---

## ☁️ Deployment

### Frontend → Vercel
1. Import the `sociosphere-frontend` folder
2. Add env vars: `VITE_API_URL`, `VITE_FRONTEND_URL`
3. `vercel.json` (SPA rewrite) is already included — done ✅

### Backend → Render / Railway
1. Point the service at the `backend` folder, build `npm install`, start `npm run dev`
2. Set all backend env vars in the dashboard
3. Set `FRONTEND_URL` to your deployed frontend URL

> ⚠️ Keep `FRONTEND_URL` in the backend in sync with wherever users actually are (localhost vs deployed).

---

## 🔐 Security Notes
- Passwords hashed with **bcrypt**; login rate-limited (5 attempts → 15-min lock)
- Global **express-rate-limit** (relaxed in dev via `NODE_ENV=development`)
- JWT expiry 24h · email OTP verification on signup & login
- Review gating enforced server-side (only after payment)
- Service uploads sanitized via Cloudinary transformations

---

## 🤝 Contributing
1. Fork it 🍴
2. Create your feature branch: `git checkout -b feat/awesome`
3. Commit: `git commit -m 'feat: add something awesome'`
4. Push & open a Pull Request 🚀

---

## 📄 License
Distributed under the **ISC License**.

---

<div align="center">

Made with 💖, ☕ and a little bit of 🪐

**SocioSphere — Your neighbourhood, one sphere away.**

</div>
