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
The server exposes POST `/api/ai` and keeps `OPENAI_API_KEY (optional; not required for the local assistant)` server-side. Set `OPENAI_API_KEY (optional; not required for the local assistant)` in Render Environment Variables and optionally `OPENAI_MODEL`. Do not put the key in `index.html`, GitHub, or chat. The frontend calls `/api/ai`; it should no longer receive the site's HTML as the API response.

## Health check
Open `/api/health` to see whether Daraja and AI are configured. The response never returns secret values.


## Free/local AI
This version uses a built-in local educational assistant on your Render server. It does not call OpenAI and does not require API credits or an OPENAI_API_KEY. It provides deterministic explanations, examples, revision notes and practice prompts. It is not a full generative model.
