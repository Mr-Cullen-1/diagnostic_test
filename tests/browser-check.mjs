// Brauzer tekshiruvi (qo‘lda ishga tushiriladi): haqiqiy Chrome’da to‘liq oqim, LMS callback’lari, mobil ko‘rinish.
//   1) npm run build && npx next start -p 3100     (yoki npm run dev)
//   2) node tests/browser-check.mjs [BASE_URL] [SKRINSHOT_PAPKASI]
// Chrome yo‘li CHROME_PATH o‘zgaruvchisi bilan beriladi (standart: Windows Program Files).
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

const BASE = process.argv[2] ?? 'http://localhost:3100';
const SHOTS = process.argv[3] ?? join(tmpdir(), 'math-shots');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
mkdirSync(SHOTS, { recursive: true });

const source = readFileSync(new URL('../app/math-placement.jsx', import.meta.url), 'utf8');
const logic = source.slice(source.indexOf('// <logic>'), source.indexOf('// </logic>'));
const { MATH_ITEMS } = runInNewContext(`${logic}; ({ MATH_ITEMS })`);

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✔' : '✖'} ${name}${ok ? '' : `  → ${detail}`}`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const profile = mkdtempSync(join(tmpdir(), 'chrome-profile-'));
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--headless=new', '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill(); } catch { /* yopilgan */ } };
process.on('exit', cleanup);

async function connect() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((target) => target.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* hali ishga tushmagan */ }
    await sleep(250);
  }
  throw new Error('Chrome ishga tushmadi');
}

const socket = new WebSocket(await connect());
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let nextId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = (nextId += 1);
  pending.set(id, (message) => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)));
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
};
const waitFor = async (expression, label, timeout = 8000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true;
    await sleep(80);
  }
  throw new Error(`Kutilgan holat chiqmadi: ${label}`);
};
const shot = async (name) => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, 'base64'));
};
const viewport = (width, height, mobile) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
const open = async (query) => {
  await send('Page.navigate', { url: `${BASE}/${query}` });
  await waitFor(`document.readyState==='complete' && !!document.querySelector('.mp-root')`, 'sahifa yuklandi');
};
const click = (selector, text) => evaluate(`(() => {
  const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})];
  const node = ${text === undefined ? 'nodes[0]' : `nodes.find((n) => n.textContent.includes(${JSON.stringify(text)}))`};
  if (!node) return false; node.click(); return true; })()`);
const textOf = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent ?? null`);

async function answerQuestion(lang, mode) {
  const itemId = await evaluate(`document.querySelector('.mp-qcard')?.dataset.item`);
  const item = MATH_ITEMS.find((entry) => entry.id === itemId);
  if (!item) throw new Error(`Savol bankda topilmadi: ${itemId}`);
  if (mode === 'skip') {
    await click('.mp-qbar .mp-btn--soft');
  } else if (item.type === 'choice') {
    const index = mode === 'right' ? item.correct : (item.correct + 1) % item.options.length;
    await evaluate(`document.querySelector('.mp-opt[data-opt="${index}"]').click()`);
  } else {
    const right = Array.isArray(item.answer) ? item.answer[0] : item.answer;
    await evaluate(`document.querySelector('.mp-input').focus()`);
    await send('Input.insertText', { text: mode === 'right' ? right : '987654' });
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  }
  await waitFor(`!!document.querySelector('.mp-fbtext')`, 'reaksiya paydo bo‘ldi');
  const reaction = await evaluate(`document.querySelector('.mp-fbtext').className`);
  const wantsClass = mode === 'right' ? 'mp-fbtext--ok' : mode === 'wrong' ? 'mp-fbtext--bad' : 'mp-fbtext--skip';
  return { item, reaction, reactionOk: reaction.includes(wantsClass), fbText: await textOf('.mp-fbtext') };
}
const nextQuestion = async () => {
  const before = await evaluate(`document.querySelector('.mp-qcard')?.dataset.item`);
  await click('.mp-qbar .mp-btn');
  await waitFor(`!document.querySelector('.mp-fbtext') && (document.querySelector('.mp-qcard')?.dataset.item !== ${JSON.stringify(before)} || !document.querySelector('.mp-qcard'))`, 'keyingi ekran');
};
const startTest = async () => {
  await click('.mp-setup .mp-btn--block');
  await waitFor(`!!document.querySelector('.mp-count')`, 'sanoq boshlandi');
  await waitFor(`!document.querySelector('.mp-count') && !!document.querySelector('.mp-q')`, 'savol chiqdi', 6000);
};
const openLog = async () => {
  if (!(await evaluate(`!!document.querySelector('.lms-panel')`))) await click('.lms-toolbar button', 'Callback');
  await waitFor(`!!document.querySelector('.lms-panel')`, 'panel ochildi');
};
const readCompleteJson = async () => JSON.parse(await evaluate(`(() => { const t = document.querySelector('.lms-panel pre').textContent; return t.includes('{') ? t : 'null'; })()`));
const eventKinds = async () => evaluate(`[...document.querySelectorAll('.lms-panel li')].map((li) => {
  const kind = li.textContent.match(/(onProgress|onComplete)/)[1];
  return kind === 'onComplete' ? 'onComplete:' : kind + ':' + ((li.textContent.match(/"status":"(\\w+)"/) || [])[1] ?? '');
})`);

try {
  // ── A. 9-sinf, ru, mobil: to‘liq oqim ──
  await viewport(390, 844, true);
  await send('Page.enable');
  await open('?lang=ru&grade=9');
  check('Anketa yo‘q: sahifa to‘g‘ridan-to‘g‘ri diagnostikani ko‘rsatadi', (await evaluate(`document.body.innerText`)).includes('математике'));
  check('Sinf LMS dan berilganda tanlash tugmalari ko‘rinmaydi', !(await evaluate(`!!document.querySelector('.mp-tiles')`)));
  await shot('A1-intro-mobile');
  await startTest();
  await shot('A2-question-mobile');
  const total = Number((await textOf('.mp-counter')).split('/')[1]);
  check('9-sinf: 10 ta savol', total === 10, `total=${total}`);
  const modes = ['right', 'wrong', 'right', 'skip', 'right', 'right', 'wrong', 'right', 'right', 'right'];
  let allReactions = true;
  let barChecked = false;
  let sawKatex = false;
  const seenGrades = new Set();
  for (let i = 0; i < total; i += 1) {
    sawKatex ||= await evaluate(`!!document.querySelector('.mp-q .katex')`);
    const bar = await evaluate(`(() => { const all = [...document.querySelectorAll('.mp-qbar .mp-btn')]; const soft = all.find((b) => b.classList.contains('mp-btn--soft')); const main = all.find((b) => !b.classList.contains('mp-btn--soft')); if (!soft || !main) return null; const s = soft.getBoundingClientRect(); const m = main.getBoundingClientRect(); const card = document.querySelector('.mp-qcard').getBoundingClientRect(); return { softAtLeft: s.left <= card.left + 60, sameLine: Math.abs(s.top - m.top) < 6, softLeftOfMain: s.right <= m.left, mainAtRight: m.right > card.right - 40, atBottom: m.bottom > card.bottom - 40 }; })()`);
    if (bar && !barChecked) { barChecked = true; check('Telefon: “Bilmayman” chapda, “Tekshirish” o‘ngda, pastda, bir qatorda', bar.softAtLeft && bar.sameLine && bar.softLeftOfMain && bar.mainAtRight && bar.atBottom, JSON.stringify(bar)); await shot('A2b-bar-mobile'); }
    const { item, reactionOk } = await answerQuestion('ru', modes[i]);
    seenGrades.add(item.grade);
    allReactions &&= reactionOk;
    if (i === 1) await shot('A3-wrong-reaction-mobile');
    if (i === 0) await shot('A3b-right-reaction-mobile');
    if (i < total - 1) await nextQuestion();
  }
  check('Har javobga to‘g‘ri reaksiya (to‘g‘ri/noto‘g‘ri/bilmayman)', allReactions);
  check('KaTeX: savollarda ifodalar chizildi (window.katex + .katex elementlari)', sawKatex && (await evaluate(`typeof window.katex === 'object'`)), String(sawKatex));
  check('9-sinf savollari faqat 8-sinfdan', seenGrades.size === 1 && seenGrades.has(8), [...seenGrades].join());
  await click('.mp-qbar .mp-btn');
  await waitFor(`!!document.querySelector('.mp-ring')`, 'natija ekrani');
  await sleep(1600);
  await shot('A4-result-mobile');
  check('Mobilda gorizontal siljish yo‘q', await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`));
  await openLog();
  const kinds = await eventKinds();
  const result = await readCompleteJson();
  check('onProgress 10 marta in_progress + 1 marta complete', kinds.filter((k) => k === 'onProgress:in_progress').length === 10 && kinds.filter((k) => k === 'onProgress:complete').length === 1, kinds.join());
  check('onComplete aynan 1 marta', kinds.filter((k) => k === 'onComplete:').length === 1, kinds.join());
  check('onComplete natijasi: 7/10 → placementLevel = "grade_8" (9-sinf → 1 past)', result?.placementLevel === 'grade_8' && result?.recommendedCourse === 'grade_8' && result?.perfectScore === false, JSON.stringify(result?.placementLevel));
  check('Natija: 7/10 to‘g‘ri, answeredCount=10', result?.score === 7 && result?.answeredCount === 10 && result?.totalQuestions === 10, `${result?.score}/${result?.answeredCount}`);
  check('Natija: completionType FULL_PLACEMENT, confidence satr', result?.completionType === 'FULL_PLACEMENT' && typeof result?.confidence === 'string');
  check('Natija: responses[10], skipped=1', result?.responses?.length === 10 && result.responses.filter((r) => r.skipped).length === 1);
  check('Davomiylik 3–4 daqiqadan oshmaydi (avtomat skript uchun juda kam)', typeof result?.durationSec === 'number' && result.durationSec < 240, String(result?.durationSec));
  await click('.lms-toolbar button', 'Callback');

  // ── B. Sinf berilmaydi: tanlash, erta chiqish ──
  await open('?lang=uz');
  check('Sinf berilmasa: 1–11 tanlash ko‘rinadi', (await evaluate(`document.querySelectorAll('.mp-tile').length`)) === 11);
  check('Sinf tanlanmaguncha “Boshlaymiz” o‘chiq', await evaluate(`document.querySelector('.mp-btn--block').disabled`));
  await shot('B1-picker-mobile');
  await click('.mp-tile', '3');
  await waitFor(`!document.querySelector('.mp-btn--block').disabled`, 'tugma yoqildi');
  await sleep(500);
  check('Sinf tanlangach telefonda siljish/overflow yo‘q', await evaluate(`(() => { const s = document.querySelector('.mp-stage'); return s.scrollHeight - s.clientHeight <= 1 && document.documentElement.scrollWidth <= innerWidth; })()`));
  await shot('B1b-picked-mobile');
  await startTest();
  const total3 = Number((await textOf('.mp-counter')).split('/')[1]);
  check('3-sinf: 6 ta savol', total3 === 6, String(total3));
  await answerQuestion('uz', 'right');
  await nextQuestion();
  await click('.mp-icon-btn[aria-label]', undefined);
  await waitFor(`!!document.querySelector('.mp-dialog')`, 'chiqish dialogi');
  await shot('B2-exit-dialog-mobile');
  await click('.mp-dialog .mp-btn:not(.mp-btn--soft)');
  await waitFor(`document.body.innerText.includes('1 / 6')`, 'incomplete ekran');
  await openLog();
  const kindsB = await eventKinds();
  check('Erta chiqish: onProgress incomplete bor, onComplete YO‘Q', kindsB.includes('onProgress:incomplete') && !kindsB.some((k) => k.startsWith('onComplete')), kindsB.join());
  await shot('B3-incomplete-mobile');

  // ── C. Sessiyani tiklash ──
  await open('?lang=en&grade=5');
  await startTest();
  const first5 = await answerQuestion('en', 'right');
  check('5-sinf savollari 4-sinfdan', first5.item.grade === 4, String(first5.item.grade));
  await nextQuestion();
  await answerQuestion('en', 'wrong');
  await sleep(300);
  await send('Page.reload');
  await waitFor(`document.readyState==='complete' && !!document.querySelector('.mp-root')`, 'qayta yuklandi');
  await sleep(500);
  const counter = await textOf('.mp-counter');
  check('Yangilashdan keyin sessiya tiklanadi (2 ta javobdan keyin 3-savol)', counter?.trim() === '3 / 7' || counter?.trim() === '2 / 7', String(counter));

  // ── D. 1-sinf, kichik ekran, desktop, til almashinuvi ──
  await open('?lang=uz&grade=1');
  await startTest();
  const total1 = Number((await textOf('.mp-counter')).split('/')[1]);
  check('1-sinf: 6 ta savol', total1 === 6, String(total1));
  const grades1 = new Set();
  for (let i = 0; i < total1; i += 1) {
    const { item } = await answerQuestion('uz', 'right');
    grades1.add(item.grade);
    if (i < total1 - 1) await nextQuestion();
  }
  check('1-sinf savollari faqat 1-sinfdan', [...grades1].every((g) => g === 1));
  await click('.mp-qbar .mp-btn');
  await waitFor(`!!document.querySelector('.mp-ring')`, 'natija');
  const result1 = await (async () => { await openLog(); return readCompleteJson(); })();
  check('1-sinf → ochiladigan modul grade_1', result1?.placementLevel === 'grade_1', result1?.placementLevel);
  await viewport(1280, 800, false);
  await sleep(1500);
  await shot('D1-result-desktop');
  await open('?lang=en&grade=11');
  await startTest();
  await shot('D2-question-desktop');
  check('11-sinf: 10 ta savol', Number((await textOf('.mp-counter')).split('/')[1]) === 10);
  check('Desktop: “Bilmayman” karta chap chetida (markazda emas)', await evaluate(`(() => { const s = document.querySelector('.mp-qbar .mp-btn--soft').getBoundingClientRect(); const c = document.querySelector('.mp-qcard').getBoundingClientRect(); return s.left <= c.left + 80; })()`));
  const seen11 = new Set();
  for (let i = 0; i < 10; i += 1) {
    const { item } = await answerQuestion('en', 'right');
    seen11.add(item.grade);
    if (i < 9) await nextQuestion();
  }
  check('11-sinf savollari faqat 10-sinfdan', seen11.size === 1 && seen11.has(10), [...seen11].join());
  await click('.mp-qbar .mp-btn');
  await waitFor(`!!document.querySelector('.mp-ring')`, 'natija (11-sinf)');
  const result11 = await (async () => { await openLog(); return readCompleteJson(); })();
  check('11-sinf, 10/10 → o‘z sinfida qoladi: grade_11, perfectScore', result11?.placementLevel === 'grade_11' && result11?.perfectScore === true, JSON.stringify([result11?.placementLevel, result11?.perfectScore]));
  await sleep(1400);
  await shot('D3-result-perfect-desktop');
  const ptext = await textOf('.mp-q');
  check('Ingliz tilidagi savol matni', /[a-z]/i.test(ptext) && !/[а-яё]/i.test(ptext), ptext);
} catch (error) {
  check(`Skript xatosi: ${error.message}`, false, error.stack);
} finally {
  cleanup();
}

const failed = results.filter((entry) => !entry.ok).length;
console.log(`\n${results.length - failed}/${results.length} tekshiruv o‘tdi. Skrinshotlar: ${SHOTS}`);
process.exit(failed ? 1 : 0);
