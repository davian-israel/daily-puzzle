import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOWNS } from '../src/towns.js';
import { answerFor, puzzleNumber, checkGuess, distanceKm, compass, bearing, findTown, shareText, clueAfter } from '../src/game.js';

test('town list: unique areas, plausible UK coordinates', () => {
  assert.equal(new Set(TOWNS.map((t) => t.area)).size, TOWNS.length);
  for (const t of TOWNS) { assert.ok(t.lat > 49.8 && t.lat < 61, t.town); assert.ok(t.lon > -8.5 && t.lon < 2, t.town); }
});

test('no repeat answer within one full cycle', () => {
  const seen = new Set();
  for (let i = 0; i < TOWNS.length; i++) {
    const d = new Date(Date.parse('2026-11-01') + i * 864e5).toISOString().slice(0, 10);
    seen.add(answerFor(d).area);
  }
  assert.equal(seen.size, TOWNS.length);
});

test('puzzle numbering and pre-launch dates', () => {
  assert.equal(puzzleNumber('2026-11-01'), 1);
  assert.equal(puzzleNumber('2026-11-10'), 10);
  assert.equal(answerFor('2026-10-01'), null);
});

test('distance and direction are sensible', () => {
  const lon = findTown('Canterbury'), york = findTown('York');
  const km = distanceKm(lon, york);
  assert.ok(km > 300 && km < 360, String(km));
  assert.equal(compass(bearing(lon, york)), 'NW');
});

test('guess checking', () => {
  const d = '2026-11-05';
  const a = answerFor(d);
  assert.equal(checkGuess(d, a.town.toUpperCase()).correct, true);
  const other = TOWNS.find((t) => t.area !== a.area);
  const r = checkGuess(d, other.town);
  assert.equal(r.correct, false);
  assert.ok(r.km > 0 && r.dir);
  assert.equal(checkGuess(d, 'Atlantis').error, 'unknown-town');
});

test('clues and share text', () => {
  assert.equal(clueAfter('2026-11-05', 1), null);
  assert.match(clueAfter('2026-11-05', 2), /^It is in /);
  const s = shareText(3, [{ correct: false, proximity: 73, dir: 'NE' }, { correct: true, proximity: 100 }], true, 'https://x');
  assert.match(s, /^Sorted #3 2\/6/);
  assert.ok(s.includes('https://x'));
});
