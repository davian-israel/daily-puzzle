# Sorted — the daily UK postcode puzzle
Guess which town a postcode area (e.g. CT, YO) is named after in six tries; distance and direction after each guess.
Free daily puzzle; Sorted Plus £2.99/month unlocks the archive. Shared core in `src/core`.
Run `DATABASE_URL=... npm start` · `npm test` · `GET /api/metrics` (plays, solves, shares, paid).
Env: DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, EMAIL_FROM, APP_SECRET, METRICS_TOKEN, PRICE_GBP=2.99.
