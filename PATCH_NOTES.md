TusomeEduShelf v126.9 — Submit for Review Fix

FIXED:
- Restored the missing submitTeacherExamResults() frontend function.
- Teacher "Submit for Review" now calls POST /api/schools/exams/:id/submit.
- Added an administrator "Submit for Review" action to open/draft exams in the Exams list.
- Administrator submission uses the same secure backend workflow and validates that every active learner has a recorded status/mark.
- Existing admin edit, pre-publish PDF, return-for-correction, and approve-and-publish workflow is preserved.
- Existing automatic feedback remains preserved.
- No database migration or database replacement.
- Existing PostgreSQL data is untouched.

VERIFICATION:
- server.mjs syntax: PASS
- 7 inline JavaScript blocks: PASS
