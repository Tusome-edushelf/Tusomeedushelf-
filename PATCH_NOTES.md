# TusomeEduShelf v126.2 — School Login + Exam API Recovery

## Root cause found
The School Dashboard frontend was calling `POST /api/schools/login`, but the deployed/source `server.mjs` did not define that endpoint. This caused the API endpoint not found error during School Sign In.

The exam UI also depended on school class/subject GET endpoints. In addition, the exam POST handlers were checking `req.school.role`, while the membership middleware supplies `req.school.memberRole`. That mismatch prevented authorized school teachers/admins from using exam operations correctly.

## Changes
- Added `POST /api/schools/login`.
- Added `GET /api/schools/classes`.
- Added `GET /api/schools/subjects`.
- Corrected school membership role checks used by exam/report workflows.
- Kept the existing `index.html` and its exam UI intact.
- Kept Submit for Review, Pre-Publish PDF, Admin Review, Approve & Publish, and published-only learner/parent result rules.

## Verification
- `node --check server.mjs` passed.
- Exactly one School Login route.
- Exactly one School Classes GET route.
- Exactly one School Subjects GET route.
- No remaining `req.school.role` references in server.mjs.
- Existing exam routes remain present.

## Deployment order
Upload/replace `index.html` and `server.mjs` together. Then allow Render to complete the deployment and hard-refresh the browser.

## Important
Do not upload the earlier v126 or v126.1 patches together with this package.
