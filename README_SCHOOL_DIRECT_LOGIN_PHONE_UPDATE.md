# Tusome EduShelf — School Direct Login + Phone Update

## School Dashboard flow
- One School Dashboard login form accepts **school email OR Kenyan phone number + password**.
- No school-name field, account-type selector, or manual Verify button is shown.
- The server authenticates the account, checks active school membership automatically, detects the school role, and routes the user directly to the authorised workspace.
- Roles supported by the school routing flow: Administrator, Finance/Bursar, Teacher, Learner, Parent/Guardian.
- Finance/Bursar remains displayed beside School Administrator as a quick-entry button, but both use the same automatic login flow.

## Demo school
- School administrator: `school@edushelf.com` / `school123`
- Demo admin phone: `0711000001`
- Teacher: `teacher@edushelf.com` / `teacher123` / `0711000002`
- Learner: `learner@edushelf.com` / `learner123` / `0711000003`
- Bursar: `bursar@edushelf.com` / `bursar123` / `0711000004`
- Demo school subscription is active at KES 0 for testing and does not require payment.

## Deployment
Replace the current Render `index.html`, `server.mjs`, and `tusome-ai.html` with the versions in this package and redeploy.

## Important
Phone numbers are stored in normalized Kenyan format for login matching. The school login route uses the authenticated account's active school membership; it does not trust a role or school supplied by the browser.
