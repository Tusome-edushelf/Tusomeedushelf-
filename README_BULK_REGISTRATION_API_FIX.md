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


## v73 deployment/API-cache fix

This package keeps the feature-rich `index.html` and `server.mjs` intact and adds only the deployment-synchronisation fixes:
- `GET /api/version` is registered before the API 404 catch-all.
- HTML responses are sent with `no-store`/no-cache headers.
- `X-EduShelf-Version: v74-school-login-fix` identifies the deployed build.
- The frontend contains the same v73 build marker.

### Verify after Render deploy

Open:

`https://YOUR-RENDER-SERVICE.onrender.com/api/version`

Expected JSON contains:

`"ok": true`

and

`"version": "v74-school-login-fix"`

If `/api/version` still returns `API endpoint not found`, Render is not running this `server.mjs` yet; deploy the files from this package together and trigger a fresh deploy/restart.

Do not mix `index.html` or `server.mjs` with older copies.


## v74 school dashboard login fix

This build preserves the v73 cache/version fix and adds the missing `POST /api/schools/login` endpoint used by the School Dashboard sign-in form. It authenticates the supplied account, verifies an active school membership, creates the normal session cookie, and returns the school ID/name/member role expected by the existing frontend.

After deployment, verify `GET /api/version` returns version `v74-school-login-fix`, then test School Dashboard sign-in.
