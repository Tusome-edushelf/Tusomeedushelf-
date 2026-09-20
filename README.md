# Tusome EduShelf v35 — Marketplace & Monetization Foundation

Built on v34.2. Preserves learner discussions, large video display and screen sharing.

## Marketplace
- Learner dashboard marketplace section for approved resources.
- Free vs premium resource labels.
- Prices and purchase counts.
- Featured resources and ratings.
- Learners can review resources after a paid purchase or access to a free approved resource.
- Reviews are stored in PostgreSQL and one review per learner/material is enforced.

## Revenue
- Existing M-PESA purchase flow is preserved.
- Existing teacher/platform revenue split is preserved.
- Existing teacher earnings and admin payout records are preserved.
- Admin Marketplace panel shows approved/premium resources, purchases, gross sales, platform revenue, teacher earnings and per-material performance.

## Premium-ready architecture
- Current implementation treats paid materials as premium resources.
- Subscription billing is intentionally not activated yet; this keeps the payment flow focused on individual resources until the business/account/legal setup is ready.

## Safety / ownership
- Teachers should only upload material they own or have permission to distribute.
- Curriculum claims should be verified against authoritative curriculum sources before publication.
- Learner reviews avoid exposing learner email addresses publicly.
- Because learners can be children, production deployment should apply privacy-by-design, data minimisation, age/guardian requirements where applicable, retention controls and appropriate security safeguards.
