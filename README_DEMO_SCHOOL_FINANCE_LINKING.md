# Tusome EduShelf — Demo School & Finance Access Update

This update uses `school@edushelf.com` as the permanent demo school administrator account so school linking can be tested without a school-plan payment.

## Demo school
- School: **Tusome EduShelf Demo School**
- Administrator email: **school@edushelf.com**
- Demo administrator password: **school123** (override with `DEMO_SCHOOL_PASSWORD` in Render if desired)
- Demo school plan: **School Starter, active, KES 0, payment waived for demo testing**

## Linked demo accounts
The server seeds these accounts into the demo school:
- `teacher@edushelf.com` — Teacher
- `learner@edushelf.com` — Learner

Their existing demo passwords remain controlled by `DEMO_TEACHER_PASSWORD` / `DEMO_LEARNER_PASSWORD` (defaults in the server are `teacher123` / `learner123`).

## School access
- School Administrator opens the full school administration dashboard.
- Finance / Bursar is shown directly beside School Administrator and routes to the finance-only role flow.
- Teacher and Learner school access verifies the school name, signed-in email and linked school role before opening the correct workspace.
- Parent/Bursar membership roles are supported by the school membership/invite constraints for future testing.

## Deployment
Replace the existing Render files with:
- `index.html`
- `server.mjs`
- `tusome-ai.html`

Then redeploy/restart the Render service. PostgreSQL startup migrations seed/refresh the demo school and its links automatically.
