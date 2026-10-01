# Tusome EduShelf v82 — School Login Endpoint + Bulk Registration

Fixes:
- Restores `POST /api/schools/login`, which the current `index.html` calls for School Sign In.
- School login verifies credentials and active school membership, creates the session cookie, and returns the school workspace expected by the frontend.
- Keeps the v81 sequential dashboard PostgreSQL queries.
- Keeps v81 dedicated-client bulk learner transaction and required guardian fields.
- Keeps the bulk learner registration UI and CSV workflow.
- API version marker is `v82-school-login-endpoint-fix`.

Deploy `server.mjs`, `index.html`, `package.json`, and this README together.
