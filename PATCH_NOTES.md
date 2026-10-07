TusomeEduShelf v126.22 — School Admin Access Fix

Fixes the report-card/admin workflow returning “School administrator access is required” even when the user is an active school admin.

Root cause:
- /api/schools/report-cards/generate checked req.school.role.
- requireSchoolMembership provides req.school.memberRole, not req.school.role.

Fix:
- Accept req.school.memberRole === 'admin' or platform req.user.role === 'admin'.
- No database/schema changes.
- No destructive SQL.
- Preserves v126.21 stream selector and report-card/general-results functionality.
