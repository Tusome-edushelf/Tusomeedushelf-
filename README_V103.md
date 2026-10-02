# Tusome EduShelf v103 — API Burst Protection + Universal Response Guard

Local/manual deployment build. GitHub is not modified by this release.

## Fixes
- Keeps the v102 universal API response guard.
- Detects HTTP 429 explicitly and gives a rate-limit message instead of JSON/HTML parsing noise.
- Deduplicates identical toast errors so one failure cannot flood the screen.
- Prevents overlapping `loadSchoolManagement()` requests.
- Prevents overlapping `loadSelectedSchool()` dashboard requests.
- Removes the duplicate school-plan request during initial school dashboard loading and sequences the main school loads.
- Preserves Grade → Stream, learner/parent credentials, DOB `YYYY-MM-DD`, fresh-start reset, attendance, exams, assignments, fees, and existing class/learner relationships.

## Deployment
Replace both `index.html` and `server.mjs` together, then redeploy and hard-refresh the browser.
