// Game rules: deterministic daily answer, distance/direction feedback, share grid. Unit-tested.
import { TOWNS } from './towns.js';

export const MAX_GUESSES = 6;
export const EPOCH = '2026-11-01'; // puzzle #1
const DAY = 864e5;

export const todayUk = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

export const puzzleNumber = (date) => Math.floor((Date.parse(date) - Date.parse(EPOCH)) / DAY) + 1;

// Seeded shuffle (mulberry32) so every cycle through the towns has no repeats and the order isn't alphabetical.
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function order(cycle) {
  const r = rng(0xC0FFEE + cycle * 7919 + Number(process.env.PUZZLE_SALT || 0));
  const idx = TOWNS.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

export function answerFor(date) {
  const n = puzzleNumber(date);
  if (n < 1) return null;
  const cycle = Math.floor((n - 1) / TOWNS.length);
  return TOWNS[order(cycle).at((n - 1) % TOWNS.length)];
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
export const findTown = (name) => TOWNS.find((t) => norm(t.town) === norm(name)) || null;

const rad = (d) => (d * Math.PI) / 180;
export function distanceKm(a, b) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}
export function bearing(a, b) {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const compass = (deg) => COMPASS.at(Math.round(deg / 45) % 8);
const ARROWS = { N: '⬆️', NE: '↗️', E: '➡️', SE: '↘️', S: '⬇️', SW: '↙️', W: '⬅️', NW: '↖️' };

// Longest distance in the set (Lerwick to Truro is roughly 1,100 km) sets the proximity scale.
export const MAX_KM = 1100;
export const proximity = (km) => Math.max(0, Math.round(100 * (1 - km / MAX_KM)));

/** Server-side guess check: the answer never reaches the browser until the game ends. */
export function checkGuess(date, guessName) {
  const answer = answerFor(date);
  const guess = findTown(guessName);
  if (!answer || !guess) return { error: 'unknown-town' };
  if (guess.area === answer.area) return { correct: true, town: guess.town, km: 0, dir: null, proximity: 100 };
  const km = distanceKm(guess, answer);
  return { correct: false, town: guess.town, km, dir: compass(bearing(guess, answer)), proximity: proximity(km) };
}

/** Clue revealed after N wrong guesses. */
export function clueAfter(date, wrong) {
  const a = answerFor(date);
  if (wrong >= 4) return `Starts with “${a.town[0]}” and is in ${a.nation}.`;
  if (wrong >= 2) return `It is in ${a.nation}.`;
  return null;
}

export function shareText(n, results, solved, url) {
  const row = (r) => (r.correct ? '🟩🟩🟩🟩🟩 📮' : `${'🟩'.repeat(Math.floor(r.proximity / 20))}${r.proximity % 20 >= 10 ? '🟨' : ''}`.padEnd(10, '⬜').slice(0, 10) + ` ${ARROWS[r.dir] || ''}`);
  return `Sorted #${n} ${solved ? results.length : 'X'}/${MAX_GUESSES}\n${results.map(row).join('\n')}\n${url}`;
}
