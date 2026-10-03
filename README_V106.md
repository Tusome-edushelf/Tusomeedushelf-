# Tusome EduShelf v106 — Bulk Registration Timeout Fix

## Purpose
Fixes large learner CSV registration requests that remain on **“Registering…”** and then fail.

## What changed
- Keeps the existing `/api/schools/learners/bulk-register` endpoint and response format.
- Keeps the 500-learner upload limit.
- Keeps Grade/Class → Stream matching and the existing multi-stream rules.
- Keeps strict `YYYY-MM-DD` DOB validation.
- Keeps separate learner and Parent/Guardian credentials.
- Keeps existing-parent detection and learner-parent linking.
- Keeps one database transaction for the actual inserts, so the batch is not partially committed.
- **Changes password hashing from synchronous `scryptSync` calls inside the request loop to asynchronous `crypto.scrypt` with bounded concurrency (4 workers).** This prevents the Node event loop from being blocked by hundreds of password hashes during a 200-learner upload.
- Keeps the batched database inserts introduced in v105.
- Keeps credential CSV generation and the existing success response expected by the dashboard.
- `index.html` is unchanged from v105/v104; no registration button/UI rewrite.
- Does not change classes, subjects, staff, attendance, exams, assignments, fees, reset behaviour, or Create Class / Stream.

## Validation performed
- `server.mjs` JavaScript syntax checked with `node --check`.
- Browser JavaScript extracted from `index.html` and syntax checked.
- `index.html` is unchanged from v105.
- v104 Create Class membership fix remains present.
- v103 429 response handling and dashboard single-flight protections remain present.
- Bulk registration endpoint and credential-download functions remain present.
- 400 asynchronous scrypt hashes were benchmarked locally with the same Node crypto API; the hashing work completed without blocking the main request loop. Actual Render timing can differ.

## Manual deployment
Replace **both** `server.mjs` and `index.html` on Render with the files from this package, then redeploy and hard-refresh the browser.

GitHub is not modified by this package.
