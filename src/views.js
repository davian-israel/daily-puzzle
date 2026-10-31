import { esc } from './core/core-routes.js';
import { TOWNS } from './towns.js';
import { MAX_GUESSES } from './game.js';

export const PRICE_GBP = Number(process.env.PRICE_GBP || 2.99);
const price = `£${PRICE_GBP.toFixed(2)}`;

// Road-sign identity: motorway blue, number-plate yellow tiles, Overpass throughout.
const CSS = `
@font-face{font-family:'Overpass';src:url(/fonts/op-400.woff2) format('woff2');font-weight:400;font-display:swap}
@font-face{font-family:'Overpass';src:url(/fonts/op-700.woff2) format('woff2');font-weight:700;font-display:swap}
@font-face{font-family:'Overpass';src:url(/fonts/op-900.woff2) format('woff2');font-weight:900;font-display:swap}
:root{--blue:#1D4F91;--blue-2:#163E73;--plate:#F7D117;--ink:#111A24;--ink-2:#55606E;--paper:#F5F7FA;--line:#D8DEE6;--near:#1F8A4C;--mid:#D99A1E;--far:#9AA5B4;--focus:#F7D117}
*{box-sizing:border-box}
html{background:var(--paper);color:var(--ink);font:400 18px/1.5 'Overpass',system-ui,sans-serif}
body{margin:0}a{color:inherit;text-underline-offset:3px}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px;border-radius:6px}
.sign{background:var(--blue);color:#fff;border-bottom:6px solid var(--blue-2)}
.wrap{max-width:720px;margin:0 auto;padding:0 20px}
.top{display:flex;justify-content:space-between;align-items:center;padding-block:18px}
.brand{font:900 28px/1 'Overpass',sans-serif;text-decoration:none;letter-spacing:-.01em}
.top nav a{margin-left:18px;font-size:16px;color:#DCE6F4}
.board{padding-block:18px 34px;text-align:center}
.num{font-size:16px;color:#DCE6F4}
.plates{display:flex;justify-content:center;gap:12px;margin:18px 0 18px}
.plate{background:var(--plate);color:var(--ink);font:900 clamp(84px,20vw,132px)/1 'Overpass',sans-serif;width:clamp(96px,24vw,150px);
  padding:22px 0 10px;border-radius:12px;box-shadow:inset 0 0 0 4px var(--ink),0 6px 0 var(--blue-2)}
.ask{font-size:21px;font-weight:700;margin:6px 0 0}
.play{padding-block:28px 8px}
form.guess{display:flex;gap:10px}
form.guess input{flex:1;min-width:0;font:inherit;font-size:19px;padding:15px 16px;border:2px solid var(--ink);border-radius:10px;background:#fff}
.btn{font:700 18px/1 'Overpass',sans-serif;padding:16px 22px;border:0;border-radius:10px;background:var(--ink);color:#fff;cursor:pointer;text-decoration:none;display:inline-block}
.btn.yellow{background:var(--plate);color:var(--ink)}
.btn:disabled{opacity:.4;cursor:default}
.rows{list-style:none;padding:0;margin:20px 0}
.row{display:grid;grid-template-columns:minmax(0,1fr) 84px 44px;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:8px}
.row .t{font-weight:700}.row .km{text-align:right;font-variant-numeric:tabular-nums}.row .dir{font-size:24px;text-align:center}
.bar{grid-column:1/-1;height:8px;border-radius:4px;background:var(--line);overflow:hidden}.bar i{display:block;height:100%}
.row.empty{color:var(--ink-2);border-style:dashed;background:transparent}
.row.win{border:2px solid var(--near)}
.clue{background:#fff;border-left:5px solid var(--plate);padding:12px 16px;border-radius:0 10px 10px 0;margin:10px 0;display:none}
.result{display:none;text-align:center;padding:22px;background:#fff;border:2px solid var(--ink);border-radius:14px;margin:18px 0}
.result h2{margin:0 0 6px;font:900 34px/1.1 'Overpass',sans-serif}
.result p{color:var(--ink-2);margin:6px 0 16px}
.stats{display:flex;justify-content:center;gap:28px;margin:10px 0 18px}
.stats b{display:block;font:900 30px/1 'Overpass',sans-serif}.stats span{font-size:14px;color:var(--ink-2)}
.section{padding:40px 0;border-top:1px solid var(--line)}
.section h2{font:900 30px/1.1 'Overpass',sans-serif;margin:0 0 12px}
.section p,.section li{color:var(--ink-2)}
.plus{background:var(--blue);color:#fff;border-radius:16px;padding:26px;margin-top:12px}
.plus p,.plus li{color:#DCE6F4}.plus .amount{font:900 52px/1 'Overpass',sans-serif}.plus .amount small{font:400 18px 'Overpass',sans-serif;color:#DCE6F4}
.plus form{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.plus input{flex:1;min-width:200px;font:inherit;padding:14px;border-radius:10px;border:0}
.archive{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.archive a{display:block;background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px;text-decoration:none;text-align:center}
.archive b{display:block;font:900 22px 'Overpass',sans-serif}
.msg{padding-block:48px 80px}.msg .body{color:var(--ink-2);margin:16px 0 24px}
footer{border-top:1px solid var(--line);padding:22px 0 40px;font-size:15px;color:var(--ink-2)}footer a{margin-right:16px}
.sr{position:absolute;left:-9999px}
`;

function layout({ title, description, head = '', body, canonical }) {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
<style>${CSS}</style>${head}</head><body>${body}
<footer><div class="wrap"><p>Sorted is an independent puzzle. Not affiliated with Royal Mail.</p><a href="/plus">Sorted Plus</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></footer></body></html>`;
}

const header = (extra = '') => `<header class="wrap top"><a class="brand" href="/">Sorted</a><nav><a href="/archive">Archive</a><a href="/plus">Plus</a></nav></header>${extra}`;

export function gamePage({ n, date, area, baseUrl, isToday }) {
  const tiles = [...area].map((c) => `<span class="plate" aria-hidden="true">${esc(c)}</span>`).join('');
  const nice = new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return layout({
    title: isToday ? `Sorted #${n}: the daily postcode puzzle` : `Sorted #${n} from the archive`,
    description: 'Guess which UK town a postcode area is named after, in six tries. A new puzzle every day.',
    canonical: isToday ? `${baseUrl}/` : null,
    body: `<div class="sign">${header()}<section class="wrap board"><div class="num">Puzzle ${n}, ${esc(nice)}</div>
<div class="plates" role="img" aria-label="Postcode area ${esc(area.split('').join(' '))}">${tiles}</div>
<p class="ask">Which town is this postcode area named after?</p></section></div>
<main class="wrap play" id="game" data-date="${esc(date)}" data-n="${n}" data-max="${MAX_GUESSES}" data-url="${esc(baseUrl)}">
<form class="guess" autocomplete="off"><label class="sr" for="g">Your guess</label>
<input id="g" name="g" list="towns" placeholder="Type a town, e.g. Leeds" required><button class="btn">Guess</button></form>
<datalist id="towns">${TOWNS.map((t) => `<option value="${esc(t.town)}">`).join('')}</datalist>
<div class="clue" id="clue"></div>
<ol class="rows" id="rows">${Array.from({ length: MAX_GUESSES }, (_, i) => `<li class="row empty"><span class="t">Guess ${i + 1}</span></li>`).join('')}</ol>
<div class="result" id="result" aria-live="polite"><h2 id="rh"></h2><p id="rp"></p>
<div class="stats"><div><b id="st-streak">0</b><span>day streak</span></div><div><b id="st-played">0</b><span>played</span></div><div><b id="st-won">0%</b><span>solved</span></div></div>
<button class="btn yellow" id="share" type="button">Copy my result</button></div>
<section class="section"><h2>How to play</h2><ul><li>The tiles show a UK postcode area, like CT or YO.</li><li>Guess the town it is named after. You have ${MAX_GUESSES} tries.</li>
<li>Each wrong guess shows how far away the answer is and which way to head.</li><li>After two misses you get the nation; after four, the first letter.</li></ul></section>
<section class="section">${plusBlock()}</section></main>
<script>${CLIENT}</script>`,
  });
}

export function plusBlock(stripeReady) {
  return `<div class="plus"><h2>Sorted Plus</h2><div class="amount">${price}<small> a month</small></div>
<ul><li>Every past puzzle in the archive</li><li>Streak freeze: miss a day without losing your streak</li><li>No adverts, ever</li></ul>
<form method="post" action="/subscribe"><label class="sr" for="pe">Email</label><input id="pe" type="email" name="email" placeholder="you@example.com" required autocomplete="email">
<button class="btn yellow">Get Plus for ${price} a month</button></form>
${stripeReady === false ? '<p style="font-size:15px">Payments open soon. Sign up now and you will not be charged yet.</p>' : ''}</div>`;
}

export function plusPage({ stripeReady }) {
  return layout({ title: `Sorted Plus: every past puzzle for ${price} a month`, description: 'Unlock the Sorted archive and streak freezes.',
    body: `<div class="sign">${header()}</div><main class="wrap msg"><h2 style="font:900 40px/1.05 Overpass,sans-serif;margin:0">Play every puzzle you missed.</h2>
<p class="body">The daily puzzle is free for everyone. Plus opens the full archive and protects your streak.</p>${plusBlock(stripeReady)}</main>` });
}

export function archivePage({ items, unlocked, stripeReady }) {
  const list = items.map((it) => `<li><a href="/play/${esc(it.date)}"><b>#${it.n}</b>${esc(new Date(it.date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }))}</a></li>`).join('');
  return layout({ title: 'Sorted archive', description: 'Every past Sorted puzzle.',
    body: `<div class="sign">${header()}</div><main class="wrap msg"><h2 style="font:900 40px/1.05 Overpass,sans-serif;margin:0">The archive</h2>
${unlocked ? `<p class="body">Pick any past puzzle.</p><ul class="archive">${list || '<li>The first puzzle is today. Come back tomorrow for the archive.</li>'}</ul>`
    : `<p class="body">${items.length ? `${items.length} past puzzle${items.length === 1 ? '' : 's'} so far.` : 'The archive starts tomorrow.'} The archive is part of Sorted Plus.</p>${plusBlock(stripeReady)}`}</main>` });
}

export function messagePage(title, html, { action } = {}) {
  return layout({ title: `${title} | Sorted`, description: title,
    body: `<div class="sign">${header()}</div><main class="wrap msg"><h2 style="font:900 36px/1.1 Overpass,sans-serif;margin:0">${esc(title)}</h2><div class="body">${html}</div>${action ?? '<a class="btn" href="/">Play today\'s puzzle</a>'}</main>` });
}

// Browser game logic. Answers are checked by POST /api/guess; state is kept per puzzle in localStorage.
const CLIENT = `(() => {
const el = document.getElementById('game'); const date = el.dataset.date, n = +el.dataset.n, max = +el.dataset.max, url = el.dataset.url;
const KEY = 'sorted:' + date; const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
let state = store.get(KEY, { results: [], done: false, solved: false, answer: null });
const rows = document.getElementById('rows'), form = el.querySelector('form'), input = document.getElementById('g');
const colour = p => p >= 80 ? 'var(--near)' : p >= 50 ? 'var(--mid)' : 'var(--far)';
const ARROW = { N:'⬆️', NE:'↗️', E:'➡️', SE:'↘️', S:'⬇️', SW:'↙️', W:'⬅️', NW:'↖️' };
function render() {
  [...rows.children].forEach((li, i) => { const r = state.results[i]; if (!r) return;
    li.className = 'row' + (r.correct ? ' win' : '');
    li.innerHTML = '<span class="t"></span><span class="km">' + (r.correct ? 'Sorted' : r.km.toLocaleString('en-GB') + ' km') + '</span><span class="dir" aria-label="' + (r.dir || 'here') + '">' + (r.correct ? '📮' : ARROW[r.dir]) + '</span><span class="bar"><i style="width:' + r.proximity + '%;background:' + colour(r.proximity) + '"></i></span>';
    li.querySelector('.t').textContent = r.town; });
  const clue = document.getElementById('clue'); if (state.clue) { clue.textContent = state.clue; clue.style.display = 'block'; }
  if (state.done) { form.querySelector('button').disabled = true; input.disabled = true; showResult(); }
}
function stats() { return store.get('sorted:stats', { played: 0, won: 0, streak: 0, last: null }); }
function record(won) { const s = stats(); if (s.lastDate === date) return; const y = new Date(Date.parse(date) - 864e5).toISOString().slice(0, 10);
  s.played++; if (won) { s.won++; s.streak = s.lastWin === y ? s.streak + 1 : 1; s.lastWin = date; } else s.streak = 0; s.lastDate = date; store.set('sorted:stats', s); }
function showResult() { const s = stats(); const box = document.getElementById('result'); box.style.display = 'block';
  document.getElementById('rh').textContent = state.solved ? 'Sorted in ' + state.results.length + '!' : 'Not this time';
  document.getElementById('rp').textContent = 'The answer was ' + state.answer + '. A new puzzle arrives at midnight.';
  document.getElementById('st-streak').textContent = s.streak; document.getElementById('st-played').textContent = s.played;
  document.getElementById('st-won').textContent = s.played ? Math.round(100 * s.won / s.played) + '%' : '0%'; }
form.addEventListener('submit', async (e) => { e.preventDefault(); const guess = input.value.trim(); if (!guess || state.done) return;
  const res = await fetch('/api/guess', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, guess, count: state.results.length + 1 }) });
  const r = await res.json(); if (r.error) { input.setCustomValidity('Pick a town from the list'); input.reportValidity(); input.setCustomValidity(''); return; }
  if (state.results.some(x => x.town === r.town)) { input.value = ''; return; }
  state.results.push(r); state.clue = r.clue || state.clue; input.value = '';
  if (r.correct || state.results.length >= max) { state.done = true; state.solved = !!r.correct; state.answer = r.answer || r.town; record(state.solved); }
  store.set(KEY, state); render(); });
document.getElementById('share').addEventListener('click', async () => {
  const res = await fetch('/api/share?date=' + date, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ results: state.results, solved: state.solved }) });
  const { text } = await res.json(); try { await navigator.clipboard.writeText(text); document.getElementById('share').textContent = 'Copied. Paste it anywhere'; } catch { prompt('Copy your result', text); } });
render(); })();`;
