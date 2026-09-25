# Tusome AI — Standalone Prototype

This is deliberately separate from Tusome EduShelf. It is a capability-testing lab before integration.

## What it tests
- General AI assistance
- Teaching/explanations
- Reasoning and calculations
- Coding
- Creative tasks
- Research-style answers and uncertainty handling
- Conversation history
- Gemini model fallback/retry behavior

## Run
1. Install Node.js 18+.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Put your Gemini API key in `GEMINI_API_KEY`.
5. Run `npm start`.
6. Open `http://localhost:3100`.

## Important
The prototype does not connect to the Tusome EduShelf database, dashboards, learner accounts, school records, or educational-material library. Those integrations come only after capability testing.
