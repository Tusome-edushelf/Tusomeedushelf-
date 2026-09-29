# Tusome EduShelf — Exam Results Upgrade

## Learner Dashboard
- Added **Exam Results** quick action.
- Added **My Exam Results** directly to the learner dashboard.
- Shows exam, subject, class, date, marks, grade and teacher feedback.
- Shows result count, latest grade and average percentage.
- Shows published report cards in the learner dashboard.

## Teacher Dashboard
- Added **Exam Results** quick action.
- Added **Exam Results Centre** directly to the teacher dashboard.
- Teachers linked to an active school can select an exam and upload a CSV results sheet.
- CSV columns: `learnerEmail,marks,comment` (comment optional).
- A CSV template can be downloaded for the selected exam and class roster.
- The upload is validated against the selected exam's active learner roster and maximum marks before saving.
- Results are saved through the existing school exam marks API.

## Existing structure preserved
- Existing Exams & Report Cards page remains available.
- Existing school exam creation and manual marks entry remain available.
- Existing learner results and report-card APIs are reused.
- No replacement of the existing dashboard structure.

Deploy `index.html` and `server.mjs` together on Render.
