Tusome EduShelf — Login + Previous Exam System Repair

This version is a preservation-first repair.

Fixed:
- Canonical POST /api/auth/login remains available.
- Added POST /api/login compatibility for older/cached clients.
- Added POST /api/auth/signin compatibility for older/cached clients.
- Login frontend automatically retries /api/login if the canonical login endpoint returns 404.
- Existing authentication/session handling is preserved.

Preserved:
- Previous Exams & Results system.
- Exam creation and class/subject selection.
- Learner marks entry and grading.
- Learner published results/report-card functionality.
- Teacher exam results centre and submission workflow.
- Automatic exam feedback.
- Administrator pre-publication PDF download.
- Physical learner check workflow.
- Direct administrator Approve & Publish workflow.
- Return for Correction workflow.
- Existing PostgreSQL exam data is not deleted or reset by these source changes.

Validation performed:
- server.mjs passed Node syntax validation.
- index.html inline JavaScript passed Node syntax validation.
- Existing exam/admin workflow functions were confirmed present.

Important:
- No GitHub changes were made.
- No Render deployment was made.
- Upload these files manually to the project/deployment.
