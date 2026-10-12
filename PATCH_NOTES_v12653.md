# TusomeEduShelf v126.53 — Teacher Dashboard Target Sheets Fix

## User-facing correction
- Added **Performance Target Sheets** as a visible module in the signed-in **School Teacher Workspace**.
- Embedded the existing target-entry form directly in that workspace so teachers do not have to leave for the separate general Tusome Teacher Dashboard.
- Added the module to the teacher role's allowed school-workspace modules.
- Selecting the module scrolls to the target form and refreshes the allocation-based class, subject, term and learner setup.
- Existing target-entry API, allocation checks, upsert behavior, and admin review panel are retained.

## Validation
- JavaScript syntax and package JSON checks passed.
- ZIP integrity checked.
- This is not a live Render deployment and has not been validated against the production database/session. Deploy and verify with a real school teacher account before considering it live.
