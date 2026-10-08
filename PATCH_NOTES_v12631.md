# TusomeEduShelf v126.31 — Reference-Style A4 Report Card Layout

## Purpose
Refines the individual and bulk learner report-card PDF so each learner receives a balanced A4 portrait report card closely matching the user's supplied reference design.

## Layout
- A4 portrait: 595 x 842 points.
- One complete report-card page per learner.
- School name and official academic report header.
- `POWERED BY TUSOMEEDUSHELF` at the top-right.
- Learner identity block with learner name, admission number, class/stream, KCPE/KPSEA entry score, exam session, gender/date.
- Overall performance banner with total marks, mean score, CBE level, stream rank, overall rank and deviation/trend.
- Strong bordered subject-performance table with subject, score, percentage, CBE level, class mean, target and teacher remark.
- Subject-vs-class-average bar chart.
- Longitudinal performance trend chart.
- Automatic class-teacher and principal remarks.
- Target tracking and next-term information.
- CBE legend: EE1/EE2, ME1/ME2, AE1/AE2, BE1/BE2.
- Published-result footer.

## Pagination
- The report card builder now lays out all sections dynamically from the subject-table height.
- Short subject lists no longer leave the report card compressed at the top with a large unused lower half.
- Larger subject lists automatically reduce table row height while remaining on one A4 page where the available layout permits.
- Bulk stream downloads continue to create one A4 page per learner.

## Safety
- No database schema changes.
- No destructive SQL.
- Existing exam workflow, Pre-Publish PDF, General Results and report-card access controls are retained.
