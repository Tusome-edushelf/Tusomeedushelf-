# Tusome EduShelf — Fast Notes AI Fix

This update keeps the existing EduShelf structure, standalone Tusome AI page, and CBC Notes Generator.

## AI speed/reliability changes
- Notes generation uses Gemini 3.5 Flash-Lite by default for lower latency and high-volume use.
- Notes use low thinking effort to reduce time-to-answer while retaining detailed output instructions.
- Fallbacks include Gemini 3.6 Flash, Gemini 3.5 Flash-Lite and Gemini 3.5 Flash.
- Retry delay/retry count was reduced so a busy model does not leave the user waiting through a long chain of retries.
- Main Tusome AI can continue using GEMINI_MODEL (default Gemini 3.8 Flash).
- Optional Render environment variable: GEMINI_NOTES_MODEL can override the notes model.

## Deploy
Deploy these files together to the same Render service:
- index.html
- server.mjs
- tusome-ai.html

Then redeploy/restart the service.

If GEMINI_MODEL/GEMINI_FALLBACK_MODELS are set in Render, the application will respect those values. For fastest Notes Generator performance, leave GEMINI_NOTES_MODEL unset or set it to gemini-3.5-flash-lite.
