# v126.11 — Real School Admin Mark Sheet Submission Fix

This build is based on the actual current exam frontend/backend source.

Fixed:
1. The School Admin dashboard now shows draft/open exam mark sheets in Results Review & Publication.
2. Admin has **Edit Mark Sheet** for draft exams.
3. Admin has **Submit Mark Sheet for Review** for draft exams.
4. Pending exams keep Edit Submitted Marks, Pre-Publish PDF, Return for Correction, and Approve & Publish.
5. The teacher-only Marks Entry panel is hidden for school administrators.
6. `/api/schools/exams/:id/submit` now authorizes school administrators as well as assigned teachers.
7. `/api/schools/exams/:id/marks` now allows authorized school administrators to edit draft/pending sheets, while approved/published sheets remain locked.
8. Existing learner/parent/teacher/exam data is not replaced or deleted.

IMPORTANT:
- Deploy these files to the same Render service.
- Keep the existing DATABASE_URL.
- Do not create a new database.
