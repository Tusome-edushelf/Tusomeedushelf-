# Tusome EduShelf v104 — Create Class Membership Fix

This is a targeted follow-up to v103.

## Fix
The Create Class POST route previously cloned the Express request with `{...req}` before passing it to `requireSchoolMembership`. Express request properties such as `headers` are not preserved by object spread, so the authentication helper could receive a request without `headers` and fail with `TypeError: Cannot read properties of undefined (reading 'cookie')`.

v104 keeps the original Express request object, sets `req.query.schoolId`, and passes that original request to `requireSchoolMembership`. This preserves cookies, authentication, school membership, and the existing class/stream logic.

## Preserved
- Grade → Stream grouping
- Create Class / Stream flow
- Learner and parent credentials
- DOB format YYYY-MM-DD
- Fresh-start learner reset
- Attendance, exams, assignments, fees and existing relationships
- v103 API response guard and request burst protection

## Deployment
Replace both `index.html` and `server.mjs` from this ZIP in the Render service and deploy. GitHub is not modified by this package.
