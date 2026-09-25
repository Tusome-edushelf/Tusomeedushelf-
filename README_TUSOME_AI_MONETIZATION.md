# Tusome EduShelf — Tusome AI Monetization Upgrade

This package keeps the existing Render structure and adds the separate `tusome-ai.html` experience alongside the existing EduShelf AI.

## Included

- `index.html` — existing EduShelf UI with a dedicated **✨ Tusome AI** button, membership AI-usage display, and admin AI usage/revenue reporting.
- `server.mjs` — server-side Tusome AI entitlement checks, monthly usage accounting, M-PESA subscription integration reuse, and admin reporting endpoints.
- `tusome-ai.html` — the existing Tusome AI interface, preserved and connected to the monetized backend.

## AI allowance rules

- Free: 10 AI units/month
- Learner Plus: 100 AI units/month
- Teacher Plus: 250 AI units/month
- School Starter: 500 AI units/month per active school member, using a shared school pool
- School Growth: 1,000 AI units/month per active school member, using a shared school pool
- Administrator accounts: unlimited internal usage

Unit cost:
- Fast = 1 unit
- Balanced = 2 units
- Deep = 4 units
- Each attached file = +2 units

The server checks and deducts usage. The browser cannot increase its own allowance.

## Render environment

Use the existing environment variables already required by the project. In particular, production needs:

```text
DATABASE_URL=your_render_postgresql_url
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODELS=gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash
AUTH_SESSION_SECRET=a_long_random_secret
MPESA_ENV=production
MPESA_CONSUMER_KEY=your_daraja_consumer_key
MPESA_CONSUMER_SECRET=your_daraja_consumer_secret
MPESA_SHORTCODE=your_paybill_or_till_shortcode
MPESA_PASSKEY=your_daraja_passkey
MPESA_CALLBACK_URL=https://tusomeedushelf.onrender.com/api/payments/callback
```

Keep all secrets in Render Environment Variables. Do not put them in HTML or commit them to GitHub.

## Deployment

1. Replace the current repository `index.html`, `server.mjs`, and `tusome-ai.html` with the files in this package.
2. Push the changes to the GitHub repository connected to Render.
3. Let Render deploy and restart the Node service.
4. Confirm PostgreSQL is connected.
5. Confirm `GEMINI_API_KEY` is present.
6. Confirm Daraja production credentials and the HTTPS callback URL are correct before accepting real payments.

The new PostgreSQL tables are created automatically by the existing startup database initialization:

- `ai_usage_monthly`
- `ai_usage_events`

No second database is required.

## Payment safety

Tusome EduShelf should never request or store an M-PESA PIN. For users under 18, membership payments should be made through a parent/guardian or another authorized adult's payment method with permission.

## First production test

Use a test account and verify this sequence:

1. Sign in.
2. Open **✨ Tusome AI**.
3. Send a Fast request and confirm the allowance decreases.
4. Try a file attachment and confirm the extra units are charged.
5. Open Membership and verify the allowance display.
6. Purchase/activate Learner Plus or Teacher Plus through the existing M-PESA flow.
7. Confirm the plan changes and the higher allowance appears.
8. In Administrator → Memberships & Schools, confirm AI requests/units/revenue are visible.
9. Test the M-PESA callback before switching from sandbox to live payment traffic.
