Tusome EduShelf v126.24 — Learner Profile Resolution Fix

Fixes the enhanced report-card context endpoint that could return “Learner profile not found.”
The endpoint now treats active school membership + the user account as the authoritative learner enrollment, with school_learner_profiles as optional enrichment for admission number. This matches existing learner registration data and avoids requiring a separate profile row.

No database/schema changes. No destructive SQL. Existing report-card, stream selector, general results, pre-publish, auto-save, admin editing and publish workflows preserved.
