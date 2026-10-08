# TusomeEduShelf v126.32 — A4 Report Card MediaBox Fix

## Root cause fixed
The report-card renderer correctly generated an A4 portrait content stream (595 × 842 points), but the PDF wrapper `buildRichBulkPdf()` incorrectly declared each page MediaBox as landscape (842 × 595 points). This caused the upper portion containing the school headline and learner identity block to be clipped/out of view.

## Fix
- `buildRichBulkPdf()` now uses `595 × 842` for the page MediaBox.
- School headline and `POWERED BY TUSOMEEDUSHELF` remain at the top-right.
- Learner identity block remains at the top of every learner page.
- Each learner report card is exactly one A4 portrait page.
- Existing CBE levels, automatic teacher/principal comments, results table, graphs, target section and footer are retained.

## Safety
- No database/schema changes.
- No destructive SQL.
- No exam workflow changes.
