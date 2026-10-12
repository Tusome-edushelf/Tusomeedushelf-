# TusomeEduShelf v126.52 — Target Sheet Workflow

## Built from
The supplied v126.51.0 source. Existing application files and schema retained; no existing learner, parent, teacher, exam, marks, or report-card rows are deleted or rewritten.

## Changes
- Replaced single-learner target entry with a marksheet-style teacher target sheet.
- Teacher selects an allocated class/stream, academic term, and allocated subject; active learners populate automatically.
- Saved targets pre-fill when a sheet is reopened, and saving uses the existing unique scope to update rather than duplicate records.
- Administrator view is read-only and lists saved target sheets with learner-level details. No target-entry controls are shown to administrators.
- Server-side teacher subject/class allocation validation is required for every saved target. Subject and term are required for this workflow.
- Targets remain separate from exam marks, grades, ranks, and publication.

## Validation limits
Static syntax and package checks are run locally. A live Render deployment and real school database were not available for integration testing. Test in staging before deployment.
