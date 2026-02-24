# Findit – Development Roadmap

**Findit** is a Lost and Found platform for Babcock University: users report found items, claimers request items, and finders verify identity before handover. This document outlines how the project was developed phase by phase.

---

## Phase 1: Foundation & Setup

| Step | What was done |
|------|----------------|
| **1.1** | Next.js app created with App Router (`create-next-app`), TypeScript, Tailwind CSS. |
| **1.2** | Backend scaffold: FastAPI app, MySQL (via `database.py`), CORS, env config (`config.py`). |
| **1.3** | Project structure: `src/app` (auth, main, settings), `backend/` (main, routers, auth_utils, database). |
| **1.4** | Design system: theme color `#003898`, Inter Tight font, shared layout and globals. |

**Deliverables:** App runs locally, backend serves, frontend and API can talk.

---

## Phase 2: Authentication

| Step | What was done |
|------|----------------|
| **2.1** | Backend: User model, `/auth/register`, `/auth/login`, JWT (`create_access_token`, `get_current_user`). |
| **2.2** | Backend: Google OAuth (`/auth/google`), login-alert emails. |
| **2.3** | Frontend: Login page (email + password), Sign up page, Google Sign-In (`@react-oauth/google`). |
| **2.4** | Token storage: `localStorage` for `access_token`; `AuthGuard` for protected routes. |
| **2.5** | Password reset: Forgot-password flow, OTP in DB, `/auth/forgot-password`, `/auth/verify-reset`. |

**Deliverables:** Users can sign up, log in (email or Google), and reset password; protected routes require login.

---

## Phase 3: User Profile & Core API

| Step | What was done |
|------|----------------|
| **3.1** | Backend: `/users/me`, `/users/me/stats`, `/users/me/items`, `/users/me/claims`, `/users/me` (delete account). |
| **3.2** | Frontend: Profile page (avatar, stats, reported/claimed items), Settings (account, theme, notifications, etc.). |
| **3.3** | Frontend: Dashboard (user greeting, recent items, quick actions). |
| **3.4** | Image handling: Backend uploads to `uploads/`, static mount; Next.js `remotePatterns` for backend images. |

**Deliverables:** Logged-in users see profile and stats; settings and dashboard are usable.

---

## Phase 4: Items (Report & Browse)

| Step | What was done |
|------|----------------|
| **4.1** | Backend: Item model, `/items` (create, list, get by id), categories, status (e.g. Available, Claimed, Recovered). |
| **4.2** | Frontend: Report flow (report page, form, image upload, category/location/description). |
| **4.3** | Frontend: Items list (browse, filters), item detail page. |
| **4.4** | Optional: Server actions for report (`reportItemAction`) using DB + session; or API-only from client. |

**Deliverables:** Finders can report found items; everyone can browse and view item details.

---

## Phase 5: Claims & Conversations

| Step | What was done |
|------|----------------|
| **5.1** | Backend: Claims model, `/claims` (create claim), Conversations (item + finder + claimer). |
| **5.2** | Backend: `/conversations`, `/conversations/{id}`, `/conversations/{id}/messages`, POST message. |
| **5.3** | Frontend: Claim flow (e.g. “Claim this item” → create claim, open conversation). |
| **5.4** | Frontend: Messages list (conversations), conversation page (`/messages/[id]`), send/receive messages. |
| **5.5** | Frontend: Claimer vs Finder views; `is_finder` / `isClaimer` used for UI (e.g. verification CTA). |

**Deliverables:** Claimers can claim items; finder and claimer get a shared conversation and can chat.

---

## Phase 6: Identity Verification

| Step | What was done |
|------|----------------|
| **6.1** | Backend: `/conversations/{id}/submit-verification` (claimer submits Q&A as a message). |
| **6.2** | Frontend: `VerifyIdentityModal` (claimer): questions/answers, submit to API, show in chat. |
| **6.3** | Backend: `/conversations/{id}/approve-verification` (finder-only): records approval, inserts system-style message. |
| **6.4** | Frontend: `FinderVerificationModal` (finder): calls approve-verification API, shows success/error, then `onVerify()`. |
| **6.5** | UI: Verification request card in chat; finder can open modal and “Verify” to approve. |

**Deliverables:** Claimer submits identity verification; finder can approve it from the modal; conversation shows verification status.

---

## Phase 7: Handover (PIN & Codes)

| Step | What was done |
|------|----------------|
| **7.1** | Backend: Items get `verification_pin`; `/items/{id}/generate_pin` (finder), `/items/{id}/verify_pin` (claimer). |
| **7.2** | Backend: Conversations get `finder_code` / `claimer_code`; `/conversations/{id}/handover/start`, `/handover/verify`. |
| **7.3** | Frontend: `HandoverModal`: show my code, enter other’s code, verify via API. |
| **7.4** | Flow: After verification approval, finder/claimer use handover codes to confirm in-person return. |

**Deliverables:** Finders generate PIN; claimers verify PIN; handover codes support in-person confirmation.

---

## Phase 8: Server-Side Session (Cookie Auth)

| Step | What was done |
|------|----------------|
| **8.1** | `src/lib/auth.ts`: `auth()` reads session from cookie; `setSessionCookie`, `clearSessionCookie`. |
| **8.2** | Login (email): In server action or after client login, set cookie with user id. |
| **8.3** | Login (Google): After client receives token, call `setSessionCookieAction(data.id)`. |
| **8.4** | Logout: Call `signOutAction()` wherever token is cleared (profile, settings, dashboard). |
| **8.5** | Server actions (e.g. claims, items) use `auth()` so DB and business logic see the current user. |

**Deliverables:** Server actions have a consistent view of “current user” via cookie; no reliance on client-only token for server logic.

---

## Phase 9: PWA (Progressive Web App)

| Step | What was done |
|------|----------------|
| **9.1** | Web app manifest: `public/manifest.json` (name, theme_color, display, icons), linked in layout. |
| **9.2** | Service worker: Serwist (`@serwist/next`), `src/app/sw.ts` (precache, runtime cache, offline fallback). |
| **9.3** | Offline page: `src/app/~offline/page.tsx` (client component, “You’re offline” + Retry). |
| **9.4** | Build: Next config wrapped with `withSerwistInit`; build uses `--webpack`; Serwist disabled in dev. |
| **9.5** | TS/config: `tsconfig` (webworker, Serwist typings), `.gitignore` for generated sw files. |

**Deliverables:** App is installable, works offline for cached routes, and shows an offline page when needed.

---

## Phase 10: Dev Experience & Stability

| Step | What was done |
|------|----------------|
| **10.1** | Next.js: `turbopack.root` and `webpack.context` set to project root so module resolution (e.g. `tailwindcss`) is correct. |
| **10.2** | Backend start: `scripts/start-backend.js` (spawn uvicorn with correct cwd); `backend:win` uses same script. |
| **10.3** | One-command start: `scripts/start-all.js` runs Next.js dev + backend; `npm run dev:all`. |
| **10.4** | Optional: `BACKEND_NO_RELOAD=1` to avoid Windows reloader issues. |
| **10.5** | Login/Signup: `useSearchParams` wrapped in `Suspense` to satisfy Next.js. |

**Deliverables:** Single command starts frontend + backend; no resolve errors when running from project root; build and dev run cleanly.

---

## Phase 11: Verification Flow Completion

| Step | What was done |
|------|----------------|
| **11.1** | Backend: `POST /conversations/{id}/approve-verification` (finder-only, inserts approval message). |
| **11.2** | Frontend: `FinderVerificationModal` takes `conversationId`, calls approve API, shows errors, calls `onVerify()` on success. |
| **11.3** | Finder page: Passes `conversationId={Number(conversation.id)}` into the modal. |

**Deliverables:** Finder’s “Verify” button performs a real backend approval and updates the conversation.

---

## Summary Timeline (Logical Order)

```
Phase 1  → Foundation (Next.js, FastAPI, DB, env)
Phase 2  → Auth (email, Google, reset)
Phase 3  → Profile, settings, dashboard
Phase 4  → Items (report, browse, detail)
Phase 5  → Claims & conversations (messages)
Phase 6  → Identity verification (submit + approve)
Phase 7  → Handover (PIN, codes)
Phase 8  → Cookie-based server session
Phase 9  → PWA (manifest, service worker, offline)
Phase 10 → Dev tooling & stability
Phase 11 → Real verification approval in modal
```

---

## Tech Stack (As Built)

| Layer | Choices |
|-------|---------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Auth (client)** | JWT in `localStorage`, Google OAuth, cookie for server actions |
| **Backend** | FastAPI, MySQL, JWT, Google OAuth verification |
| **PWA** | Serwist (Workbox), manifest, offline fallback |
| **Scripts** | `npm run dev`, `npm run dev:all`, `npm run backend:win`, `npm run build` (webpack) |

---

## Possible Next Steps

- Replace mock data on finder conversation page with real API (`/conversations/{id}`).
- Add tests (e.g. `verify_claim_flow.py` as automated QA, or Jest/Playwright for frontend).
- Add frontend `.env.example` and update README with setup and env vars.
- Deploy: frontend (e.g. Vercel), backend (e.g. Railway, Render, or VPS), and production env/config.
