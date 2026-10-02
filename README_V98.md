Tusome EduShelf v98 — Multi-Stream Class Management

Changes from v97:
- A class/grade is now presented as one grouped class in the school dashboard.
- Multiple streams can be added under the same class/grade (for example Grade 7 → A, B, C).
- Added an “Add Stream” action beside each class group.
- Existing stream-specific class IDs remain intact so attendance, assignments, exams, reports, learner placement, and bulk registration continue using the existing class_id rules.
- Duplicate stream creation for the same school/class/grade is rejected.
- Attempting to recreate an existing streamless class now directs the administrator to “Add Stream”.
- Dashboard class count is grouped by class name + grade rather than counting each stream as a separate class.
- Existing no-stream classes and their learners are preserved. They appear as “General” until streams are added.
- Existing learner registration, bulk registration, DOB format (YYYY-MM-DD), credentials, parent accounts, and fresh-start reset rules are unchanged.

Safety/verification:
- server.mjs syntax checked with node --check.
- All inline JavaScript from index.html extracted and syntax checked with node --check.
- No new database table is required; the existing school_classes rows continue to represent stream sections, while the dashboard groups them as one class/grade.
