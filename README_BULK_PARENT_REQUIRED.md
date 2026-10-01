# Tusome EduShelf v80 — Bulk Learner Registration

This build updates bulk learner registration so that:

- Full Name is required in every CSV row.
- Admission Number is required in every CSV row.
- Class/Grade is required in every CSV row.
- Parent/Guardian Name is required in every CSV row.
- Parent/Guardian Phone is required in every CSV row.
- Stream is optional and may be assigned later.
- Gender, DOB, learner phone and learner email remain optional.
- The default-class/default-stream controls have been removed.
- The CSV template includes an example row.
- The server validates class/grade against classes configured for the school.
- If multiple stream variants match a class/grade and Stream is blank, the learner is registered without a class_id so the school can assign the stream later.
- The credential report includes parent/guardian name and phone.
- Bulk registration remains limited to 500 learners and uses a transaction.

Deploy the files in this ZIP to the Render service root.
