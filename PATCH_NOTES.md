# TusomeEduShelf v126.23 — Report Card School Admin Access Fix

Fixed the remaining “School administrator access is required.” error in `/api/report-cards/context`.

Cause: the endpoint checked the global `user.role` for admin access, while school administrators are represented by an active `school_memberships.member_role='admin'` record.

The endpoint now verifies the requested school ID against the logged-in user's active school membership and requires `member_role='admin'`.

Preserved:
- Stream selector
- Bulk stream report-card PDF
- General Results PDF
- Learner/parent published-result restrictions
- Existing exam workflow and Pre-Publish PDF
- No database/schema changes
