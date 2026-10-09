# TusomeEduShelf v126.42 — School Dashboard Functionality Recovery

## Purpose
Recovery package assembled from the fuller v126.41 application source to restore dashboard sections and controls missing from the older available dashboard source. This is a source recovery, not a database reset or rebuild.

## Dashboard functionality included
- School class/grade and stream creation and management.
- Academic setup, terms/sessions, subject availability and teacher-to-subject/class allocation.
- Registered-member views for learners, parents/guardians and teachers.
- Learner and parent published-results views and report-download controls.
- Term-to-term performance tracking for learner and linked-parent dashboards.
- Exam and marks workflow, pre-publish PDFs, administrator review/editing, and approve/publish controls.
- Report cards, General Results, rankings, statistics and analytics.
- Parent account reset controls added in v126.41, with school-link checks and audit logging.
- Existing learner, teacher, parent, exam, report and results code retained in the full application bundle.

## Safety
- No database schema/migration changes.
- No data deletion or bulk account reset.
- No direct GitHub or Render changes; deployment remains manual.
- This package does not itself prove that production data or live deployment has been tested. Back up the current deployment files and database before replacing files.

## Verification performed
- `node --check server.mjs`
- `node --check script_0.js` and `node --check main-inline.js`
- All non-empty inline scripts in `index.html` syntax-checked.
- Static checks for class/stream creation, teacher-subject allocation, parent and learner dashboards, performance tracking, report downloads and parent password reset.
- ZIP integrity test.
