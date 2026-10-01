# Tusome EduShelf v71 — School API / Cache Fix

This release fixes the School Plan Dashboard issue where an older frontend could continue displaying `API endpoint not found` even though the backend school API routes were working.

## Changes
- School API requests use `cache: no-store` and a cache-busting query parameter.
- Authentication errors are displayed accurately instead of being treated as missing endpoints.
- HTML responses from API endpoints are detected as a frontend/backend deployment mismatch.
- Server HTML responses use `Cache-Control: no-store` and ETag is disabled to prevent stale `index.html`.
- Added `/api/version`, returning `v71` for deployment verification.
- PostgreSQL, school account registration, school dashboard APIs, and M-PESA configuration are preserved.

## Deploy
1. Upload/deploy `index.html` and `server.mjs` to the same Render service.
2. Restart/redeploy the Render service.
3. Verify `https://YOUR-DOMAIN/api/version` returns JSON containing `"version":"v71"`.
4. Open the site in a fresh browser tab.

The project must deploy both files together; do not deploy only one of them.
