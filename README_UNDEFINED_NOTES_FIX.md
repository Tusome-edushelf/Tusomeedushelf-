# Tusome EduShelf — Notes Generator `undefined` + speed fix

## Fixes
- Fixed the Notes Generator frontend bug that displayed `undefined` after a successful AI response. `renderAIResponse()` now receives the answer box as its target instead of assigning its `undefined` return value to `innerHTML`.
- Notes generation uses a dedicated low-latency Gemini model by default (`GEMINI_NOTES_MODEL`, default `gemini-3.5-flash-lite`).
- Notes/summary/practice requests use low thinking effort.
- Retry/fallback timing is reduced so a busy model fails over faster.

## Deploy
Deploy these together and restart the Render service:
- `index.html`
- `server.mjs`
- `tusome-ai.html`

Existing Tusome AI, school dashboards, PostgreSQL, M-PESA/Daraja, authentication and other platform features are preserved.
