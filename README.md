# Tusome EduShelf — Safe Tusome AI Integration

This package keeps the existing **v69 EduShelf structure** and adds the supplied **Tusome AI** as a separate experience.

## Changed
- `index.html`: adds one separate **✨ Tusome AI** navigation button linking to `/tusome-ai`.
- `server.mjs`: adds isolated `/tusome-ai`, `/api/tusome-ai/health`, and `/api/tusome-ai/chat` support while leaving the existing `/api/ai` and other EduShelf routes intact.
- `server.mjs`: raises JSON request capacity so the supplied Tusome AI attachment workflow can accept its 20 MB combined file limit.
- `tusome-ai.html`: the supplied Tusome AI file is included **unchanged**.

## Deploy
Replace the matching files in the existing Render repository, commit and push, then let Render redeploy.

Do not remove the existing School Plan, school account, PostgreSQL, M-PESA, dashboards, or role-specific AI code.
