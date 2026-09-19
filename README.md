# Tusome EduShelf — Automatic Teacher Payouts v9

This version adds automatic teacher revenue payouts using Safaricom M-PESA Daraja B2C.

## Flow
1. Learner completes an approved material purchase.
2. The confirmed transaction locks the teacher/platform revenue split.
3. Teacher saves a payout M-PESA number in the Teacher Dashboard.
4. Admin sets a minimum automatic payout balance and enables automatic payouts.
5. The server checks balances periodically.
6. When a teacher reaches the threshold, the server creates a processing payout and submits it to Daraja B2C.
7. Daraja calls the result callback; successful payouts are marked paid automatically, while failed payouts are recorded as failed.

## Required Render environment variables for live automatic B2C payouts
- `MPESA_ENV=production` when going live
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_B2C_SHORTCODE`
- `MPESA_INITIATOR_NAME`
- `MPESA_SECURITY_CREDENTIAL`
- `MPESA_RESULT_URL` (public HTTPS URL ending in `/api/mpesa/b2c/result`)
- `MPESA_QUEUE_TIMEOUT_URL` (public HTTPS URL ending in `/api/mpesa/b2c/timeout`)

Optional:
- `MPESA_COMMAND_ID` (defaults to `BusinessPayment`)
- `MPESA_B2C_ENDPOINT` (defaults to the Daraja B2C v3 payment endpoint)
- `AUTO_PAYOUT_ENABLED=true` to enable by environment; admin can also enable it in the dashboard
- `AUTO_PAYOUT_THRESHOLD=500`
- `AUTO_PAYOUT_INTERVAL_MS=300000` (5 minutes)

Do not invent Daraja credentials or security credentials. Obtain and configure the appropriate B2C credentials in your Safaricom Daraja account before enabling automatic payouts.

## Important
- Automatic payouts are OFF by default unless `AUTO_PAYOUT_ENABLED=true` is configured or the admin enables them after B2C configuration is present.
- The server will not automatically send money without B2C configuration.
- Payouts use whole Kenyan shillings (`Math.floor(balance)`). Any remainder below KES 1 stays in the teacher balance.
- The system treats `paid` and `processing` payouts as already allocated so it does not create duplicate automatic payouts.
- Sandbox/live B2C behavior depends on the Daraja application and credentials. Test in sandbox before production.

Official Daraja documentation: https://developer.safaricom.co.ke/apis/BusinessToCustomer
