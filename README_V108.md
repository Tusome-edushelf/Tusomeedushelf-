# Tusome EduShelf v108 — Safe Resume Final TDZ Fix

This build removes the `registrationPrepared` variable entirely from the bulk-registration route to eliminate the initialization-order error reported in production.

It preserves the safe-resume behavior: learners already registered by admission number or learner email in the school are skipped, while new learners continue through registration. Existing accounts and passwords are not modified.

Also preserves Class → Stream rules, YYYY-MM-DD DOB validation, separate learner/parent credentials, v106 bulk performance work, Create Class fixes, and dashboard request protections.

Manual deployment: replace `server.mjs` and `index.html` together, deploy, then hard-refresh the browser. Verify `/api/version` reports `v108-safe-resume-final-tdz-fix`.
