# Tusome EduShelf v105 — Bulk Registration Performance Fix

## Purpose
Fixes the bulk learner registration flow getting stuck on **“Registering…”** for larger CSV uploads such as 200 learners.

## What changed
- Keeps the existing `/api/schools/learners/bulk-register` endpoint.
- Keeps the 500-learner upload limit.
- Keeps Grade/Class → Stream matching and the existing multi-stream rules.
- Keeps strict `YYYY-MM-DD` DOB validation, now also rejecting impossible calendar dates.
- Keeps separate learner and Parent/Guardian credentials.
- Keeps existing-parent detection and learner-parent linking.
- Keeps the registration inside one database transaction so a failed batch does not leave a partially registered batch.
- Pre-validates admissions, learner emails, usernames, parent phones and parent email conflicts before the transaction.
- Replaces hundreds/thousands of per-learner database round trips with batched inserts for learner users, learner profiles, memberships, new parent accounts and parent links.
- Keeps credential CSV generation and the existing success response expected by the dashboard.
- Does not change `index.html` or the Register button UI.
- Does not change classes, subjects, staff, attendance, exams, assignments, fees, reset behaviour, or the Create Class / Stream route.

## Validation performed
- `server.mjs` JavaScript syntax checked with `node --check`.
- `index.html` was kept byte-for-byte unchanged from v104.
- v104 Create Class membership fix remains present.
- Existing 429 response handling and dashboard single-flight protections remain present.
- Existing bulk registration endpoint and credential-download functions remain present.

## Manual deployment
Replace **both** `server.mjs` and `index.html` on Render with the files from this package, then redeploy and hard-refresh the browser.

GitHub is not modified by this package.
