# Tusome EduShelf — Production Security Hardening

This release hardens the existing platform for the first production-readiness step.

## Changes
- Production startup now requires `AUTH_SESSION_SECRET`.
- Production startup now requires `ADMIN_PASSWORD`.
- Production no longer uses fallback demo credentials from `authUsers()`.
- Production database initialization seeds only the configured administrator; learner/teacher demo accounts are development-only.
- Login attempts are rate-limited per IP + email: 10 unsuccessful attempts per 15 minutes.
- Successful login clears the failed-attempt counter.
- Production session cookies use `Secure; HttpOnly; SameSite=Lax`.
- Logout clears the secure cookie in production.
- Fixed the account-password change assignment bug so changing a password no longer references an undeclared variable.

## Required Render environment variables
Set these before deploying production:

- `NODE_ENV=production`
- `AUTH_SESSION_SECRET=<long random secret>`
- `ADMIN_EMAIL=<administrator email>`
- `ADMIN_PASSWORD=<strong administrator password>`
- `DATABASE_URL=<Render PostgreSQL connection string>`
- `GEMINI_API_KEY=<Gemini API key>` if AI is enabled

Do not use the development demo passwords in production.
