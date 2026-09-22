# Tusome EduShelf v68 — School Sign In & Create Account

This build adds a dedicated School Sign In / Create School Account area directly inside the School Plan Dashboard.

## Changes
- School Dashboard can be opened publicly from the Home page.
- Unauthenticated visitors see **School Sign In** and **Create School Account** directly on the School Dashboard.
- School Sign In uses the secure `/api/auth/login` endpoint with the `school` role.
- Create School Account uses `/api/auth/school-register` and creates the school administrator, school workspace, active admin membership and a School Starter subscription request.
- Existing school dashboard tools remain available after authentication.
- PostgreSQL, existing school memberships and M-PESA Daraja configuration are preserved.

Deploy both `index.html` and `server.mjs`, then restart/redeploy the Render service.
