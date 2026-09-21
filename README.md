# Tusome EduShelf v45 — Communication & Notifications Hub

Built on v44 (Exams, Report Cards & Academic Reports).

## Communication features
- School announcements stored in PostgreSQL.
- Target announcements to the whole school, a specific class, or a role (learner, teacher, parent/guardian).
- School administrators can publish school-wide announcements.
- Teachers can publish to assigned classes or teacher audiences.
- In-app notifications are created for announcement recipients.
- Parent accounts can see announcements for schools where their linked learners are enrolled.
- Authorized in-school direct messages between school members and linked guardians.
- Inbox with unread state and mark-as-read.
- Existing feedback/complaint/suggestion centre preserved.
- Communication Hub is behind login and school access controls; it is not a public home-screen feature.
- Existing marketplace, premium memberships, M-PESA, school management, academics, assignments, gradebook, parent portal, attendance, calendar, exams, discussions, large video and screen sharing remain preserved.

## Safety
- Do not share passwords, M-PESA PINs, private photos, home addresses, or other sensitive information in school messages.
- Role and school membership checks are enforced server-side.
- Teachers cannot publish school-wide announcements unless they have school-admin access.
- Parent access is limited to linked school/learner relationships.

## Important production note
The communication hub currently provides in-app messaging and notification delivery. SMS, email, WhatsApp or other external delivery channels are not enabled by this build. Those channels should be connected later only with the appropriate authorized school/provider accounts and privacy controls.
