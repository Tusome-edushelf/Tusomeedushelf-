# Tusome EduShelf — School Login Flow Update

## School Dashboard access

- School administrators sign in through the School Dashboard using their school administrator email and password.
- A successful administrator sign-in is checked against an active `school_memberships` record with `member_role='admin'` and opens the administration dashboard directly.
- Teachers, learners, parents/guardians and bursars use the School Member Access form.
- They enter the registered school name, their Tusome account email and account type.
- The server requires the entered email to match the currently signed-in account, then checks the school name, membership, active status and selected role.
- If the account is not linked, access is denied with a message instructing the user to contact the school administrator.
- Successful verification routes automatically to the existing role workspace: Teacher, Learner, Parent/Guardian or Bursar/Finance.

Existing School Plan, M-PESA/Daraja, PostgreSQL, school memberships, School Control Centre and Tusome AI structure are preserved.
