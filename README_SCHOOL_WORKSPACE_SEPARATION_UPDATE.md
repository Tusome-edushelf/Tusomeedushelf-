# Tusome EduShelf — School Workspace Separation Update

## What changed
The School Dashboard now acts as a separate school workspace rather than routing school users into the full general Tusome learner/teacher dashboards.

### School login
- School email or phone + password remains the single school login.
- The server identifies the active school membership and role automatically.
- School Admin opens the School Management Centre.
- Teacher, Learner, Parent/Guardian and Bursar open a dedicated school-role workspace.

### Role-specific school workspace
- Teacher: school attendance, exams/results, timetable and school communication.
- Learner: school attendance, results, timetable and school fees.
- Parent/Guardian: linked learner progress, attendance, school fees and school communication.
- Bursar/Finance: school finance and fee records only.

The general learner and teacher dashboards are no longer opened by School Dashboard role routing. Users who want the broader Tusome learner/teacher platform should use the normal Tusome sign-in.

## Structure preserved
- Existing school plan, PostgreSQL school membership, M-PESA/Daraja and school management functionality remain in place.
- Existing `tusome-ai.html` remains separate.
- Existing general learner/teacher dashboards remain available through normal Tusome authentication.

## Verification
- `node --check server.mjs` passed.
- All inline JavaScript blocks in `index.html` passed `node --check`.
