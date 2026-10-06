# TusomeEduShelf v126.13 — Clean Auto-Save Exam Workflow

NEW WORKFLOW
Teacher enters marks → Save Mark Sheet → immediately available to School Admin → Teacher/Admin can edit any time before publication → Admin downloads Pre-Publish PDF → Admin Approve & Publish → results locked and released.

Removed from normal workflow:
- Submit for Review
- Submit Mark Sheet for Review
- Return for Correction
- Pending-review dependency

Kept:
- Automatic feedback after saving marks
- Admin mark-sheet editor
- Pre-Publish PDF
- Approve & Publish
- Learner/parent visibility only after final publication

Compatibility:
The old submit/review API routes return HTTP 410 with an explanatory message rather than changing exam state. Existing unpublished exams, including old pending/returned records, remain editable and publishable through the new workflow.

Data safety:
No DROP, TRUNCATE, database replacement, migration, or data reset is included. Keep the existing Render DATABASE_URL.
