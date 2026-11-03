# Sorted — the daily UK postcode puzzle
Guess which town a postcode area (e.g. CT, YO) is named after in six tries; distance and direction after each guess.
Free daily puzzle; Sorted Plus £2.99/month unlocks the archive. Shared core in `src/core`.
Run `DATABASE_URL=... npm start` · `npm test` · `GET /api/metrics` (plays, solves, shares, paid).
Env: DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, EMAIL_FROM, APP_SECRET, METRICS_TOKEN, PRICE_GBP=2.99.

## Connect Stripe
1. In Railway → this project → web → Variables, add `STRIPE_SECRET_KEY` (start with `sk_test_…`).
2. From this repo folder: `railway link` (pick this project), then `railway run npm run stripe:setup`.
   It checks the key, creates the webhook at `<site>/webhooks/stripe` for
   `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`,
   and prints `STRIPE_WEBHOOK_SECRET=whsec_…` — add that variable too. Railway redeploys.
3. Stripe dashboard → Settings → Billing → Customer portal → Activate (once per Stripe account).
4. Test with card 4242 4242 4242 4242, then swap both keys for live ones and run step 2 again.
