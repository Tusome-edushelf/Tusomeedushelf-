# Tusome EduShelf v110 — School Dashboard Auth Gate Fix

## Fix
- Prevents `showPageDirect()` from exposing the School Dashboard management content to unauthenticated visitors.
- Unauthenticated direct/internal attempts now show only the School Plan sign-in gate.
- Adds an authentication/access guard at the start of `loadSchoolManagement()` before any school data request is made.
- Preserves the existing server-side `/api/schools/*` authentication and membership checks.

## Preserved
- v109 PDF generation/download fix
- v108/v107 safe-resume bulk registration
- Class → Stream model
- DOB `YYYY-MM-DD` validation
- Separate learner/parent credentials
- Create Class membership fix
- 429/API response handling and dashboard request protection
- Existing reset, attendance, exams, assignments, fees, and school relationships

## Deployment
Replace `index.html` and `server.mjs` together, deploy manually, then hard-refresh. Verify `/api/version` reports `v110-school-dashboard-auth-gate-fix`.
