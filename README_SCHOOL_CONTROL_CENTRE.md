# Tusome EduShelf — School Control Centre Build

This build extends the existing Tusome School Plan without replacing its Render structure.

## Role workspaces
- School Admin: school operations and administration
- Teacher: teaching, attendance, assignments, gradebook, results and resources
- Learner: learner dashboard, assignments, results, fees, timetable and Tusome AI
- Parent / Guardian: linked learner progress and school information
- Bursar / Finance: school fee charges, payments and balances

## Backend
- School membership roles now support `bursar` in addition to `admin`, `teacher`, and `learner`.
- Existing school database is migrated safely at startup by replacing the role CHECK constraints.
- Fee charge and payment creation can be performed by a school admin or bursar.
- Existing authentication, PostgreSQL, school membership, M-PESA/Daraja and Tusome AI routes are preserved.

## Deploy
Replace the existing `index.html` and `server.mjs` with the files in this package. Keep the existing `tusome-ai.html` and other project files unchanged.
