# TusomeEduShelf v126.34 — General Results Fix

## Fix
- Reworked the Admin **Download General Results** workflow to use a dedicated server endpoint that returns only officially published and approved results for the selected class/stream.
- Added `/api/schools/general-results?classId=...`.
- The report now consolidates learners and all published subjects directly from the database instead of depending on the generic exam-list/mark-sheet bundle path.
- Includes learner name, admission number, every subject, marks/X/Y and learner mean.
- Added clearer errors when no results have been published yet.
- Preserved the v126.33 A4 report-card renderer and all existing exam/report-card functionality.
- No database schema or data changes.
