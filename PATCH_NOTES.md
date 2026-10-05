TusomeEduShelf v126.10 — School Admin Mark Sheet Submission

FIX:
- School Admin Exams dashboard now shows draft/open mark sheets in the administrator review/action panel.
- Admin gets an explicit “Edit Mark Sheet” button for draft exams.
- Admin gets an explicit “Submit Mark Sheet for Review” button for draft exams.
- Pending exams retain Edit Submitted Marks, Pre-Publish PDF, Approve & Publish, and Return for Correction.
- Backend /api/schools/exams/:id/submit now permits authorized school admins as well as assigned teachers.
- Backend /api/schools/exams/:id/marks permits authorized school admins to edit draft/pending marks while still blocking approved/published exams.
- No database migration, deletion, reset, or replacement.
