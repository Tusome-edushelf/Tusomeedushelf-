# Tusome EduShelf v72 — Full Feature Restore + Deployment Fix

This release restores the newer full-feature EduShelf frontend/backend files and adds deployment verification/cache protection.

## Restored
- Full latest frontend with the newer dashboards and feature sections.
- Newer school learner registration and bulk registration APIs.
- Username/email login support.
- Newer school learner profile/database support.
- Newer Tusome AI and dashboard functionality.
- Existing PostgreSQL, school accounts, school dashboard, parent/teacher/admin features, certificates, marketplace and M-PESA functionality from the supplied latest files.

## Deployment protection
- Adds `/api/version` returning `v72`.
- Disables ETag caching.
- Prevents stale HTML from being cached.
- Adds a frontend version marker for diagnosis.

## Deploy
1. Deploy `index.html` and `server.mjs` together from the same repository/branch/root directory.
2. Restart/redeploy the Render service.
3. Open `https://YOUR-DOMAIN/api/version` and confirm it returns JSON containing `"version":"v72"`.
4. Open the main site in a fresh tab and verify the previously missing features are back.

Do not deploy the older v71 files over this build, because v71 was based on an older feature set.
