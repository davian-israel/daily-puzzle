import express from 'express';
import { mountWebhook, mountCore, mountErrors, sendHtml, wrap } from './core/core-routes.js';
import { startCheckout } from './core/billing.js';
import { track } from './core/db.js';
import { signId, verifyToken } from './core/tokens.js';
import { answerFor, puzzleNumber, todayUk, checkGuess, clueAfter, shareText, MAX_GUESSES, EPOCH } from './game.js';
import * as views from './views.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const FONTS = {
  'op-400.woff2': '@fontsource/overpass/files/overpass-latin-400-normal.woff2',
  'op-700.woff2': '@fontsource/overpass/files/overpass-latin-700-normal.woff2',
  'op-900.woff2': '@fontsource/overpass/files/overpass-latin-900-normal.woff2',
};
const cookie = (req, name) => (req.headers.cookie || '').split(/;\s*/).map((c) => c.split('=')).find(([k]) => k === name)?.[1];

export function createApp({ pool, stripe, baseUrl, now = () => new Date(), onPaid }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  mountWebhook(app, { pool, stripe, onEvent: async (_ev, id) => { if (id && onPaid) await onPaid(id); } });
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));
  app.use(express.json({ limit: '10kb' }));
  mountCore(app, { pool, stripe, venture: 'daily-puzzle', priceGbp: views.PRICE_GBP, fonts: FONTS, views,
    funnel: ['play', 'solved', 'failed', 'share'], describe: () => 'Sorted Plus' });

  const today = () => todayUk(now());
  // A launch-day guard: before EPOCH, serve puzzle #1 so the site works ahead of launch.
  const current = () => (today() < EPOCH ? EPOCH : today());

  async function isPlus(req) {
    const id = verifyToken(decodeURIComponent(cookie(req, 'plus') || ''));
    if (!id) return false;
    const { rows } = await pool.query(`SELECT 1 FROM subscribers WHERE id = $1 AND status IN ('active','trialing')`, [id]);
    return rows.length > 0;
  }
  const isPlayable = (date) => DATE_RE.test(date) && date >= EPOCH && date <= current();

  app.get('/', (_req, res) => {
    const date = current();
    sendHtml(res, views.gamePage({ n: puzzleNumber(date), date, area: answerFor(date).area, baseUrl, isToday: true }));
  });

  app.get('/play/:date', wrap(async (req, res) => {
    const { date } = req.params;
    if (!isPlayable(date)) return sendHtml(res, views.messagePage('No puzzle for that day', '<p>Puzzles start on 1 November 2026, and future puzzles stay locked.</p>'), 404);
    if (date === current()) return res.redirect('/');
    if (!(await isPlus(req))) return res.redirect('/archive');
    sendHtml(res, views.gamePage({ n: puzzleNumber(date), date, area: answerFor(date).area, baseUrl, isToday: false }));
  }));

  app.get('/archive', wrap(async (req, res) => {
    const items = [];
    for (let d = new Date(Date.parse(current()) - 864e5); d >= new Date(EPOCH); d = new Date(d - 864e5)) {
      const date = d.toISOString().slice(0, 10);
      items.push({ date, n: puzzleNumber(date) });
    }
    sendHtml(res, views.archivePage({ items, unlocked: await isPlus(req), stripeReady: Boolean(stripe) }));
  }));

  app.post('/api/guess', wrap(async (req, res) => {
    const { date, guess, count } = req.body || {};
    if (!isPlayable(String(date))) return res.status(400).json({ error: 'bad-date' });
    if (date !== current() && !(await isPlus(req))) return res.status(403).json({ error: 'plus-only' });
    const r = checkGuess(date, guess);
    if (r.error) return res.status(400).json(r);
    const n = Math.min(Math.max(Number(count) || 1, 1), MAX_GUESSES);
    if (n === 1) await track(pool, 'play', date);
    if (r.correct) await track(pool, 'solved', `${date}:${n}`);
    else if (n >= MAX_GUESSES) { r.answer = answerFor(date).town; await track(pool, 'failed', date); }
    if (!r.correct) r.clue = clueAfter(date, n);
    res.json(r);
  }));

  app.post('/api/share', wrap(async (req, res) => {
    const date = String(req.query.date || '');
    const results = Array.isArray(req.body?.results) ? req.body.results.slice(0, MAX_GUESSES) : [];
    await track(pool, 'share', date);
    res.json({ text: shareText(puzzleNumber(date), results, Boolean(req.body?.solved), baseUrl) });
  }));

  app.get('/plus', (_req, res) => sendHtml(res, views.plusPage({ stripeReady: Boolean(stripe) })));

  app.post('/subscribe', wrap(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return sendHtml(res, views.messagePage('Check your email address', '<p>Enter a valid email address.</p>', { action: '<a class="btn" href="/plus">Back</a>' }), 400);
    const { url } = await startCheckout({ pool, stripe, baseUrl }, { email, ref: 'plus', productName: 'Sorted Plus', priceGbp: views.PRICE_GBP, cancelPath: '/plus' });
    res.redirect(303, url);
  }));

  // After Stripe checkout, unlock Plus on this device with a signed cookie.
  app.get('/thanks', wrap(async (req, res) => {
    if (req.query.pending) return sendHtml(res, views.messagePage('You are on the list', '<p>Plus opens soon, so you have not been charged. We will email you when it starts.</p>'));
    if (stripe && req.query.session_id) {
      const s = await stripe.checkout.sessions.retrieve(String(req.query.session_id));
      const id = Number(s.client_reference_id);
      if (id && ['complete'].includes(s.status)) {
        res.setHeader('Set-Cookie', `plus=${encodeURIComponent(signId(id))}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`);
      }
    }
    sendHtml(res, views.messagePage('Welcome to Sorted Plus', '<p>The archive is open on this device. Use the link in your welcome email to open it on another.</p>', { action: '<a class="btn" href="/archive">Open the archive</a>' }));
  }));

  // Magic link from emails: /unlock/<token> sets the Plus cookie on another device.
  app.get('/unlock/:token', (req, res) => {
    if (!verifyToken(req.params.token)) return res.redirect('/plus');
    res.setHeader('Set-Cookie', `plus=${encodeURIComponent(req.params.token)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`);
    res.redirect('/archive');
  });

  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /manage/\nDisallow: /api/\nDisallow: /unlock/\n`));
  app.get('/privacy', (_req, res) => sendHtml(res, views.messagePage('Privacy', '<p>Your game progress stays in your browser. If you join Plus we store your email to manage your subscription. Payments are handled by Stripe.</p>')));
  app.get('/terms', (_req, res) => sendHtml(res, views.messagePage('Terms', '<p>The daily puzzle is free. Sorted Plus is a monthly subscription you can cancel at any time from any email we send.</p>')));

  mountErrors(app, views);
  return app;
}
