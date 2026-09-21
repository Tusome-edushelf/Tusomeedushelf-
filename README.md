# Tusome EduShelf V57 — Implemented 2-Day Premium Trial

This build implements the 2-day premium trial in the actual application, using V55 as the base so the secure material payment gate and back navigation remain intact.

## Trial behavior
- Learner Plus shows a **2-Day Free Trial** card directly on the Learner Dashboard.
- Teacher Plus shows a **2-Day Free Trial** card directly on the Teacher Dashboard.
- Starting the trial requires no payment.
- Trial is stored server-side in PostgreSQL for 48 hours.
- Each account can use the free trial only once.
- An active paid membership blocks starting another trial.
- Expired trials are automatically marked `expired` when membership status is checked.
- Trial access does not automatically charge the user.
- The membership page also shows trial availability/status.

## Preserved V55 behavior
- Back navigation improvements.
- Server-side purchase entitlement checks for paid digital materials.
- Previously purchased materials open directly.
- Free materials remain directly accessible.

## Verification
- `server.mjs` passes `node --check`.
- All inline JavaScript blocks in `index.html` pass `node --check`.
