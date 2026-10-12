# TusomeEduShelf v126.49 — Safe Exam Publication Check

## Changes
- Prevents an administrator from approving/publishing an exam if the class/stream has no active learners.
- Prevents publication while any active learner in that class/stream is missing a saved mark or an explicit X/Y status.
- Gives a specific error showing how many learners still need a result/status.
- Keeps the existing workflow: teachers save marks directly; administrators can edit before publication; learners/parents only see approved, published results.
- Aligns package.json version with release v126.49.0.

## Safety and verification
- No database schema changes and no learner, parent, teacher, exam, or marks records are deleted or rewritten by this patch.
- `node --check server.mjs` and inline-script syntax checks should pass before deployment.
- ZIP integrity is checked. Live Render/database testing has not been performed.
