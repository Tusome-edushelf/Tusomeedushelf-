# Tusome EduShelf — Daraja Sandbox Ready Package

This ZIP is prepared for Safaricom Daraja sandbox testing. Daraja 3.0 provides M-PESA APIs for web and mobile payment integrations and supports sandbox apps for testing.

## 1. Add your credentials locally

1. Install Node.js 18 or newer.
2. Open this project folder in a terminal.
3. Run:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env`.
5. Open `.env` and enter the credentials from your Daraja sandbox app:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_SHORTCODE`
   - `MPESA_PASSKEY`
6. Set `MPESA_CALLBACK_URL` to a **public HTTPS** address ending in `/api/payments/callback`.
7. Start the server:
   ```bash
   npm start
   ```
8. Open `http://localhost:3000`.

## 2. Important callback requirement

Safaricom must be able to reach the callback endpoint from the internet. A plain `http://localhost:3000/...` callback normally cannot receive the Daraja callback. For sandbox testing, use a public HTTPS test/deployment endpoint and set that exact URL in `.env`.

## 3. Never put secrets in the website

Keep `.env` server-side. Do not paste your Consumer Secret, Passkey, or M-PESA PIN into the HTML, GitHub, screenshots, or chat. `.gitignore` already excludes `.env` and transaction data.

## 4. Payment flow

Learner selects a paid material → enters an M-PESA number → Tusome EduShelf server requests an STK Push → learner completes the sandbox prompt → Safaricom sends the callback → server records the result → browser polls transaction status → material is unlocked after a successful result.

## 5. Sandbox vs production

This package is for **sandbox testing only**. It is not a production payment/settlement system. A production deployment should use a database, server-side material ownership/pricing, authenticated users, server-side purchase entitlements, audit logs, HTTPS, and the appropriate Safaricom business/onboarding configuration.

Official Daraja portal: https://developer.safaricom.co.ke/


## AI Assistant
The server exposes POST `/api/ai` and keeps `OPENAI_API_KEY (optional; not required for the local assistant)` server-side. Set `OPENAI_API_KEY (optional; not required for the local assistant)` in Render Environment Variables and optionally `OPENAI_MODEL`. Do not put the key in `index.html`, GitHub, or chat. The frontend calls `/api/ai`; it should no longer receive the site's HTML as the API response.

## Health check
Open `/api/health` to see whether Daraja and AI are configured. The response never returns secret values.


## Free/local AI
This version uses a built-in local educational assistant on your Render server. It does not call OpenAI and does not require API credits or an OPENAI_API_KEY. It provides deterministic explanations, examples, revision notes and practice prompts. It is not a full generative model.

## Enhanced Local Study Assistant

This version upgrades the built-in local Study Assistant to produce fuller learner-friendly responses with:
- Definition/main idea
- Key concepts and vocabulary
- Step-by-step method
- Worked examples
- Real-life applications
- Common mistakes to avoid
- Answer-checking guidance
- Quick summaries
- Mode-specific notes, practice, lesson, assessment, inquiry and remediation sections
- Built-in educational SVG diagrams for selected topics such as linear equations, linear functions, fractions, magnification, photosynthesis, atoms/molecules, Pythagorean relationship, speed/distance/time and circles

The diagrams are generated in the webpage, so no image API or OpenAI credits are required.

The assistant remains a built-in local study system rather than a cloud generative AI model. Topic-specific guides are used where available; for unsupported topics it provides a structured study framework instead of pretending to know an unverified curriculum-specific answer.

## CBE Notes Library and PDF workflow
- Learners have a **Notes Library** showing approved notes by subject and grade.
- Teachers can upload a PDF note; it is stored as **pending** until an administrator approves it.
- The system can generate original learner notes from the local study assistant and turn them into PDF files; generated notes also require administrator approval.
- Administrators can approve or reject notes and remove them.
- Approved notes can be free or have a KES price. Paid notes are unlocked after a confirmed payment in the prototype payment flow.
- PDF notes are designed as original supplementary learning material aligned to selected CBE/KICD curriculum focus. The system should not copy or redistribute KICD textbooks or other copyrighted books.
- The official KICD curriculum designs should be treated as the curriculum reference. See https://kicd.ac.ke/cbc-materials/curriculum-designs/ and the Grade 8 designs at https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-eight-designs/.
- The current prototype stores note metadata/files on the server filesystem. Render's free filesystem is not a permanent database/storage layer, so production deployment should later use persistent object storage and a database.
