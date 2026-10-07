# TusomeEduShelf v126.28 — Automatic Teacher & Principal Comments

## Purpose
Automatically populate the Class Teacher's Remark and Principal's Remark on the official CBE report card from the learner's published performance.

## Changes
- Added server-side automatic CBE report-card remarks.
- Teacher remark considers overall CBE level, strongest/priority subject, and published-cycle trend.
- Principal remark provides an overall CBE summary and recommendation.
- Positive/negative trend is mentioned only when supported by previous published results.
- Comments are generated for every learner in bulk stream report cards.
- Individual learner and parent report cards receive the same generated comments through the shared report-card context.
- No discipline, attendance, fee, or other unsupported facts are invented.
- Existing manual data fields remain compatible; automatic comments are used when no stored remarks are available.
- No database schema changes.
- No destructive SQL or data reset.

## Verification
- `node --check server.mjs` passed.
- All 7 inline frontend JavaScript blocks passed `node --check`.
