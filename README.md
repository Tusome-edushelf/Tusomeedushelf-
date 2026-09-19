# Tusome EduShelf — Role-Specific AI Assistant

This build keeps the existing dashboard structure and makes the AI Assistant respect the dashboard role.

## Teacher AI
- Lesson-plan generation
- Scheme-of-work support
- Assessment creation
- Rubric generation
- Differentiated activities
- Remedial activities
- Enrichment activities
- AI material quality checking before submission

## Admin AI
- Platform activity summaries
- Material moderation assistance
- Duplicate-material detection
- Upload/user/payment reports
- Materials waiting for approval
- Admin AI does not make final approval/rejection decisions

## Parent / Guardian AI
- Learner progress summaries
- Suggested revision activities
- Explanation of performance reports
- Study-support suggestions

## Verification reminder
Curriculum-related AI output is advisory. Teachers or administrators must verify curriculum-related content against the relevant official curriculum/materials before publishing or using it.

## Notes
- Existing learner payment, material, PostgreSQL, revenue and dashboard features are preserved.
- The AI quality checker currently accepts PDF and supported image uploads for content inspection. DOC/DOCX/PPT/PPTX can still be submitted normally for admin review.
- Admin AI uses an authenticated server-side context endpoint and avoids sending unnecessary learner payment/contact details to the AI.
- Server and browser JavaScript were syntax checked with `node --check`.
