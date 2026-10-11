# TusomeEduShelf v126.47 — Bulk Parent Password Reset

- Adds a school-admin-only endpoint to reset passwords for all parent/guardian accounts linked to the selected school.
- Uses a database transaction; if any account update fails, the bulk reset rolls back.
- Generates random temporary passwords, stores only password hashes, and returns credentials once for CSV download.
- Adds a confirmation-protected button to the Parents / Guardians tab.
- Existing single-parent reset remains available.
- No schema changes; no parent-learner links or school records are deleted.
- Security note: if a parent account is linked to more than one school, resetting that shared account changes its password globally.
- Static syntax checks do not substitute for a live Render database test.
