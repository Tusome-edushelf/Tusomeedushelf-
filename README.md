# Tusome EduShelf — Teacher Revenue & Admin Payments v8

This version adds a PostgreSQL-backed payment and teacher revenue management layer.

## Added
- Admin **Purchases & Payments** tab showing confirmed purchases, learner, teacher, sale amount, teacher share, and platform revenue.
- Admin **Revenue & Teacher Payouts** tab.
- Configurable teacher revenue percentage; platform automatically receives the remaining percentage.
- Teacher dashboard earnings showing total earned, paid out, available balance, and sales by material.
- Admin can create a teacher payout record and mark it paid after the actual transfer is completed.
- Revenue percentages are stored in PostgreSQL.
- Paid M-PESA transactions store the revenue split used at the time of payment.

## Default split
- Teacher: 80%
- Platform: 20%

The admin can change the split before future purchases.

## Important
The payout records do **not** send money automatically. They record and track a payout after the administrator completes the real transfer. Automatic M-PESA B2C disbursement can be added separately when the required Daraja business credentials and configuration are available.

## Deploy
Deploy the entire project to Render and hard-refresh the browser with Ctrl+Shift+R.
