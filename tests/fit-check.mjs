// Viewportga sig‘ish tekshiruvi (qo‘lda): har bir ekran holatida (kirish, har savol, reaksiya, natija) sahifa yoki kartalar
// siljishni talab qilmasligini turli ekran o‘lchamlarida o‘lchaydi.
//   1) npm run build && npx next start -p 3100
//   2) node tests/fit-check.mjs [SKRINSHOT_PAPKASI] [d1920,d1440,d1280x640,t1024,tab768,m390,m360x640]
// Muhit: BASE_URL, CHROME_PATH. 360×640 kabi juda kichik telefonda natija ekrani siljishi mumkin (kutilgan).
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const SHOTS = process.argv[2] ?? join(tmpdir(), 'math-fit-shots');
const ONLY = process.argv[3] ? process.argv[3].split(',') : null;
mkdirSync(SHOTS, { recursive: true });
const source = readFileSync(new URL('../app/math-placement.jsx', import.meta.url), 'utf8');
const logic = source.slice(source.indexOf('// <logic>'), source.indexOf('// </logic>'));
const { MATH_ITEMS } = runInNewContext(`${logic}; ({ MATH_ITEMS })`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), 'chrome-fit-'));
const chrome = spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--remote-debugging-port=9335', `--user-data-dir=${profile}`, '--headless=new', '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let list;
for (let i = 0; i < 60; i += 1) { try { list = await (await fetch('http://127.0.0.1:9335/json')).json(); if (list.find((t) => t.type === 'page')) break; } catch { /* kutamiz */ } await sleep(250); }
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) pend.get(m.id)(m); });
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
const waitFor = async (expr, label, t = 8000) => { const s = Date.now(); while (Date.now() - s < t) { if (await ev(expr)) return; await sleep(70); } throw new Error('kutilmadi: ' + label); };
const shot = async (name) => { const { result } = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(result.data, 'base64')); };
const click = (sel, text) => ev(`(() => { const n=[...document.querySelectorAll(${JSON.stringify(sel)})]; const x=${text === undefined ? 'n[0]' : `n.find(e=>e.textContent.includes(${JSON.stringify(text)}))`}; if(!x) return false; x.click(); return true; })()`);
const fitJs = `(() => { const s=document.querySelector('.mp-stage'); const r=document.querySelector('.mp-root'); if(!s) return null;
  const q=[...document.querySelectorAll('.mp-qcard,.mp-focus,.mp-intro,.mp-resultgrid,.mp-orange,.mp-setup,.mp-resultbody')].map(e=>({c:e.className.split(' ')[0],over:e.scrollHeight-e.clientHeight})).filter(x=>x.over>1);
  const blocks=['.mp-rhead','.mp-resultbody > .mp-glabel','.mp-topics','.mp-actions'].map(q=>document.querySelector(q)).filter((e)=>e && e.getClientRects().length).map(e=>e.getBoundingClientRect()); let overlap=false; for(let i=1;i<blocks.length;i+=1){ if(blocks[i].top < blocks[i-1].bottom - 1) overlap=true; }
  const act=document.querySelector('.mp-actions .mp-btn:last-child'); const actionVisible = act ? act.getBoundingClientRect().bottom <= innerHeight + 1 && act.getBoundingClientRect().top >= 0 : null;
  return { overlap, actionVisible, stageOver: s.scrollHeight - s.clientHeight, rootH: r.clientHeight, vw: innerWidth, hOver: document.documentElement.scrollWidth - innerWidth, inner: q }; })()`;

const results = [];
const measure = async (label) => {
  const m = await ev(fitJs);
  const phoneResult = /natija$/.test(label) && m && m.vw <= 860;
  const ok = phoneResult ? m.hOver <= 0 && m.actionVisible === true && m.overlap === false : m && m.stageOver <= 1 && m.hOver <= 0 && m.inner.length === 0;
  results.push({ label, ok, m });
  console.log(`${ok ? '✔' : '✖'} ${label}${ok ? '' : '  ' + JSON.stringify(m)}`);
};

const sizes = [[1920, 913, false, 'd1920'], [1440, 720, false, 'd1440'], [1280, 640, false, 'd1280x640'], [1024, 700, false, 't1024'], [768, 1024, true, 'tab768'], [390, 844, true, 'm390'], [360, 640, true, 'm360x640'], [320, 642, true, 'm320']].filter((s) => !ONLY || ONLY.includes(s[3]));
await send('Page.enable');
for (const [w, h, mobile, tag] of sizes) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  for (const lang of ['uz', 'ru']) {
    // Intro: sinf berilmaydi / beriladi
    await send('Page.navigate', { url: `${BASE}/?lang=${lang}&embed=1` });
    await waitFor(`!!document.querySelector('.mp-root')`, 'intro'); await sleep(700);
    await measure(`${tag}/${lang} intro (sinf tanlash)`);
    if (lang === 'uz') await shot(`${tag}-intro-pick`);
    await click('.mp-tile', '7'); await sleep(600);
    await measure(`${tag}/${lang} intro (sinf tanlangan)`);
    if (lang === 'uz') await shot(`${tag}-intro-picked`);
    await send('Page.navigate', { url: `${BASE}/?lang=${lang}&grade=9&embed=1` });
    await waitFor(`!!document.querySelector('.mp-root')`, 'intro2'); await sleep(700);
    await measure(`${tag}/${lang} intro (sinf berilgan)`);
    if (lang === 'uz') await shot(`${tag}-intro-grade`);
    await click('.mp-btn--block');
    await waitFor(`!document.querySelector('.mp-count') && !!document.querySelector('.mp-q')`, 'quiz', 8000); await sleep(650);
    const total = Number((await ev(`document.querySelector('.mp-counter')?.textContent`)).split('/')[1].trim()) || 10;
    let shownChoice = false; let shownNumber = false;
    for (let i = 0; i < total; i += 1) {
      const text = await ev(`document.querySelector('.mp-qcard')?.dataset.item`);
      const item = MATH_ITEMS.find((it) => it.id === text);
      await measure(`${tag}/${lang} q${i + 1} ${item.type} (savol)`);
      if (lang === 'uz' && item.type === 'choice' && !shownChoice) { shownChoice = true; await shot(`${tag}-quiz-choice`); }
      if (lang === 'uz' && item.type === 'number' && !shownNumber) { shownNumber = true; await shot(`${tag}-quiz-number`); }
      if (item.type === 'choice') await ev(`document.querySelector('.mp-opt[data-opt="${(item.correct + 1) % 4}"]').click()`);
      else { await ev(`document.querySelector('.mp-input').focus()`); await send('Input.insertText', { text: i % 3 === 0 ? String(item.answer) : '987654' }); await click('.mp-qbar .mp-btn:not(.mp-btn--soft)'); }
      await waitFor(`!!document.querySelector('.mp-fbtext')`, 'reaksiya');
      await sleep(450);
      await measure(`${tag}/${lang} q${i + 1} reaksiya`);
      if (lang === 'uz' && i === 1) await shot(`${tag}-quiz-reaction`);
      if (i < total - 1) { const before = text; await click('.mp-qbar .mp-btn'); await waitFor(`document.querySelector('.mp-qcard')?.dataset.item !== ${JSON.stringify(before)}`, 'keyingi'); await sleep(550); }
    }
    await click('.mp-qbar .mp-btn');
    await waitFor(`!!document.querySelector('.mp-ring')`, 'natija'); await sleep(2200);
    await measure(`${tag}/${lang} natija`);
    if (lang === 'uz') await shot(`${tag}-result`);
  }
}
chrome.kill();
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length}/${results.length} holat sig‘di`);
process.exit(0);
