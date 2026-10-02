# Tusome EduShelf v95 — consolidated school + PDF credential report

This build is based on the v94 parent-account build and makes a controlled frontend/reporting change.

## Included
- School login API, school classes API, school overview API, bulk learner registration API, and existing learner credential report API retained.
- Create Class and Bulk Register Learners buttons retained.
- Bulk registration still supports up to 500 learners and the existing required fields/business rules.
- Parent accounts and learner-parent links from v94 retained.
- Credential download no longer injects the whole CSV into an inline onclick handler.
- After a successful bulk registration, the credential notice provides both CSV and PDF download buttons.
- PDF contains learner credentials and, where created, parent credentials. Existing parent accounts are clearly marked as existing and their current password is not changed.
- Existing-learner credential report can also be downloaded as CSV or PDF. Existing learner passwords remain non-recoverable because only password hashes are stored.
- Wide Excel template included for long names, email addresses and usernames. CSV remains supported for upload.
- No database reset or deletion is included.

Deploy `index.html`, `server.mjs`, and the XLSX template together.
