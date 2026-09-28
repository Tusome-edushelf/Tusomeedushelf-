# Tusome EduShelf — School Role Entry Build

## School Plan entry flow
When an authorised user opens the School Plan Dashboard, the first screen is a simple **Choose your School Workspace** selector.

Roles:
- School Admin → full school management and control centre
- Teacher → teacher dashboard and teaching tools
- Learner → learner dashboard and learning tools
- Parent / Guardian → linked learner information
- Bursar / Finance → Finance & Fees only

The selector is role-aware. A user can see the available role choices, but cannot open a workspace unless their authenticated school membership or account role authorises it.

## Finance isolation
Bursar access opens the existing Finance & Fees area directly. Bursars are also authorised by the server for school fee viewing, fee charges and payment recording. Other school-management functions remain restricted.

## School invitations
School administrators can now assign `teacher`, `learner`, `parent`, or `bursar` membership roles when inviting school members.

## Existing structure preserved
The build keeps the existing Tusome EduShelf School Plan, PostgreSQL school membership system, M-PESA/Daraja integration, parent links, attendance, exams, timetable, fees, learning tools and separate Tusome AI.
