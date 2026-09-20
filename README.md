# Tusome EduShelf v37 — Premium Payments & Subscription Management

Built from v36.

## Included
- Real M-PESA STK Push checkout for learner/teacher premium memberships.
- Monthly and yearly membership payment options.
- PostgreSQL subscription payment ledger.
- Payment status polling and automatic activation after confirmed successful callback.
- Subscription start/end dates based on billing cycle.
- Failed-payment state handling.
- Existing school-plan request workflow preserved; school billing remains administrator-managed.
- Admin membership management preserved.
- Existing marketplace, teacher revenue, learner discussions, large video and screen sharing preserved.

## Payment safety
- Never collect or store an M-PESA PIN.
- Phone numbers are normalized server-side.
- Production payment credentials remain server-side environment variables.
- If the user is under 18, payments should use a parent/guardian or other authorized adult's payment method with permission.

## Production notes
- Use HTTPS for the Daraja callback URL.
- Keep Daraja credentials in Render environment variables.
- Test sandbox callbacks before enabling production payments.
- Confirm business/account, payment-provider, tax, consumer-protection and data-protection requirements with the authorized adult/business operator and relevant providers before launch.
- Tusome EduShelf processes educational data; privacy-by-design and child-data safeguards should be reviewed before production.
