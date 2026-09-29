# Tusome EduShelf — Normal Login vs School Workspace Fix

## Change
Normal Learner, Teacher and Parent sign-in now opens the normal role dashboard and does not enter the School Dashboard.

The School Dashboard is a separate workspace entered through its dedicated School Dashboard sign-in. A teacher/learner/parent who uses that dedicated school sign-in can still enter their school-specific workspace.

## Session behavior
- Normal sign-in clears school-workspace context.
- Dedicated School Dashboard sign-in records school-workspace context and detected school member role.
- Opening the School Dashboard without that dedicated school-login context redirects the user to their normal role dashboard instead of showing the school access gate.
- Logout clears school-workspace context.

## Verification
- `node --check server.mjs` passed.
- All inline JavaScript blocks in `index.html` passed `node --check`.
