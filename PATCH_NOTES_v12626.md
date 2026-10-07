# TusomeEduShelf v126.26 — Report Card PDF Visibility & Context Fix

## Fixes
- Fixed PDF text appearing extremely faint after shaded/filled boxes. The PDF drawing helper now resets both non-stroking and stroking colors after filled rectangles.
- Reworked the enhanced report-card PDF layout for clear high-contrast rendering:
  - Page 1: learner identity, baseline, examination/session, total marks, mean score, mean grade, stream/overall rank, complete subject table, and X/Y key.
  - Page 2: subject-vs-class-mean chart, longitudinal trend, target tracking, teacher/principal remarks, stamp/signature area, and next-term information.
- Increased readability of report-card headings, table values, chart labels and official sections.
- Kept X/Y handling and percentage normalization.
- Fixed school-admin report-card context to use the active school membership admin role as the authoritative permission.
- For a selected class/stream, the admin context now selects a learner who actually has published results instead of blindly selecting the first roster learner.
- Report-card result queries now use the learner profile as optional metadata; an absent `school_learner_profiles` row no longer removes an enrolled learner from published results.
- Parent report-card context now verifies the active `parent_guardian_links` relationship directly rather than requiring a learner profile row.

## Preserved
- Existing Auto-Save exam workflow.
- Admin mark-sheet editing.
- Pre-Publish PDF workflow.
- Approve & Publish workflow.
- Admin bulk stream report cards.
- Admin General Results PDF.
- Learner and parent report-card/general-results downloads.
- No database schema changes.
- No DROP/TRUNCATE/reset operations.
