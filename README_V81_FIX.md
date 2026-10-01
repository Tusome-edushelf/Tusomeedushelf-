# Tusome EduShelf v81 — dashboard PostgreSQL + bulk registration fix

Fixes included:
- School dashboard database reads are sequential instead of running four pool queries concurrently, targeting the production PostgreSQL bind/protocol error.
- Bulk learner registration now uses a dedicated PostgreSQL client for BEGIN/COMMIT/ROLLBACK, so all inserts stay in one transaction.
- Bulk registration requires Full Name, Admission Number, Class/Grade, Parent/Guardian Name and Parent/Guardian Phone.
- Stream is optional; when a grade has multiple streams, the learner is created without a class placement and can be assigned later.
- Removed Default Class / Default Stream controls from the bulk workflow.
- CSV template includes one example learner and parent/guardian fields.
- Added /api/version marker: v81-dashboard-bulk-fix.
