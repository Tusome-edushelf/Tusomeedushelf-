# Tusome EduShelf v96 — Fresh Start + Separate Credentials

Based on v95.

- Learner credentials and parent credentials are separate CSV/PDF downloads.
- Bulk registration returns separate learner and parent credential CSV data.
- Credential PDFs are table-oriented.
- Existing parent credential report endpoint added; existing passwords are not recoverable.
- Added admin-confirmed school learner reset requiring `RESET LEARNERS`. It removes learner data/accounts and school-linked parent accounts with no remaining links, while preserving school, classes, subjects and staff.
- DOB remains strictly `YYYY-MM-DD`.
- Bulk Register and Create Class are preserved.
