# TusomeEduShelf v126.44 — School Dashboard Visibility Fix

## Root cause addressed
- The school dashboard's admin workspace could remain hidden because its loader required the legacy `tusomeSchoolAccess` session flag even when the authenticated role was `school` or `admin`, despite the dashboard entry logic allowing those roles.
- The Classes/Streams and Subjects/Teacher Allocation shortcuts scrolled to elements inside a workspace initially styled `display:none`, so tapping them could appear to do nothing.

## Changes
- Unified the school-session check so `school` and `admin` roles can complete the dashboard load, while other roles still require the explicit school-access flag. Server-side API authorization remains in force.
- Added `openSchoolAdminSection()` to load/show the authorized workspace before navigating to existing class and academic forms.
- Updated Classes & Streams, Subjects & Teacher Allocation, School Management, and Create Class navigation to use that loader.
- Kept existing form IDs, API endpoints, database schema, records, exam workflow, bulk registration, report cards, General Results, parent reset feature, and term-to-term tracking unchanged.

## Verification
- JavaScript syntax checks and ZIP integrity checks are run on the generated package.
- No live Render database test or deployment was performed.
