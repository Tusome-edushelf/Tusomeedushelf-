# TusomeEduShelf v126.46 — School Workspace Load Fix

## Root cause corrected
The `/api/schools/dashboard` members query selected `p.gender` but did not define the `p` table alias. PostgreSQL would reject the query, causing the dashboard endpoint to return HTTP 500 and the school workspace to remain hidden.

## Fix
Added a `LEFT JOIN school_learner_profiles p` constrained by both the selected school and the member email. This preserves members without a learner profile and returns gender for learners when a profile exists. No schema migration or data deletion is included.

## Verification
Run `node --check server.mjs` and `unzip -t` on the deployment ZIP. This is a source-level fix; live Render/PostgreSQL verification still requires deployment/runtime access.
