# Tusome EduShelf — School API + Bulk Learner Registration Fix

This build fixes the School Plan API mismatch that can produce:
`The school server returned an unexpected response. Please redeploy the latest EduShelf files on Render.`

## Included
- School API 404 responses are JSON instead of falling through to index.html.
- Username-aware authentication for learner accounts.
- School learner profile table and username index.
- Individual learner registration with automatic account creation.
- Bulk learner registration endpoint: `POST /api/schools/learners/bulk-register`.
- Registered learner list: `GET /api/schools/learners`.
- Learner class/stream placement: `PATCH /api/schools/learners/:email/placement`.
- Stream remains optional during registration.
- Bulk CSV supports up to 500 learners.
- Bulk registration validates the entire batch before inserting it.
- One-time credential CSV is returned after successful bulk registration.

## Render deployment
Deploy **both** `index.html` and `server.mjs` from this package together. Do not mix these files with older versions. Then trigger a fresh Render deploy/restart.

The database migrations are executed by `initDatabase()` at startup. PostgreSQL is required for School Plan learner registration.
