Tusome EduShelf — Notes Generator Fix

Changes in this package:
- Fixed the Generated Notes rendering path so it cannot display JavaScript undefined when Gemini returns a normal answer.
- Added fenced-code/ASCII diagram rendering in a readable monospaced box.
- Notes prompt now explicitly requests clear labelled diagrams where appropriate and continuous solid lines instead of dotted/dashed connector lines.
- Added the full grade selector from Pre-Primary 1 through Grade 12. The exact KICD strand/sub-strand registry is still only populated where verified in the current local registry; do not treat unpopulated grades as having a complete imported hierarchy yet.
- Notes AI uses a lower-latency dedicated model by default (GEMINI_NOTES_MODEL or gemini-3.5-flash-lite), low thinking for notes, shorter retries, and faster fallbacks.
- Existing Tusome AI page, dashboards, authentication, PostgreSQL, M-PESA and other platform structure are preserved.

Deploy together:
- index.html
- server.mjs
- tusome-ai.html

Then restart/redeploy the Render service.
