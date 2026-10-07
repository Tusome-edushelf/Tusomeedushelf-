TusomeEduShelf v126.20 — Enhanced Report Card

Built from v126.19 Report Cards & General Results.

Added:
- Enriched published report-card context endpoint: GET /api/report-cards/context
- Individual report cards now include student identity header, total/mean/grade, stream and overall rankings, deviation/trend when historical published results exist, subject-vs-class-mean analytics, longitudinal trend, target/baseline placeholders, official endorsement placeholders, and next-term placeholders.
- Admin stream report-card PDF now uses the enriched context for every learner in the selected stream and generates a two-page report card per learner in one PDF.
- Learner and parent report-card PDF buttons use the same enriched report-card format.
- Learner/parent access remains restricted to published + approved results; parent access verifies the linked learner.
- Admin access to enriched context requires active school-admin membership.
- No database schema changes.
- No destructive SQL, reset, drop, truncate, or data migration.
- Existing General Results PDF, Pre-Publish PDF, Auto-Save workflow, admin mark editing, and Approve & Publish workflow retained.

Unavailable fields are deliberately shown as "Not set" / "Not available" rather than invented:
- KCPE/KPSEA baseline entry score
- target grade/score
- teacher/principal remarks
- digital stamp/signature
- opening/closing dates
- fee expectation

Verification:
- server.mjs node --check: PASS
- all inline JavaScript blocks in index.html: PASS
- ZIP integrity: PASS
