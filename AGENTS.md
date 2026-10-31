# Agent runbook — Sorted (daily-puzzle)

The answer for each date is deterministic (`src/game.js`), so there is no daily content job. Guesses are checked server-side.
## Daily (00:10 UK)
- Load `/` and confirm today's puzzle number advanced. Report plays, solved, failed and share counts from `/api/metrics`.
## Weekly
- Share rate = share_7d ÷ play_7d. Target > 15% by day 14. Below that, propose a variant (e.g. county towns, football grounds) to Davian rather than adding features.
- Fix any town coordinates players report as wrong (`src/towns.js`); never change past answers' order (PUZZLE_SALT is fixed once live).
## Plus
- Plus unlocks `/archive` via a signed cookie set after checkout, or the `/unlock/<token>` link in the welcome email.
## Hard limits
No ads until 1,000 daily players and Davian's approval. No spending, no cold outreach, no pricing/legal changes.
