# Tusome EduShelf — School Workspace JSON Error Fix

## Fixes
- Added the missing `POST /api/schools/login` endpoint used by the School Dashboard login form.
- School login accepts school email or Kenyan phone number plus password.
- Login verifies active school membership server-side and returns the linked school role.
- Added the missing `GET /api/schools/overview` endpoint used by the School Executive Overview.
- Added database migration for `users.phone` and a unique phone index.
- Expanded school membership/invite role constraints to support parent and bursar roles.
- School registration now stores an optional normalized phone number.

## Important
The JSON error shown in the browser (`Unexpected token '<', "<!DOCTYPE" ...`) occurs when the browser expects JSON from an API endpoint but receives the site's HTML page instead. The School Dashboard was calling endpoints that were missing from the server build. Those endpoints are now present.
