# v126.25 — School Administrator Report Card Context Fix

Fixes the report-card error:
“Learner is not actively enrolled in the selected school/class.”

Root cause: school administrators can have a non-`admin` global account role while their active `school_memberships.member_role` is `admin`. The report-card context route was only treating the global `admin` role as administrator when selecting a learner from a class/stream. It therefore used the administrator's own email as the learner target and could not find a learner enrollment.

Fix:
- Treat the school administrator account roles as admin-capable for report-card context selection when an active school-admin membership is present.
- For a selected class/stream, resolve the learner target from active learner memberships in that class.
- Apply admin access checks consistently to class selection and learner authorization.
- No database/schema changes.
- No destructive SQL.
