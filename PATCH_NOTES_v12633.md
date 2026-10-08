# TusomeEduShelf v126.33 — Final A4 Reference-Style Report Card

## What changed
- Replaced the report-card PDF renderer with one authoritative A4 portrait (595×842 pt) builder.
- One learner = exactly one A4 page in the admin stream bulk PDF.
- The same renderer is used for admin, learner and parent report-card downloads.
- Restored a complete top-to-bottom layout: school header, Powered by TusomeEduShelf, learner details, overall performance, CBE subject table, subject-vs-class chart, longitudinal trend, automatic teacher/principal remarks, target tracking, and footer.
- Preserved existing published-result security and exam workflow.
- No database schema or data changes.
- Updated `index.html` and the mirrored `script_0.js` report-card implementation.

## Important
Upload/deploy this ZIP manually. No GitHub or Render files were modified by this patch.
