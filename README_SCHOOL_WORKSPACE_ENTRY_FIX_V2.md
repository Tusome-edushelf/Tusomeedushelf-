# Tusome EduShelf — School Workspace Entry Fix v2

## Fix
A school teacher/learner/parent/bursar who signs in through the dedicated School Dashboard login is now explicitly switched to the `schoolDashboard` page before the role-specific school workspace is rendered.

This prevents the visible normal Teacher/Learner dashboard from remaining underneath the school workspace flow.

## Separation
- Normal Tusome sign-in remains the normal Learner/Teacher/Parent dashboard.
- School Dashboard sign-in remains the dedicated school workspace.
- Opening School Dashboard from a normal session now shows the School Dashboard sign-in gate instead of redirecting to the normal role dashboard.
- School role workspace rendering always activates the School Dashboard page first.

## Verification
- `node --check server.mjs` passed.
- All 7 inline JavaScript blocks in `index.html` passed `node --check`.
