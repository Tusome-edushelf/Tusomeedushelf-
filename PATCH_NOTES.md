# TusomeEduShelf Exam/API Regression Fix v126.1

## Root cause found
The existing Exams & Results frontend calls:
- `/api/schools/classes?schoolId=...`
- `/api/schools/subjects?schoolId=...`

The current server had POST handlers for creating classes/subjects and an `/api/schools/academic` reader, but it did not have the GET handlers the exam frontend expects. The server therefore fell through to the generic `/api` 404 handler and returned `API endpoint not found.`

## Fix
Added read-only, school-membership-protected GET endpoints:
- `GET /api/schools/classes`
- `GET /api/schools/subjects`

They return both the primary arrays (`classes`, `subjects`) and the compatible `rows` arrays expected by existing frontend code.

## Preserved
- Login and `/api/auth/login`
- Exams & Results page
- Teacher mark entry and CSV upload
- Submit for Review
- Admin review
- Pre-publication PDF
- Approve & Publish
- Learner/parent published-only result visibility
- Existing database schema and environment variables

## Verification
- `node --check server.mjs`: passed
- All inline JavaScript blocks in `index.html`: passed syntax checks
- Critical exam functions: present once
- Required exam endpoints: present
- No database migration required
