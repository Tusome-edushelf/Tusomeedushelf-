# Tusome EduShelf v46 — School Fees & Financial Management

Adds a school-scoped fee management foundation while preserving v45 communication and all earlier features.

## Included
- School fee charges by learner
- Due dates and fee names
- Learner fee balances
- Confirmed payment recording with method/reference
- School finance tables for charges and payments
- Parent read-only fee dashboard for linked learners
- Learner read-only fee dashboard
- Notifications when a fee charge or payment is recorded
- Server-side school membership checks
- M-PESA PINs are never collected or stored

## Payment note
This version records confirmed payments entered by an authorised school administrator. It does not claim an external M-PESA payment was completed unless the school has verified and recorded it. A dedicated Daraja school-fee STK/callback flow can be added as a separate production payment integration.

## Privacy
Fee information is school-scoped and parent access is limited to learners linked by the school. Production deployment should apply appropriate Kenyan data-protection, retention and access-control requirements.
