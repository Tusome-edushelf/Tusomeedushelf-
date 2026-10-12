# TusomeEduShelf v126.50 — Published-Results Report Card Accuracy Fix

## Changes
- Report-card draft averages now use only examinations that are both published and approved.
- Only present learners with saved numeric marks and a positive maximum mark contribute to the average; absent/irregular statuses and missing marks are excluded.
- If a term is supplied to the report-generation endpoint, the average is limited to that term.
- Correctly preserves a genuine 0% average instead of treating zero as missing.
- Package version updated to 126.50.0.

## Safety and verification
- No database schema changes. No existing learner, parent, teacher, exam, or marks rows are deleted or rewritten.
- This changes only the calculation used when generating draft report cards.
- Live Render/database behavior has not been tested. Run syntax and archive checks before deployment.
