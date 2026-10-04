# TusomeEduShelf v111 — School Dashboard Logout Clear Fix

Built from v110. This version specifically fixes the discovered case where school dashboard details could remain visible after logging out.

## Changes
- Clears/hides all protected School Dashboard management/workspace panels immediately when logout starts.
- Clears selected school/workspace state and invalidates in-flight school-management UI updates.
- Prevents a previously started `/api/schools/mine` load from repainting protected school content after logout.
- Re-checks authentication/session state after awaited school-management loads before continuing to render school data.
- Preserves v110 unauthenticated School Dashboard gate, v109 PDF fixes, v108 safe bulk resume, multi-stream logic, DOB format, credentials, Create Class fix, API/429 handling, and all existing school/learner features.

## Important
- No learner reset was executed.
- No GitHub changes were made.
- Deploy manually using the ZIP contents: `index.html` and `server.mjs`.
- Verify `/api/version` after deployment; expected version: `v111-school-dashboard-logout-clear-fix`.
