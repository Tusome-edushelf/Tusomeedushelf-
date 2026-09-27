# Tusome EduShelf — Monetization Build

This package preserves the existing Render structure and adds revenue features around the existing membership, M-PESA/Daraja, marketplace, School Plan and Tusome AI systems.

## Added
- Learner Plus: 100 AI units/month.
- Teacher Plus: 250 AI units/month.
- School Starter: 500 AI units/month per active school member.
- School Growth: 1,000 AI units/month per active school member.
- Free accounts: 10 AI units/month.
- AI Boost one-time M-PESA packs: 25, 75 and 200 units.
- Server-side AI allowance enforcement for `/api/ai` and standalone `/api/tusome-ai/chat`.
- AI usage and purchased-credit ledger in PostgreSQL.
- M-PESA callback activation for AI Boost credits.
- Membership page shows AI Boost packs.
- Tusome AI shows the current allowance.
- Admin analytics show membership and AI Boost revenue.
- Monetization tables are included in automated backups.
- Existing marketplace/teacher revenue system remains intact.

## Payment safety
- Never enter an M-PESA PIN into EduShelf.
- Use only an authorized payment number.
- AI Boost credits are one-time purchases and do not replace a membership.

## Deploy
Deploy together:
- `index.html`
- `server.mjs`
- `tusome-ai.html`

Then restart the Render service so the PostgreSQL migrations run.

## Existing prices in this build
- Learner Plus: KES 299/month or KES 2,990/year.
- Teacher Plus: KES 599/month or KES 5,990/year.
- School Starter: KES 4,999/month or KES 49,990/year.
- School Growth: KES 9,999/month or KES 99,990/year.
- AI Boost 25: KES 99.
- AI Boost 75: KES 249.
- AI Boost 200: KES 499.

These are product configuration values and can be changed in the seeded database plan/pack records later.
