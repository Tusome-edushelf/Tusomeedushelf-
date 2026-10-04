# TusomeEduShelf v119 — KICD CBE Exam Subjects Safe Loading

This package is a safety refinement of v118. It preserves the existing exam workflow and v117/v118 business rules while reducing the risk of API bursts and repeated database work.

## Changes
- Exam class loading is performed once and the loaded class list is reused when the selected class changes.
- Removed the duplicate `/api/schools/classes` request from the exam subject refresh function.
- The entire exam subject refresh operation is inside one error-handling path, including the class lookup.
- Grade normalisation is strict: Grade 7/8/9, G7/G8/G9, or 7/8/9 are recognised; arbitrary values ending in 7/8/9 are not.
- KICD curriculum subjects are provisioned with one database INSERT statement instead of one INSERT per subject, then selected in one query.
- Existing school subjects are preserved through `ON CONFLICT`.
- No database migration.
- No learner reset.
- No GitHub changes.
- Manual ZIP deployment remains supported.

## KICD scope
Automatic KICD regular curriculum-design subject loading remains configured for Grade 7, Grade 8 and Grade 9 using the existing v118 subject catalogue.

Grades outside the configured Junior School list continue using the school's existing subjects.

## Validation
- `node --check server.mjs` passes.
- All 7 inline JavaScript blocks extracted from `index.html` pass `node --check`.
