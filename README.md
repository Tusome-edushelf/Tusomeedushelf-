# Tusome EduShelf – Enhanced Local AI + CBE Paid Notes

## Notes marketplace rules
- Every published learner note is **paid**; there are no free published notes.
- The **administrator alone sets the selling price** (minimum KES 1) before approval.
- Learners must complete the configured M-PESA payment before the PDF download is unlocked.
- All note-payment revenue is recorded for the **Tusome EduShelf system account**. Teacher earnings are not calculated or displayed.
- Teacher uploads are submitted for administrator review; teachers do not set the selling price.
- **Only an administrator can generate system notes.** The server rejects note-generation requests without the administrator role header.
- Only an administrator can set a price, approve, reject or delete a note.
- System-generated notes are original supplementary learning material and should be checked against the current official KICD curriculum design. Do not copy KICD textbooks or other copyrighted material.

## Prototype administrator
Email: `admin@edushelf.com`
Password: `admin123`

## Deploy
1. `npm install`
2. Configure Render environment variables from `.env.example`.
3. Set `MPESA_CALLBACK_URL` to the public HTTPS Render URL ending in `/api/payments/callback`.
4. Start with `npm start`.

> The role checks in this prototype use a client-provided role header and are not a substitute for production authentication. Before launch, replace the prototype login with server-side authenticated sessions/roles and persistent database storage.


## Question Paper Solver
The uploaded-paper button uses a dedicated `paper` mode. It returns direct answers only, preserves question/sub-question numbering, shows only necessary calculation working, and reports unreadable questions instead of falling back to study-guide templates.
