# Tusome EduShelf v42 — Parent / Guardian Portal

v42 adds a school-controlled Parent/Guardian portal on top of v41.

## Parent features
- Parent/Guardian login role
- Read-only linked learner dashboard
- School and class information
- Subject-level academic progress and averages
- Assignment status and approved marks/feedback visibility
- Multiple linked learners supported
- Parent AI study-support entry point

## School admin features
- Link an existing Parent/Guardian account to an active learner
- View current parent/learner links
- Remove a parent/learner link
- Parent access is limited to explicitly linked learners

## Privacy
- Parent APIs verify the authenticated parent owns the link before returning learner data.
- Parents cannot edit grades, assignments, submissions, school membership, or other school records.
- Parent accounts are not available through the public learner/teacher sign-up flow; they should be provisioned by the school/platform process.
- The portal avoids exposing unrelated school operational data.

## Preserved
v41 Gradebook, v40 Assignments/Submissions/Grading, v39 Academic Management, v38 School Management, memberships, marketplace, M-PESA, discussions, large video and screen sharing remain included.

## Production note
Use verified parent/guardian identity and appropriate school authorization before linking an adult to a learner. Keep child data access limited to what is necessary for education and school administration.
