# TusomeEduShelf v126.45 — School Members & Bulk Registration Recovery

## What changed
- Restored first-class dashboard entry points for **School Members** and **Bulk Learner Registration** in both the executive action row and School Management Centre.
- Added a guarded workspace loader so these actions open the authenticated, selected school workspace before scrolling into hidden sections.
- School Members opens the existing role-separated structure: Learners, Parents/Guardians, and Teachers.
- Parent list retrieval includes the selected school ID, preserving school-scoped parent/learner relationships and the existing admin-only password reset action.
- Bulk registration retains the existing CSV template, preview/validation, 500-learner limit, duplicate-admission checks, separate learner/parent credential downloads, and existing backend endpoint.
- Preserved classes/streams, subject and teacher allocation, exams, report cards, General Results, and term-to-term tracking. No database schema or stored records were changed.

## Validation
- JavaScript syntax checks and inline-script syntax checks passed.
- ZIP integrity check passed.
- This package has not been deployed and has not been tested against the live Render database.
