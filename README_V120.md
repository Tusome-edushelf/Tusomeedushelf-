# TusomeEduShelf v120 — Teacher Assigned Exam Workflow

This version builds the exam marks workflow around the existing `school_teacher_subjects` assignment table.

## Workflow
- Administrator assigns teacher + class/stream + subject.
- A teacher may have multiple subjects and multiple class/streams.
- Teacher exam workspace only returns exams matching the teacher's assigned class/stream + subject combinations.
- Exam marks roster is automatically loaded from active learners in the exact exam class/stream.
- Server verifies teacher assignment before allowing exam/marks access.
- Server verifies every learner in a submitted marks payload belongs to the exam class/stream.
- Maximum marks are validated server-side.
- Teachers can submit completed marks for review.
- Administrators can approve/return submitted results and publish approved results.
- Learner and parent exam result endpoints now expose only published results.
- Existing KICD Grade 7–9 subject validation remains in place.
- Existing school classes/streams, learners, credentials, PDFs, bulk registration, authentication and reset protections are preserved.

## Compatibility/safety
- Uses existing `school_teacher_subjects`; no second teacher-assignment table is introduced.
- Adds non-destructive exam workflow metadata columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- Fixes exam queries to use `school_subjects.subject_name`.
- No learner reset.
- No GitHub changes.
- Not deployed.
