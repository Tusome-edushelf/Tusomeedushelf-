# Tusome EduShelf — Daraja Sandbox Ready Package

This ZIP is prepared for Safaricom Daraja sandbox testing. Daraja 3.0 provides M-PESA APIs for web and mobile payment integrations and supports sandbox apps for testing.

## 1. Add your credentials locally

1. Install Node.js 18 or newer.
2. Open this project folder in a terminal.
3. Run:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env`.
5. Open `.env` and enter the credentials from your Daraja sandbox app:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_SHORTCODE`
   - `MPESA_PASSKEY`
6. Set `MPESA_CALLBACK_URL` to a **public HTTPS** address ending in `/api/payments/callback`.
7. Start the server:
   ```bash
   npm start
   ```
8. Open `http://localhost:3000`.

## 2. Important callback requirement

Safaricom must be able to reach the callback endpoint from the internet. A plain `http://localhost:3000/...` callback normally cannot receive the Daraja callback. For sandbox testing, use a public HTTPS test/deployment endpoint and set that exact URL in `.env`.

## 3. Never put secrets in the website

Keep `.env` server-side. Do not paste your Consumer Secret, Passkey, or M-PESA PIN into the HTML, GitHub, screenshots, or chat. `.gitignore` already excludes `.env` and transaction data.

## 4. Payment flow

Learner selects a paid material → enters an M-PESA number → Tusome EduShelf server requests an STK Push → learner completes the sandbox prompt → Safaricom sends the callback → server records the result → browser polls transaction status → material is unlocked after a successful result.

## 5. Sandbox vs production

This package is for **sandbox testing only**. It is not a production payment/settlement system. A production deployment should use a database, server-side material ownership/pricing, authenticated users, server-side purchase entitlements, audit logs, HTTPS, and the appropriate Safaricom business/onboarding configuration.

Official Daraja portal: https://developer.safaricom.co.ke/


## AI Assistant
The server exposes POST `/api/ai` and keeps `OPENAI_API_KEY` server-side. Set `OPENAI_API_KEY` in Render Environment Variables and optionally `OPENAI_MODEL`. Do not put the key in `index.html`, GitHub, or chat. The frontend calls `/api/ai`; it should no longer receive the site's HTML as the API response.

## Health check
Open `/api/health` to see whether Daraja and AI are configured. The response never returns secret values.


## Gemini AI
The Study Assistant uses the Gemini API through the server-side `GEMINI_API_KEY` environment variable. The default model is `gemini-3.8-flash`. The AI Assistant also accepts PDF/image question papers and returns direct answers while preserving visible numbering. Do not put the Gemini key in `index.html` or send it in chat.


## Gemini automatic fallback
The server now retries transient Gemini errors (including 429 and 5xx responses) with exponential backoff and then tries the configured fallback models. The default chain is:
- gemini-3.8-flash
- gemini-3.7-flash
- gemini-3.6-flash
- gemini-3.5-flash

Optional environment variables:
- GEMINI_FALLBACK_MODELS
- GEMINI_RETRIES (default 2 retries per model)
- GEMINI_RETRY_DELAY_MS (default 1500 ms)

This does not bypass quotas. If the project has exhausted its quota, changing models may still fail; the app will report that clearly.


## Personalized Learner Progress
The learner Progress dashboard now records Mark My Work attempts locally, calculates average scores, tracks questions attempted and study streaks, groups results by subject/topic, highlights areas to improve and mastered topics, and provides targeted practice shortcuts. Existing Daraja/payment code and the existing prototype structure are preserved for later improvement.


## Strengthened Admin Control
The Administrator Control Center now provides centralized prototype controls for:
- Teacher approval/rejection
- Material approval/rejection
- AI/system-generated note approval, rejection, unpublishing and KES pricing
- User activation/suspension and role management
- Platform reports
- Transaction confirmation/refund controls
- Platform revenue and teacher earnings reporting
- Admin-sent platform notifications
- Audit activity logging

Approval state is respected by the learner-facing material catalogue. Existing Daraja/payment integration remains unchanged for the later payment-improvement phase.


## Direct Teacher Joining + Admin Material Approval
- Teacher accounts can join directly without administrator approval.
- Teachers can access the teacher area and upload learning materials immediately.
- Administrator control is limited to learning-material approval/rejection and material pricing.
- Newly uploaded learning materials start as **pending** and remain hidden from the learner catalogue until approved.
- Admin can set or change the KES selling price before or after approval.
- Daraja/payment integration was not changed.


## Proper Notes Library v1
- Materials are organized as Subject → Grade → Topic → Material.
- Instant search across title, subject, grade and topic.
- Browse tree for fast navigation by subject, grade and topic.
- Every note card shows title, subject, grade, topic, Teacher/System generated, price, approval status, preview and download controls.
- PDF preview opens in an in-app preview window for uploaded PDFs.
- Paid notes require purchase before preview/download; free notes can be previewed/downloaded directly.
- Learner catalogue only exposes approved materials.


## Communication Centre v1
- Dedicated dashboard for complaints and suggestions.
- Users choose Complaint or Suggestion, enter a subject/message, and submit.
- Users can view message status and admin responses.
- Admin can review all submissions, mark Reviewing/Resolved, and respond.
- Prototype data is stored locally in localStorage.


## Home Screen + Role-Based Dashboard Routing v1
- The public home screen is always the first screen when the site is opened or the page is refreshed.
- Login is the gateway to the protected dashboards.
- Learner login routes directly to the Learner Dashboard.
- Teacher login routes directly to the Teacher Dashboard; teacher approval is not required.
- Administrator login routes directly to the Administrator Dashboard.
- Direct navigation to protected dashboards is blocked unless the matching role is logged in.
- Logout clears the session and returns the user to the Home screen.
- Prototype sessions use sessionStorage/localStorage; production should later move authentication and authorization to the server.


## Public Home Screen Isolation v2
- Public Home shows no role dashboard links or dashboard launch controls.
- Learner, Teacher, Administrator and Communication Centre remain behind login/role routing.
- The floating Communication Centre button is hidden on the public Home screen and shown only after a user is logged in.
- Public feature cards use general learning language rather than exposing role-specific dashboard destinations.


### Security Step 1 — Server-side authentication
Login is now verified by the Express server. Sessions use an HttpOnly signed cookie. AI and M-PESA actions require authentication. Demo users are now seeded into PostgreSQL when `DATABASE_URL` is configured; the database is the server-side source for login. Configure `AUTH_SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`.

## Step 2 — PostgreSQL database
Tusome EduShelf now connects to Render PostgreSQL through the `DATABASE_URL` environment variable. On startup the server creates the core `users`, `materials`, and `transactions` tables if they do not already exist, seeds the current administrator/teacher/learner demo accounts from the authentication environment variables, and migrates legacy `transactions.json` records into PostgreSQL.

For a Render-hosted EduShelf service, use the database's **Internal Database URL** as `DATABASE_URL`. Keep this value server-side and never place it in frontend code. The existing `MPESA_SHORTCODE` and `MPESA_PASSKEY` variables remain unchanged.

The current free Render PostgreSQL plan is intended for testing/prototyping and expires according to the database plan shown in Render. Upgrade to a persistent database before production use.


## Step 2E — Server-side learning-material files
- Teacher uploads now send the selected file to the Express server instead of storing the file in browser IndexedDB.
- The material metadata is stored in PostgreSQL `materials`.
- The actual file bytes are stored in PostgreSQL `material_files` and linked to the material.
- Files are limited to 12 MB per material in this build.
- Admins can review material files through a protected server endpoint.
- Learners can open only approved materials; teachers can open their own uploads; admins can review all materials.
- Approval status and KES pricing are updated through protected admin endpoints.
- This database-backed file storage is suitable for the current prototype/testing stage. For larger production libraries, object storage (such as an S3-compatible service) is preferable to storing large files directly in PostgreSQL.
