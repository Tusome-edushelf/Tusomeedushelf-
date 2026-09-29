# Tusome EduShelf — Normal Login + Separate School Plan

## Change
The platform now uses one normal authentication flow for all account types. The School Plan no longer has a separate school/member login flow.

### Normal Sign In
- Learner → Learner Dashboard
- Teacher → Teacher Dashboard
- Parent / Guardian → Parent Dashboard
- Administrator → Admin Dashboard
- School Administrator → School Plan Dashboard

### School Plan
School administration remains a separate workspace and is opened only by an authenticated School Administrator account. Teacher and learner accounts are not rerouted into the School Plan.

The existing school management, classes, attendance, exams/results, finance, parent links, reports, M-PESA/Daraja and other school-plan functionality are preserved.

## Important
Deploy the included `index.html` and `server.mjs` together. Clear an old browser session or log out/in once after deployment so stale school-session flags are removed.
