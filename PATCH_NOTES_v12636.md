# TusomeEduShelf v126.36 — General Results Ranking & School Header Fix

- Rebuilt Admin General Results PDF renderer as a dedicated A4 landscape table.
- Adds school name, class, grade, stream and official-result header.
- Ranks learners from Position 1 by mean percentage, with tied positions handled consistently.
- Includes learner name, admission number, every subject, mean and CBE level.
- Handles many subjects by splitting subject columns across result pages while preserving ranking.
- Returns the school name from the server endpoint.
- Preserves published/approved-only security and existing exam/report-card workflows.
- No database schema or data changes.
