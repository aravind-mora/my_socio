# 🪐 SocioSphere — Frontend

Creative, heavily-animated frontend for the **SocioSphere** backend
([github.com/aravind-mora/my_socio](https://github.com/aravind-mora/my_socio)).
Theme: **"Solar Flare"** — deep cosmic ink + molten magenta → orange gradients + lime accents. Zero blue. 🎨

## Quick start

```bash
npm install
cp .env.example .env      # set VITE_API_URL=http://localhost:5000 (your backend)
npm run dev               # http://localhost:5173
```

Production build: `npm run build && npm run preview` · SSR smoke test: `node smoke-test.mjs`

> The backend repo is cloned at `../backend/backend` (outside this folder) for reference.
> Dev proxy: `vite.config.js` forwards `/api` → `http://localhost:5000` automatically.

## App flow — aligned 1:1 with the backend

| Step | Frontend | Backend call |
|---|---|---|
| 1. Launch | Netflix/JioHotstar logo intro → auth | — |
| 2. Sign up (split: Customer/Provider) | form → **OTP** (send-otp) → **verify-otp** → **signup** → confetti → redirect to **sign in** | `POST /api/auth/send-otp`, `verify-otp`, `signup` |
| 3. Sign in | password → **login OTP** → verify → JWT → `/users/me` | `POST /api/auth/login`, `login/verify-otp`, `GET /api/users/me` |
| 4. Google | button → `/api/auth/google?role=…`; callback lands on `#/login-success?token=…` (hash bridge) | `GET /api/auth/google` |
| 5. Home | search (client-side) + category chips + sort → service grid | `GET /api/services?category=` |
| 6. Service detail | slots + reviews + **Request** (slot picker) | `GET /api/services/:id`, `POST /api/requests` |
| 7. Activity — my requests | cancel · view **bids** · **accept bid → channel created → redirect** · pay · review | `GET /api/requests/customer`, `GET /api/bids/customer`, `POST /api/requests/accept`, `DELETE /api/requests/:id` |
| 8. Activity — requests on my services | **place bid / withdraw** · open chat · mark completed · request payment · verify payment | `GET /api/requests/provider`, `POST /api/bids`, `PATCH …/complete`, `PATCH …/request-payment`, `POST …/verify-payment` |
| 9. Demo payment | create-payment → gateway UI → confirm-payment | `POST /api/requests/:id/create-payment`, `POST /api/requests/confirm-payment` |
| 10. Channel | **Socket.io real-time chat** (auth token handshake) + REST + polling fallback | `GET /api/channels`, `GET /api/messages/:id`, `POST /api/messages`, socket events |
| 11. Profile | fullName/mobile update · **provider upgrade** · forgot-password link · provider dashboard | `PUT /api/users/me`, `POST /api/auth/upgrade-provider`, `GET /api/providers/dashboard` |
| 12. Provider Studio | create/edit/delete services (**multipart** images + slots + geo location) · admin-verification gate | `GET /api/services`, `POST/PUT/DELETE /api/services/:id` |
| 13. Reviews | after request is PAID | `POST /api/reviews` |
| 14. Chatbot | Sphere-bot widget (Gemini via backend) | `POST /api/chat` (auth) |
| 15. Password reset | forgot → reset link (`#/reset-password/:token` hash bridge) | `POST /api/password/forgot-password`, `reset-password` |

## Edge cases handled

- OTP: 5-min expiry countdown, 30s resend cooldown, wrong-OTP shake, paste support, 429 "wait before requesting another OTP".
- Sign-up: "Email already exists" → auto-switch to sign in; unverified OTP → backend blocks signup (403).
- Sign-in: invalid credentials shake; account lockout message (5 failed attempts → 15 min).
- Requests: cannot request own service; providers blocked from categories they serve; duplicate request (409).
- Reviews: only after payment (backend enforced, friendly toast).
- Payments: failure state keeps the request intact; provider must verify receipt (PAID_PENDING_VERIFICATION → PAID).
- Uploads: ≤2MB per image, max 5; slots & lat/lng validated before submit (multipart `location[lat]`/`location[lng]` proven compatible with multer).

## 🔁 Changing the URLs (local ↔ deployed)

Everything is controlled from two files — no code changes needed:

| What | File | Key |
|---|---|---|
| Backend URL the frontend calls | `sociosphere-frontend/.env` | `VITE_API_URL` |
| Frontend's public URL (Google OAuth + CORS) | `sociosphere-frontend/.env` | `VITE_FRONTEND_URL` |
| Where the backend redirects users (Google, reset links) | `backend/backend/.env` | `FRONTEND_URL` |
| Google OAuth callback | `backend/backend/.env` | `GOOGLE_CALLBACK_URL` |

**Local testing:** both `.env` files use `http://localhost:5173` / `http://localhost:5000`.

**Deploying the frontend to Vercel:**
1. `vercel.json` (already in this repo) adds an SPA rewrite so `/home`, `/service/:id` etc. don't 404.
2. In Vercel → Project → Settings → Environment Variables add:
   - `VITE_API_URL` → your deployed backend (e.g. `https://your-backend.onrender.com`)
   - `VITE_FRONTEND_URL` → `https://sociosphere-zeta.vercel.app`
3. Redeploy.

**Deployed backend:** set `FRONTEND_URL=https://sociosphere-zeta.vercel.app` and `GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback` in the backend's env, and register that callback in the Google Cloud console.

> ⚠️ If the backend's `FRONTEND_URL` points at Vercel while you test on `localhost`, Google sign-in will bounce you to the Vercel site (and you'll land on `/#/home` of whatever is deployed there). Keep the two in sync.

## Stack

React 18 · Vite 5 · React Router 6 · Framer Motion · Axios · Socket.io-client · lucide-react · hand-written CSS.
