# Separate Tusome AI addition

This addition is designed to coexist with the existing EduShelf AI.

## Files
- `tusome-ai.html` — standalone Tusome AI interface.
- `server.mjs` — EduShelf `server.mjs` with an isolated `/api/tusome-ai/chat` endpoint and `/tusome-ai` page route added. Existing `/api/ai` and `/api/home-ai` routes are preserved.

## Render environment
The new endpoint uses the existing `GEMINI_API_KEY` Render environment variable. Optional variables:
- `TUSOME_AI_MODEL` (default: `gemini-3.8-flash`)
- `TUSOME_AI_FALLBACK_MODELS` (default: `gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash`)
- `TUSOME_AI_TIMEOUT_MS` (default: `45000`)
- `TUSOME_AI_RATE_LIMIT` (default: `20` requests per 5 minutes per client IP)

## URL
After deployment, the new page is available at:
`/tusome-ai`

## Thinking modes
- Fast = low
- Balanced = medium
- Deep = high

These are sent to Gemini 3 through `generationConfig.thinkingConfig.thinkingLevel`.
