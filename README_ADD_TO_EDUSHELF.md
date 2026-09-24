# Tusome AI — Multi-File Handling Update

Replace the current `tusome-ai.html` and `server.mjs` in the EduShelf GitHub repository with the files in this folder.

## Added
- Multiple file selection in one message (up to 5 files).
- Combined upload limit of 20 MB per message; individual file limit remains 10 MB.
- Visible attachment chips with remove controls before sending.
- Uploaded files are shown with the user message in chat history.
- Previous conversation attachments are kept in browser IndexedDB and can be reused from the conversation history when available.
- Clearing/deleting a chat removes its stored attachment data.
- Server accepts the new `files` array while remaining compatible with the previous single `file` field.
- Existing Fast / Balanced / Deep modes and math rendering remain intact.
