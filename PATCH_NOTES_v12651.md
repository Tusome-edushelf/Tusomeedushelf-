# TusomeEduShelf v126.51 — Performance Target Tracking (Phase 1)

## Baseline
Built on the existing v126.50 source supplied in this workspace. This patch does not replace the application or modify the live service directly.

## Added
- Persistent `school_performance_targets` table created with `CREATE TABLE IF NOT EXISTS` during the existing schema initialization.
- School-scoped target records for a learner, class/stream, optional subject, optional academic term, target percentage, optional CBE target grade, and notes.
- Target create/update API with checks that the learner belongs to the selected class, subject/term belong to the same school, and teacher access is limited to assigned class/subject when saving.
- Target tracking panel on the Exams & Report Cards page for school administrators and teachers.
- Target table compares saved targets with average numeric marks from approved and published exams only. Absence, irregularity and missing marks do not count as numeric results.
- Targets remain separate from exam marks and cannot change grades or rankings.
- Package version updated to 126.51.0.

## Safety and limits
- No existing learner, parent, teacher, exam or marks rows are deleted or rewritten.
- No external database migration is required; the table is created by the app's existing schema initialization.
- This phase adds target entry and comparison in the Exams & Report Cards workspace. It does not yet wire targets into the rich PDF report-card context or the learner/parent performance-history panel; that should be the next isolated phase.
- Live Render and database integration tests were not performed. Run against a staging school first after deployment.
