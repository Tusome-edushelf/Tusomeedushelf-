# Tusome EduShelf v86 — School Login + Dashboard + Bulk Button Regression Fix

This build fixes three regressions found in the live deployment:

1. **School login API endpoint restored**
   - Restores `POST /api/schools/login`, which the current `index.html` calls.
   - This prevents the frontend from receiving **API endpoint not found** during School Plan sign-in.

2. **School dashboard PostgreSQL bind error fixed**
   - The classes query was passing `schoolId` as `$1` but had no `WHERE c.school_id=$1` clause.
   - This caused the live `08P01` error: `bind message supplies 1 parameters, but prepared statement "" requires 0`.
   - The query now correctly filters by the selected school.

3. **Bulk Register Learners button restored and kept visible**
   - The Quick Actions area explicitly contains `📥 Bulk Register Learners`.
   - `openBulkLearnerRegistration()` loads/shows the school workspace before scrolling to the bulk CSV section.

## Important deployment rule

Upload **both** `index.html` and `server.mjs` from this v86 package together. Do not upload only one file. The frontend and backend are version-matched.

## Validation

- `node --check server.mjs` passed.
- App version: `v86-school-login-dashboard-query-and-bulk-button-fix`.
