# TusomeEduShelf v126.30 — A4 Report Card Layout & Learner Details

## Purpose
Refines the enhanced CBE report card to match the supplied reference style more closely and fixes the bulk PDF page presentation.

## Report Card
- Uses true A4 portrait page size: 595 x 842 PDF points.
- One A4 report-card page per learner in the bulk stream download.
- Keeps the school name prominent at the top.
- Adds `POWERED BY TUSOMEEDUSHELF` at the top-right.
- Adds a clear learner identity block with:
  - Learner name
  - Admission number
  - Class and stream
  - Gender (when available)
  - KCPE/KPSEA entry score (when available)
  - Exam session
  - Exam date
- Keeps the overall performance banner with total marks, mean score, CBE level, stream rank, overall rank and deviation.
- Uses a fully bordered subject-results table with CBE levels.
- Keeps subject-vs-class-average and longitudinal performance graphs.
- Keeps automatic class-teacher and principal comments.
- Keeps target tracking, next-term information and CBE legend.
- Adjusts table column boundaries so teacher remarks stay inside the report-card table.
- Compresses row/chart spacing when a learner has many subjects so the report remains usable on A4.

## Server
- Report-card context now exposes learner gender when it exists in the learner profile.
- No database schema changes.
- No data deletion/reset.

## Verification
- `node --check server.mjs` passed.
- All 7 frontend `<script>` blocks passed `node --check`.
- Generated sample PDF verified as A4: `595 x 842 pts`.
- Sample PDF rendered successfully for visual inspection.
