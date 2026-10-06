# TusomeEduShelf v126.14 — Consolidated Pre-Publish PDF Upgrade

Built from v126.13 Clean Auto-Save Exam Workflow.

## Pre-Publish PDF
- Pre-Publish PDF now consolidates all unpublished subjects for the same class/stream and assessment title into one report.
- Uses one learner per row and subjects as compact columns.
- Uses standard subject abbreviations where configured (MATH, ENG, KISW, INT SCI, SST, AGR, PRE-TECH, etc.).
- Includes a Subject Key showing each abbreviation's full subject name.
- Includes learner admission number and individual subject marks.
- Preserves X (absent) and Y (irregularity) indicators.
- Calculates each subject mean using percentage-normalized marks, so different maximum marks are handled correctly.
- Calculates each learner mean from their available subject percentages.
- Includes the overall class/stream mean in the report header.
- Includes subject means in the report footer.
- Uses landscape A4-style PDF pages and automatically continues learners across pages.
- The PDF remains a pre-publication check only; it does not publish or alter marks.

## Safety
- No database changes.
- No destructive SQL.
- Existing teacher/admin editing and Approve & Publish workflow retained.
