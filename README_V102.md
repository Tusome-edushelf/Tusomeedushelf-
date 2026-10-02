# TusomeEduShelf v102 — Universal API Response Guard

This build keeps the existing school/class/stream, learner registration, credentials, DOB, reset, attendance, exams, assignments and fees behaviour.

## v102 fix
Added a universal browser-side `parseApiResponse()` guard and routed API JSON parsing through it. If an API request receives an HTML page (for example a Render fallback, 404 page, proxy page, or mismatched deployment), the app now shows a clear deployment/API message instead of:

`Unexpected token '<', "<!DOCTYPE ..." is not valid JSON`

The guard also reports malformed non-JSON API responses clearly.

## Deployment
Replace **both** `index.html` and `server.mjs` together. Do not change the database or reset learner data.

Application version: `v102-universal-api-response-guard`
