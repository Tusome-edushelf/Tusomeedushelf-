# Tusome EduShelf — School Workspace Entry Fix V4

## Purpose
Fix the School Plan Dashboard entry state that could leave users on a mostly blank School Plan page instead of showing the school login controls.

## Changes
- Fixed `showSchoolAuthGate()` so it no longer hides `schoolAuthGate` immediately after showing it.
- School Dashboard login form is explicitly made visible when the School Dashboard is opened for a normal Tusome session.
- School Sign In action explicitly opens the visible login gate and form.
- Preserved automatic school-role routing after successful `/api/schools/login`:
  - admin → School Management
  - bursar → Finance workspace
  - teacher → School Teacher workspace
  - learner → School Learner workspace
  - parent → School Parent/Guardian workspace
- Removed literal `\\n` markup artifacts around script tags that could appear as visible text at the bottom of the page.
- Kept normal Tusome learner/teacher dashboards separate from School Dashboard sessions.

## Verification
- `node --check server.mjs` passed.
- All 7 inline JavaScript blocks in `index.html` passed `node --check`.
- ZIP contents verified after creation.
