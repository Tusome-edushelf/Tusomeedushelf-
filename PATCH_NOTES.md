# TusomeEduShelf v126 Exam Workflow Update

## Root problem
The teacher Exam Results Centre contained a Submit for Review button, but the deployed frontend did not consistently contain the matching handler. The backend review/publish workflow also needed to be explicit and server-enforced.

## What this update does
- Adds a working `submitTeacherExamResults()` flow.
- Adds server-side submission validation.
- Adds admin review actions.
- Adds pre-publication PDF generation with a print fallback if the PDF library is unavailable.
- Adds one-click Admin **Approve & Publish**.
- Prevents learner/parent result APIs from exposing draft, open, closed or pending results.

## Safety
- No CSV learner-registration workflow changes.
- No learner reset.
- No login route changes.
- No unrelated material/payment/AI workflows intentionally changed.
- Database changes are additive only.

## Verification performed
- `node --check server.mjs` passed.
- Inline JavaScript in `index.html` was syntax-checked.
- Exam routes and visibility filters were inspected.
- Live Render/browser testing was not performed from this environment.
