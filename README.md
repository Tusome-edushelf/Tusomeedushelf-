# Tusome EduShelf — Daraja Sandbox

This package adds a server-side Safaricom Daraja sandbox STK Push flow to the paid-material prototype.

## Setup
1. Install Node.js 18+.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Create/sign in to a Daraja account and create a sandbox app.
5. Put the sandbox Consumer Key, Consumer Secret, Shortcode and Passkey into `.env`.
6. Set `MPESA_CALLBACK_URL` to a publicly reachable HTTPS URL ending in `/api/payments/callback`.
7. Run `npm start`.
8. Open `http://localhost:3000`.

## Flow
Learner → STK Push → Safaricom callback → server confirms transaction → browser polls status → material unlocks.

## Important
A callback URL on plain localhost normally cannot be reached by Safaricom. Use a public HTTPS test endpoint or deploy the Node server for sandbox testing.

Never put API secrets or an M-PESA PIN in the frontend or chat. This package is for sandbox testing; production use requires the appropriate Safaricom onboarding and account configuration.

Official Daraja portal: https://developer.safaricom.co.ke/


## Phone-only deployment
See `README_PHONE.md` for Android + GitHub + Render deployment steps.
