# Tusome EduShelf v40 — Assignments, Submissions & Grading

Built from v39 Classes & Academic Management.

## Included
- Teacher/school-admin assignment creation from the existing academic management area.
- Learner dashboard "My Class Assignments" section.
- Learners can submit written answers and optional files up to 6 MB.
- Learners can resubmit work.
- Teachers see submissions for their assigned classes/subjects; school admins can see school submissions.
- Teacher/admin marking with marks, maximum marks and written feedback.
- Learners see returned marks and feedback.
- Submission file access is scoped to the learner or authorized school teacher/admin.
- PostgreSQL-backed submission records.
- Existing v39 school, academic, marketplace, premium, M-PESA, discussions, large video and screen-sharing features are preserved.

## Notes
- AI is not used to make final grading decisions. Teacher/admin review remains the authority for school assessment.
- This version stores uploaded submission files in PostgreSQL; production deployments should consider durable storage and file retention policies.
- File uploads are limited to 6 MB in the assignment workflow.
