# Tusome EduShelf v100 – Create Class fix

This build is based on v99 multi-stream management.

Fixes:
- Adds safe `school_classes.stream` and `teacher_email` migrations for existing PostgreSQL databases.
- Keeps all existing classes, learners, streams and relationships.
- Create Class / Stream now refreshes the selected school ID from the workspace selector before submitting.
- Preserves Grade → Stream grouping and existing learner/parent credentials, DOB format, bulk registration and reset behavior.

No GitHub changes are required.
