# Tusome EduShelf v34 — Learner Discussions

Adds a learner discussion centre with:
- Text discussion posts filtered by grade and learning area.
- Topic field for focused study conversations.
- Teacher/learner role labels and basic moderation controls on the server.
- Report/safety guidance reminding learners not to share private information.
- Live voice study rooms using browser microphone permission.
- Live video study rooms using browser camera + microphone permission.
- Room-code based WebRTC signalling through the existing PostgreSQL database.
- Leave-room controls and connection status feedback.
- Existing v33 CBE quiz, answer upload/AI marking, notes, highlights, reader, dashboards, AI, payments and B2C preserved.

Safety note: live rooms are intended for learning discussions. Learners should follow their school/teacher rules and should not share passwords, M-PESA PINs, home addresses, phone numbers or private images.

Deployment: upload the ZIP to Render and deploy. PostgreSQL is required for persistent text discussions and live-room signalling.
