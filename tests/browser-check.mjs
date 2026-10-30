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
  // Diagnostika bir marta o‘tiladi (natija saqlanadi), shuning uchun har ssenariy toza brauzer xotirasi bilan boshlanadi.
  try { await evaluate(`localStorage.clear()`); } catch { /* about:blank */ }
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
  check('Vaqt savollar soniga qarab: 10 ta savol → ≈ 4 daqiqa', await evaluate(`document.querySelector('.mp-hero .mp-chips').textContent.includes('≈ 4')`));
  await startTest();
  await shot('A2-question-mobile');
  const soundState = () => evaluate(`document.querySelector('.mp-sound')?.getAttribute('aria-pressed')`);
  const soundBefore = await soundState();
  await click('.mp-sound');
  await sleep(250);
  const soundMuted = await soundState();
  await click('.mp-sound');
  await sleep(250);
  const soundAgain = await soundState();
  check('Ovoz tugmasi bor, standart yoqiq; bosilsa o‘chadi, qayta bosilsa yoqiladi', soundBefore === 'true' && soundMuted === 'false' && soundAgain === 'true', JSON.stringify([soundBefore, soundMuted, soundAgain]));
  check('9-sinf: jiddiyroq uslub (data-tone=senior)', await evaluate(`document.querySelector('.mp-root').dataset.tone === 'senior'`));
  const total = Number((await textOf('.mp-counter')).split('/')[1]);
  check('9-sinf: 10 ta savol', total === 10, `total=${total}`);
  const modes = ['right', 'wrong', 'right', 'skip', 'right', 'right', 'wrong', 'right', 'right', 'right'];
  let allReactions = true;
  let barChecked = false;
  let keysChecked = false;
  let waitedWrong = false;
  let sawKatex = false;
  const seenGrades = new Set();
  for (let i = 0; i < total; i += 1) {
    sawKatex ||= await evaluate(`!!document.querySelector('.mp-q .katex')`);
    const bar = await evaluate(`(() => { const all = [...document.querySelectorAll('.mp-qbar .mp-btn')]; const soft = all.find((b) => b.classList.contains('mp-btn--soft')); const main = all.find((b) => !b.classList.contains('mp-btn--soft')); if (!soft || !main) return null; const s = soft.getBoundingClientRect(); const m = main.getBoundingClientRect(); const card = document.querySelector('.mp-qcard').getBoundingClientRect(); return { softAtLeft: s.left <= card.left + 60, sameLine: Math.abs(s.top - m.top) < 6, softLeftOfMain: s.right <= m.left, mainAtRight: m.right > card.right - 40, atBottom: m.bottom > card.bottom - 40 }; })()`);
    if (bar && !barChecked) { barChecked = true; check('Telefon: “Bilmayman” chapda, “Tekshirish” o‘ngda, pastda, bir qatorda', bar.softAtLeft && bar.sameLine && bar.softLeftOfMain && bar.mainAtRight && bar.atBottom, JSON.stringify(bar)); await shot('A2b-bar-mobile'); }
    const currentId = await evaluate(`document.querySelector('.mp-qcard')?.dataset.item`);
    const currentItem = MATH_ITEMS.find((entry) => entry.id === currentId);
    if (currentItem.type === 'number' && !keysChecked) {
      keysChecked = true;
      await evaluate(`document.querySelector('.mp-input').focus()`);
      for (const symbol of ['/', '.', ',', '−']) await click(`.mp-key[data-key="${symbol}"]`);
      await send('Input.insertText', { text: 'abc' });
      const typed = await evaluate(`document.querySelector('.mp-input').value`);
      const sizes = await evaluate(`[...document.querySelectorAll('.mp-key')].map((k) => { const r = k.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); })`);
      check('Belgi tugmalari (/ . , −): kiritiladi, harf kiritilmaydi, hammasi bir xil o‘lchamda',
        [...typed].sort().join('') === [...'/.,−'].sort().join('') && sizes.length === 4 && new Set(sizes).size === 1, JSON.stringify({ typed, sizes }));
      await shot('A2c-keys-mobile');
      await evaluate(`(() => { const f = document.querySelector('.mp-input'); f.focus(); f.select(); document.execCommand('delete'); })()`);
    }
    const { item, reactionOk } = await answerQuestion('ru', modes[i]);
    if (modes[i] === 'wrong' && !waitedWrong) {
      waitedWrong = true;
      await sleep(3200);
      check('Xato javobdan keyin o‘zi o‘tmaydi (faqat “Davom” bilan)',
        (await evaluate(`document.querySelector('.mp-qcard')?.dataset.item`)) === currentId && (await evaluate(`!!document.querySelector('.mp-fbtext')`)));
    }
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
  check('Natija: “Qayta o‘tish” yo‘q (bir marta o‘tiladi); 9-sinfda konfetti va toj yo‘q',
    await evaluate(`document.querySelectorAll('.mp-actions .mp-btn').length === 1 && !document.querySelector('.mp-confetti') && !document.querySelector('.mp-crown')`));
  check('Natija: “Sizga mos sinf” + pasaytirish izohi (Сначала закрепим темы 8 класса)',
    await evaluate(`(() => { const o = document.querySelector('.mp-open'); return !!o && o.textContent.includes('Подходящий') && o.textContent.includes('Сначала закрепим темы 8'); })()`));
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
  // Bir marta o‘tiladi: yangilansa natija ko‘rsatiladi va LMS ga qayta yuborilmaydi.
  await send('Page.reload');
  await waitFor(`document.readyState==='complete' && !!document.querySelector('.mp-root')`, 'qayta yuklandi (natija)');
  await sleep(900);
  check('Bir marta o‘tiladi: sahifa yangilansa test qayta boshlanmaydi, natija ko‘rsatiladi', await evaluate(`!!document.querySelector('.mp-ring') && !document.querySelector('.mp-setup')`));
  await openLog();
  check('Natija qayta yuborilmaydi (onComplete/onProgress chaqirilmaydi)', (await eventKinds()).length === 0);

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
  await click('.mp-icon-btn:not(.mp-sound)');
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

  // ── D. 2-sinf (savollar 1-sinfdan), 1-sinf (test yo‘q), desktop, til almashinuvi ──
  await open('?lang=uz&grade=2');
  await startTest();
  const total2 = Number((await textOf('.mp-counter')).split('/')[1]);
  check('2-sinf: 6 ta savol', total2 === 6, String(total2));
  const grades2 = new Set();
  for (let i = 0; i < total2; i += 1) {
    const { item } = await answerQuestion('uz', 'right');
    grades2.add(item.grade);
    if (i < total2 - 1) await nextQuestion();
  }
  check('2-sinf savollari faqat 1-sinfdan', grades2.size === 1 && grades2.has(1), [...grades2].join());
  await click('.mp-qbar .mp-btn');
  await waitFor(`!!document.querySelector('.mp-ring')`, 'natija');
  const result2 = await (async () => { await openLog(); return readCompleteJson(); })();
  check('2-sinf, 6/6 → o‘z sinfi: grade_2', result2?.placementLevel === 'grade_2' && result2?.ownGradeUnlocked === true, result2?.placementLevel);
  check('Kichik sinfda konfetti bor', await evaluate(`!!document.querySelector('.mp-confetti')`));

  // 1-sinf: savol yo‘q, do‘stona oyna
  await open('?lang=uz&grade=1');
  check('1-sinf: qoidalar ro‘yxati va statistika yo‘q, do‘stona izoh va “Darslarni boshlash” bor',
    await evaluate(`!document.querySelector('.mp-rules') && document.querySelectorAll('.mp-perks li').length === 3 && !document.querySelector('.mp-stats:not(.mp-perkstats)') && !!document.querySelector('.mp-notice') && document.querySelector('.mp-setup .mp-btn--block').textContent.includes('Darslarni boshlash')`));
  await click('.mp-setup .mp-btn--block');
  await waitFor(`!!document.querySelector('.mp-notest')`, '1-sinf oynasi');
  await openLog();
  const kinds1 = await eventKinds();
  const result1 = await readCompleteJson();
  check('1-sinf: savol yo‘q, onComplete 1 marta (NO_TEST_REQUIRED, grade_1, 0 savol)',
    !(await evaluate(`!!document.querySelector('.mp-q')`)) && kinds1.filter((k) => k === 'onComplete:').length === 1
    && result1?.completionType === 'NO_TEST_REQUIRED' && result1?.placementLevel === 'grade_1' && result1?.answeredCount === 0, JSON.stringify([kinds1, result1?.completionType]));
  await shot('D0-notest-mobile');
  await viewport(1280, 800, false);
  await sleep(1500);
  await shot('D1-notest-desktop');
  await send('Page.reload');
  await waitFor(`document.readyState==='complete' && !!document.querySelector('.mp-root')`, 'qayta yuklandi (1-sinf)');
  await sleep(900);
  check('1-sinf: sahifa yangilansa 1-sinf oynasi emas, odatdagi ochilish ekrani chiqadi', await evaluate(`!!document.querySelector('.mp-setup') && !document.querySelector('.mp-notest')`));
  await open('?lang=en&grade=11');
  await startTest();
  await shot('D2-question-desktop');
  const englishQuestion = await textOf('.mp-q');
  check('11-sinf: 10 ta savol', Number((await textOf('.mp-counter')).split('/')[1]) === 10);
  check('Desktop: “Bilmayman” karta chap chetida (markazda emas)', await evaluate(`(() => { const s = document.querySelector('.mp-qbar .mp-btn--soft').getBoundingClientRect(); const c = document.querySelector('.mp-qcard').getBoundingClientRect(); return s.left <= c.left + 80; })()`));
  const seen11 = new Set();
  for (let i = 0; i < 10; i += 1) {
    const { item } = await answerQuestion('en', i === 3 ? 'wrong' : 'right');
    seen11.add(item.grade);
    if (i < 9) await nextQuestion();
  }
  check('11-sinf savollari faqat 10-sinfdan', seen11.size === 1 && seen11.has(10), [...seen11].join());
  await click('.mp-qbar .mp-btn');
  await waitFor(`!!document.querySelector('.mp-ring')`, 'natija (11-sinf)');
  const result11 = await (async () => { await openLog(); return readCompleteJson(); })();
  check('11-sinf, 9/10 (90%) → o‘z sinfida qoladi: grade_11, perfectScore=false', result11?.placementLevel === 'grade_11' && result11?.ownGradeUnlocked === true && result11?.perfectScore === false, JSON.stringify([result11?.placementLevel, result11?.ownGradeUnlocked, result11?.perfectScore]));
  await sleep(1400);
  await shot('D3-result-perfect-desktop');
  check('Ingliz tilidagi savol matni', /[a-z]/i.test(englishQuestion) && !/[а-яё]/i.test(englishQuestion), englishQuestion);
} catch (error) {
  check(`Skript xatosi: ${error.message}`, false, error.stack);
} finally {
  cleanup();
}

const failed = results.filter((entry) => !entry.ok).length;
console.log(`\n${results.length - failed}/${results.length} tekshiruv o‘tdi. Skrinshotlar: ${SHOTS}`);
process.exit(failed ? 1 : 0);
