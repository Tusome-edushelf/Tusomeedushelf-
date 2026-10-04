# Tusome EduShelf v118 — KICD CBE automatic exam subjects

## Exam workflow change
- Exam creation now loads subjects automatically according to the KICD regular curriculum-design subject list for Grade 7, Grade 8 and Grade 9.
- Class/stream selectors show `Class · Grade — Stream` so multi-stream schools are unambiguous.
- Selecting a Grade 7, 8 or 9 class automatically refreshes the Subject selector.
- The server validates that a Grade 7–9 exam uses a subject from the configured KICD curriculum list for that grade.
- Subjects are automatically provisioned into the school's existing `school_subjects` table; no destructive migration is used.
- Grades outside the configured Junior School list continue using the school's existing subjects rather than being blocked.

## KICD source basis
The configured Junior School subject names are based on the Kenya Institute of Curriculum Development's official regular curriculum-design pages for Grade 7, Grade 8 and Grade 9.

## Preserved
- Existing learner/parent/teacher functionality
- Class → Stream relationships
- Bulk registration and credential rules
- Dashboard/authentication/logout protections
- PDF functionality
- Existing exam marks storage and report-card generation
- No learner reset
- No GitHub changes
