# TusomeEduShelf v126.40 — Term-to-Term Performance Tracking

## Added
- Published-result-only learner performance history endpoint.
- Published-result-only parent performance history endpoint with existing learner-link authorization.
- Learner dashboard Term-to-Term Performance panel.
- Parent dashboard Term-to-Term Performance panel.
- Latest mean, previous mean, overall movement and assessment history.
- Subject-by-subject current percentage and movement.
- Automatic Improved / Stable / Needs attention indicators.
- Baseline message when only one published assessment period exists.

## Safety
- No database/schema changes.
- No changes to exam publication workflow.
- Only published + approved exam results are used for progress tracking.
- Parent endpoint only returns data for an actively linked learner.
