import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import katex from 'katex';

// Mantiq bloki JSX dan <logic> belgilari orasidan kesib olinadi (u sof JS, JSX yo‘q).
const source = readFileSync(new URL('../app/math-placement.jsx', import.meta.url), 'utf8');
const logic = source.slice(source.indexOf('// <logic>'), source.indexOf('// </logic>'));
const api = runInNewContext(`${logic}
  ({ MATH_ITEMS, PLANS, LANGS, DOMAIN_IDS, getPlan, planTotal, buildQueue, buildResult, buildResponse, answersMatch,
     isCorrectAnswer, isRestorableSession, validateMathBank, normalizeGrade, createInitialSession, correctAnswerText, splitMath, texToPlain })
`);
const { MATH_ITEMS, PLANS, LANGS, DOMAIN_IDS, getPlan, planTotal, buildQueue, buildResult, buildResponse, answersMatch,
  isCorrectAnswer, isRestorableSession, validateMathBank, normalizeGrade, createInitialSession, correctAnswerText, splitMath, texToPlain } = api;

// Ingliz diagnostikasi natijasidagi kalitlar (LMS shartnomasi) — matematika ularning hammasini saqlashi shart.
const ENGLISH_RESULT_KEYS = [
  'placementLevel', 'recommendedCourse', 'confidence', 'borderlineWith', 'answeredCount', 'totalQuestions',
  'score', 'levelStats', 'skillStats', 'completionType', 'flags', 'responses',
];
const ENGLISH_RESPONSE_KEYS = [
  'itemId', 'level', 'difficulty', 'domain', 'type', 'stage', 'blockIndex', 'correct', 'skipped', 'answer',
  'answerTimeMs', 'audioPlays', 'tooFast', 'answeredAt',
];

// vm konteksti massivlari boshqa realm’dan keladi, shuning uchun JSON orqali solishtiramiz.
const same = (actual, expected, message) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), message);

// 1–4-sinf: 1–2-sinf savollari. 5–11-sinf: aynan bitta pastdagi sinf (8 → 7, 5 → 4).
const sourceGradesFor = (grade) => (grade <= 4 ? [1, 2] : [grade - 1]);

test('savollar banki to‘liq: 3 til, takrorsiz id, qisqa matn, to‘g‘ri variantlar', () => {
  same(validateMathBank(MATH_ITEMS), []);
  for (const item of MATH_ITEMS) {
    assert.match(item.id, /^g\d+-/);
    assert.equal(Number(item.id.match(/^g(\d+)-/)[1]), item.grade);
    // Uzunlik so‘zlar bo‘yicha: $…$ ichidagi KaTeX belgilari hisobga olinmaydi.
    for (const text of item.q) assert.ok(text.replace(/\$[^$]*\$/g, 'xxxxxx').length <= 150, `${item.id} savol juda uzun`);
  }
  same([...new Set(MATH_ITEMS.map((item) => item.grade))].sort((a, b) => a - b), [1, 2, 4, 5, 6, 7, 8, 9, 10]);
});

test('savollar qisqa javobli: yozma/uzun javob talab qiladigan tur yo‘q', () => {
  for (const item of MATH_ITEMS) {
    assert.ok(['number', 'choice'].includes(item.type), item.id);
    if (item.type === 'number') {
      const first = Array.isArray(item.answer) ? item.answer[0] : item.answer;
      assert.ok(first.length <= 6, `${item.id} javobi qisqa emas`);
    }
  }
});

test('rejalar: ochiladigan sinf (1–11: 1 past, kamida 1), savollar kerakli sinflardan, soni 5–6 va 7–10', () => {
  // Savol soni: 1–4 → 6; 5, 6 → 7; 7, 8 → 8; 9–11 → 10.
  const expectedCount = { 1: 6, 2: 6, 3: 6, 4: 6, 5: 7, 6: 7, 7: 8, 8: 8, 9: 10, 10: 10, 11: 10 };
  for (const [grade, count] of Object.entries(expectedCount)) assert.equal(planTotal(getPlan(Number(grade))), count, `${grade}-sinf savol soni`);
  for (let grade = 5; grade <= 11; grade += 1) {
    same(getPlan(grade).parts.map(([partGrade]) => partGrade), [grade - 1], `${grade}-sinf: faqat ${grade - 1}-sinf savollari`);
  }
  for (let grade = 1; grade <= 11; grade += 1) {
    const plan = getPlan(grade);
    const expectedOpen = Math.max(1, grade - 1);
    assert.equal(plan.open, expectedOpen, `${grade}-sinf ochiladigan sinf`);
    const allowed = sourceGradesFor(grade);
    plan.parts.forEach(([partGrade]) => assert.ok(allowed.includes(partGrade), `${grade}-sinf: ${partGrade}-sinf savoli`));
    const total = planTotal(plan);
    if (grade <= 4) assert.ok(total >= 5 && total <= 6, `${grade}-sinf savol soni ${total}`);
    else assert.ok(total >= 7 && total <= 10, `${grade}-sinf savol soni ${total}`);
  }
  assert.equal(getPlan(12), null);
  same([1, 2, 3, 4].map((g) => PLANS[g].open), [1, 1, 2, 3]);
  same([5, 6, 7, 8, 9, 10, 11].map((g) => PLANS[g].open), [4, 5, 6, 7, 8, 9, 10]);
  // 100% bo‘lsa o‘z sinfi — 1–11-sinfning hammasida.
  same([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => PLANS[g].openIfPerfect), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  for (let grade = 5; grade <= 11; grade += 1) {
    const available = MATH_ITEMS.filter((item) => item.grade === grade - 1).length;
    assert.ok(available >= planTotal(getPlan(grade)), `${grade}-sinf uchun ${grade - 1}-sinf banki yetarli emas (${available})`);
  }
});

test('savol navbati: har sinf uchun to‘liq, takrorsiz, sinf o‘sish tartibida, urug‘ bo‘yicha aniq', () => {
  for (let grade = 1; grade <= 11; grade += 1) {
    const plan = getPlan(grade);
    for (const seed of [1, 2, 3, 12345, 20260903]) {
      const queue = buildQueue(MATH_ITEMS, plan, seed);
      assert.equal(queue.length, planTotal(plan), `${grade}-sinf, seed ${seed}`);
      assert.equal(new Set(queue).size, queue.length);
      const grades = queue.map((id) => MATH_ITEMS.find((item) => item.id === id).grade);
      same(grades, [...grades].sort((a, b) => a - b));
      same(buildQueue(MATH_ITEMS, plan, seed), queue);
    }
  }
  const domainsOf = (grade) => new Set(buildQueue(MATH_ITEMS, getPlan(grade), 7).map((id) => MATH_ITEMS.find((item) => item.id === id).domain));
  assert.ok(domainsOf(9).size >= 4, '9-sinf: mavzular xilma-xil bo‘lishi kerak');
  assert.ok(domainsOf(11).size >= 4, '11-sinf: mavzular xilma-xil bo‘lishi kerak');
  assert.ok(domainsOf(8).size >= 4, '8-sinf: mavzular xilma-xil bo‘lishi kerak');
});

test('javoblar: ekvivalent yozuvlar qabul qilinadi, noto‘g‘risi rad etiladi', () => {
  assert.ok(answersMatch('3,60', '3,6'));
  assert.ok(answersMatch('4/5', '0,8'));
  assert.ok(answersMatch('x=10', '10'));
  assert.ok(answersMatch('−2', '-2'));
  assert.ok(answersMatch('0,85', '0.85'));
  assert.ok(answersMatch('6/12', '1/2'));
  assert.ok(answersMatch('180°', '180'));
  assert.ok(answersMatch('40 sm', '40'));
  assert.ok(answersMatch('220 000', '220000'));
  assert.ok(answersMatch('220,000', '220000'));
  assert.ok(answersMatch('5/6', ['5/6']));
  assert.ok(!answersMatch('3/0', '3'));
  assert.ok(!answersMatch('2/5', '3/5'));
  assert.ok(!answersMatch('abc', '5'));
  assert.ok(!answersMatch('1,5', '15'));
  assert.ok(!answersMatch('', '5'));
});

test('har bir savolning javobi o‘z tekshiruvidan o‘tadi (3 tilda ko‘rsatiladigan javob ham)', () => {
  for (const item of MATH_ITEMS) {
    if (item.type === 'number') {
      for (const lang of LANGS) assert.ok(answersMatch(correctAnswerText(item, lang), item.answer), `${item.id}/${lang}`);
      assert.ok(isCorrectAnswer(item, Array.isArray(item.answer) ? item.answer[0] : item.answer), item.id);
    } else {
      assert.ok(isCorrectAnswer(item, item.correct), item.id);
      assert.ok(!isCorrectAnswer(item, (item.correct + 1) % 4), item.id);
    }
  }
});

test('matematik to‘g‘rilik: raqamli javoblar savol matni bilan mos', () => {
  const expected = {
    'g1-add': 9, 'g1-sub': 8, 'g1-next': 15, 'g1-tens': 34, 'g1-word': 7 - 3, 'g1-shape': 3,
    'g2-add': 36 + 27, 'g2-sub': 52 - 18, 'g2-mul': 6 * 7, 'g2-div': 36 / 4, 'g2-boxes': 5 * 4, 'g2-length': 100,
    'g4-mul': 24 * 5, 'g4-div': 840 / 6, 'g4-fraction': (3 / 4) * 20, 'g4-area': 8 * 5, 'g4-units': 2300, 'g4-speed': 60 * 3,
    'g5-fracadd': 1 / 2 + 1 / 3, 'g5-decimal': 0.6 + 0.25, 'g5-percent': 0.25 * 80, 'g5-triarea': (10 * 6) / 2,
    'g5-cube': 3 ** 3, 'g5-anglesum': 180, 'g5-gcd': 6, 'g5-equation': 15 - 7,
    'g6-neg': -7 + 12, 'g6-abs': 9, 'g6-ratio': (12 / 3) * 5, 'g6-equation': (20 - 5) / 3, 'g6-fracmul': (3 / 4) * (2 / 3),
    'g6-raise': 200000 * 1.1,
    'g7-power': 2 ** 5, 'g7-powerrule': 3 + 4, 'g7-linear': 12 / 3, 'g7-function': 2 * 3 + 1,
    'g7-isosceles': 180 - 2 * 40, 'g7-parallel': 70, 'g7-system': (10 + 2) / 2,
    'g4-sub': 5000 - 1876, 'g4-perimeter': 4 * 7, 'g6-decdiv': 4.8 / 0.6, 'g6-circlearea': 3 ** 2,
    'g7-brackets': (4 + 6) / 2, 'g7-yaxis': 4,
    'g8-sqrt': Math.sqrt(144), 'g8-sqrt18': Math.sqrt(18 / 2), 'g8-quad': Math.min(...[2, 3].filter((x) => x * x - 5 * x + 6 === 0)),
    'g8-disc': 2 ** 2 - 4 * 1 * -3, 'g8-square': (-3) ** 2, 'g8-pyth': Math.hypot(6, 8), 'g8-parangle': 180 - 70,
    'g8-quadsum': 360, 'g8-paarea': 9 * 4,
    'g9-prog': 3 + 4 * 4, 'g9-sum': (10 * 11) / 2, 'g9-vieta': 5, 'g9-vertex': 4 / 2, 'g9-zero': Math.sqrt(9),
    'g9-sin': Math.sin(Math.PI / 6), 'g9-radian': 2, 'g9-similar': 10 * 2, 'g9-inscribed': 80 / 2, 'g9-die': 2 / 6,
    'g10-log2': Math.log2(8), 'g10-log3': Math.log(81) / Math.log(3), 'g10-exp': Math.log2(32), 'g10-geom': 2 * 3 ** 2,
    'g10-tg': Math.tan(Math.PI / 4), 'g10-sinx': 90, 'g10-prob': 3 / 5, 'g10-fact': 4 * 3 * 2 * 1,
    'g10-edges': 12, 'g10-surface': 6 * 2 ** 2,
  };
  for (const [id, value] of Object.entries(expected)) {
    const item = MATH_ITEMS.find((entry) => entry.id === id);
    assert.ok(item, id);
    assert.ok(Math.abs(Number(String(item.answer).includes('/') ? item.answer.split('/')[0] / item.answer.split('/')[1] : item.answer) - value) < 1e-9, `${id}: ${item.answer} ≠ ${value}`);
  }
  assert.equal(MATH_ITEMS.find((item) => item.id === 'g7-square').options[0], 'x² + 6x + 9');
  assert.equal(MATH_ITEMS.find((item) => item.id === 'g6-quadrant').options[3], 'IV');
  assert.equal(MATH_ITEMS.find((item) => item.id === 'g6-circle').options[0], '2πr');
  assert.equal(MATH_ITEMS.find((item) => item.id === 'g2-square').correct, 0);
  assert.equal(MATH_ITEMS.find((item) => item.id === 'g8-ineq').options[0], 'x > 3');
  assert.equal(MATH_ITEMS.find((item) => item.id === 'g8-fraction').options[0], 'x + 3');
  assert.equal(MATH_ITEMS.find((item) => item.id === 'g9-ineq').options[0], '−2 < x < 2');
  assert.equal(MATH_ITEMS.find((item) => item.id === 'g10-domain').options[0], 'x ≥ 2');
  // x² − 5x + 6 = 0 ildizlari 2 va 3; x² − 4 < 0 → (−2; 2); 2x − 6 > 0 → x > 3.
  assert.ok([-1, 0, 1].every((x) => x * x - 4 < 0) && !(2 * 2 - 4 < 0) && 2 * 4 - 6 > 0 && !(2 * 3 - 6 > 0));
});

function runAttempt(grade, correctFn, { seed = 99 } = {}) {
  const plan = getPlan(grade);
  const queue = buildQueue(MATH_ITEMS, plan, seed);
  const responses = queue.map((id, index) => {
    const item = MATH_ITEMS.find((entry) => entry.id === id);
    const correct = correctFn(item, index);
    return buildResponse({ item, lang: 'uz', correct, skipped: false, answerText: '1', answerTimeMs: 5000 });
  });
  return buildResult({ studentGrade: grade, plan, responses, startedAt: '2026-10-28T10:00:00.000Z', completedAt: '2026-10-28T10:03:10.000Z', lang: 'uz' });
}

test('natija: LMS (ingliz) kalitlari saqlangan, placementLevel satr', () => {
  const result = runAttempt(7, (_, i) => i > 0);
  for (const key of ENGLISH_RESULT_KEYS) assert.ok(key in result, `natijada ${key} yo‘q`);
  for (const key of ENGLISH_RESPONSE_KEYS) assert.ok(key in result.responses[0], `javobda ${key} yo‘q`);
  assert.equal(result.placementLevel, 'grade_6');
  assert.equal(result.recommendedCourse, 'grade_6');
  assert.equal(typeof result.placementLevel, 'string');
  assert.equal(result.completionType, 'FULL_PLACEMENT');
  assert.equal(result.borderlineWith, null);
  assert.equal(result.openGrade, 6);
  assert.equal(result.perfectScore, false);
  assert.equal(result.durationSec, 190);
  same(Object.keys(result.flags).sort(), ['audioError', 'inconsistency', 'startInconsistent', 'tooFastCount']);
  same(Object.keys(result.skillStats), DOMAIN_IDS);
  assert.equal(result.totalQuestions, result.answeredCount);
});

test('natija: baza darajasi va mavzu holati', () => {
  assert.equal(runAttempt(9, () => true).baseLevel, 'strong');
  assert.equal(runAttempt(9, (_, i) => i < 6).baseLevel, 'partial');
  assert.equal(runAttempt(9, () => false).baseLevel, 'weak');
  const none = runAttempt(5, () => false);
  assert.ok(Object.values(none.skillStats).every((stat) => stat.total === 0 || stat.status === 'unknown'));
  assert.equal(none.placementLevel, 'grade_4', '0% bo‘lsa ham bitta past sinf: 5-sinf → 4');
  const all = runAttempt(5, () => true);
  assert.ok(Object.values(all.skillStats).every((stat) => stat.total === 0 || stat.status === 'know'));
  assert.equal(all.confidence, 'high');
  const mixed = runAttempt(11, (item) => item.domain !== 'geometry');
  assert.equal(mixed.skillStats.geometry.status, 'unknown');
  const sixOfTen = runAttempt(11, (_, i) => i < 6);
  assert.equal(sixOfTen.baseLevel, 'partial');
  assert.equal(sixOfTen.confidence, 'medium');
});

test('ochiladigan sinf: 1–11-sinfda 1 past (kamida 1), faqat 100% bo‘lsa o‘z sinfida', () => {
  for (let grade = 1; grade <= 11; grade += 1) {
    const below = Math.max(1, grade - 1);
    const perfect = runAttempt(grade, () => true);
    assert.equal(perfect.placementLevel, `grade_${grade}`, `${grade}-sinf 100%`);
    assert.equal(perfect.openGrade, grade);
    assert.equal(perfect.perfectScore, true);
    const oneWrong = runAttempt(grade, (_, i) => i !== 0);
    assert.equal(oneWrong.placementLevel, `grade_${below}`, `${grade}-sinf bitta xato`);
    assert.equal(oneWrong.openGrade, below);
    assert.equal(oneWrong.perfectScore, false);
    assert.equal(runAttempt(grade, () => false).placementLevel, `grade_${below}`, `${grade}-sinf 0%`);
  }
  // 1–4-sinf: 4 → 3, 3 → 2, 2 → 1, 1 → 1 (bitta xatoda); hammasi to‘g‘ri bo‘lsa o‘z sinfi.
  same([1, 2, 3, 4].map((g) => runAttempt(g, (_, i) => i !== 0).openGrade), [1, 1, 2, 3]);
  same([1, 2, 3, 4].map((g) => runAttempt(g, () => true).openGrade), [1, 2, 3, 4]);
  // “Bilmayman” xato hisoblanadi: 100% emas.
  const plan = getPlan(8);
  const queue = buildQueue(MATH_ITEMS, plan, 3);
  const responses = queue.map((id, index) => buildResponse({
    item: MATH_ITEMS.find((entry) => entry.id === id), lang: 'uz', correct: index !== 2, skipped: index === 2, answerText: '1', answerTimeMs: 4000,
  }));
  assert.equal(buildResult({ studentGrade: 8, plan, responses, startedAt: null, completedAt: null, lang: 'uz' }).placementLevel, 'grade_7');
});

test('sessiyani tiklash faqat tugamagan, mos sinfli, ma’lum savollar uchun', () => {
  const itemMap = new Map(MATH_ITEMS.map((item) => [item.id, item]));
  const plan = getPlan(5);
  const queue = buildQueue(MATH_ITEMS, plan, 5);
  const base = { ...createInitialSession(5, 5), phase: 'quiz', plan, queue, responses: [] };
  assert.ok(isRestorableSession(base, itemMap, 5));
  assert.ok(isRestorableSession(base, itemMap, null));
  assert.ok(!isRestorableSession(base, itemMap, 6), 'sinf mos emas');
  assert.ok(!isRestorableSession({ ...base, version: 0 }, itemMap, 5));
  assert.ok(!isRestorableSession({ ...base, phase: 'result' }, itemMap, 5));
  assert.ok(!isRestorableSession({ ...base, queue: ['yo‘q-id'] }, itemMap, 5));
  assert.ok(!isRestorableSession(null, itemMap, 5));
  const finished = queue.map((id) => ({ itemId: id }));
  assert.ok(!isRestorableSession({ ...base, responses: finished }, itemMap, 5));
});

test('sinf qiymatini tekshirish', () => {
  assert.equal(normalizeGrade('5'), 5);
  assert.equal(normalizeGrade(11), 11);
  for (const bad of [0, 12, '', null, undefined, 'abc', 4.5]) assert.equal(normalizeGrade(bad), null, String(bad));
});

test('fayl yagona: faqat react import qilinadi, boshqa lokal/tashqi modul yo‘q', () => {
  const imports = [...source.matchAll(/^import .* from ["'](.+)["'];?$/gm)].map((match) => match[1]);
  same(imports, ['react']);
  assert.ok(!/require\(|import\(/.test(source));
});

test('rasmlar: ART va DECOR dagi hamma fayl public/art da bor, INLINE_ART bo‘sh joyi mavjud', () => {
  assert.ok(source.includes('const INLINE_ART = {};'), 'build:lms uchun belgi');
  const names = [...new Set([...source.matchAll(/["']((?:icons\/)?[\w-]+\.(?:png|svg))["']/g)].map((match) => match[1]))];
  assert.ok(names.length >= 15, 'rasm nomlari topilmadi');
  for (const name of names) {
    assert.ok(existsSync(new URL(`../public/art/${name}`, import.meta.url)), `public/art/${name} yo‘q`);
  }
});

const mathSegments = (text) => String(text).split('$').filter((_, index) => index % 2 === 1);

test('KaTeX: hamma ifoda (3 tilda, variantlar bilan) qat’iy rejimda to‘g‘ri tahlil qilinadi', () => {
  let count = 0;
  for (const item of MATH_ITEMS) {
    const texts = [...item.q.flatMap(mathSegments), ...(item.optionTex ?? []).flatMap((option) => (Array.isArray(option) ? option : [option]))];
    for (const tex of texts) {
      count += 1;
      assert.doesNotThrow(() => katex.renderToString(tex, { throwOnError: true, strict: 'error' }), `${item.id}: ${tex}`);
    }
  }
  assert.ok(count > 200, `ifodalar kam: ${count}`);
});

test('KaTeX: kasrlar va darajalar savollarda ifoda sifatida yozilgan (oddiy “3/4” emas)', () => {
  const find = (id) => MATH_ITEMS.find((item) => item.id === id);
  for (const id of ['g4-fraction', 'g5-fracadd', 'g6-fracmul', 'g8-fraction', 'g9-radian']) {
    for (const text of find(id).q) assert.ok(mathSegments(text).some((tex) => tex.includes('\\dfrac')), `${id}: kasr \\dfrac bilan emas`);
  }
  for (const id of ['g7-power', 'g8-sqrt', 'g10-log2']) {
    for (const text of find(id).q) assert.ok(mathSegments(text).length >= 1, `${id}: ifoda yo‘q`);
  }
  // Variantlar: ko‘rinish uchun optionTex, LMS ga esa oddiy matn (LaTeX emas) yoziladi.
  for (const item of MATH_ITEMS.filter((entry) => entry.optionTex)) {
    for (const option of item.options) for (const lang of LANGS) assert.ok(!String(Array.isArray(option) ? option[LANGS.indexOf(lang)] : option).includes('\\'), `${item.id}: variantda LaTeX`);
  }
});

test('splitMath va texToPlain (KaTeX yuklanmagandagi zaxira ko‘rinish)', () => {
  same(splitMath('a $x+1$ b'), [{ math: false, value: 'a ' }, { math: true, value: 'x+1' }, { math: false, value: ' b' }]);
  same(splitMath('$5 + 4$ nechaga teng?').map((part) => part.math), [true, false]);
  assert.equal(texToPlain('\\dfrac{3}{4} \\cdot \\dfrac{2}{3}'), '3/4 · 2/3');
  assert.equal(texToPlain('a_1 + \\pi r^2'), 'a₁ + π r²');
  assert.equal(texToPlain('\\sqrt{18} = a\\sqrt{2}'), '√18 = a√2');
  assert.equal(texToPlain('\\sin 30^\\circ'), 'sin 30°');
  assert.equal(texToPlain('0{,}6 + 0{,}25'), '0,6 + 0,25');
  assert.equal(texToPlain('x < -2 \\text{ or } x > 2'), 'x < -2 or x > 2');
});

test('lms/math-placement.lms.jsx manba bilan bir xil (faqat INLINE_ART to‘ldirilgan) va hamma rasm ichida', () => {
  const lmsUrl = new URL('../lms/math-placement.lms.jsx', import.meta.url);
  assert.ok(existsSync(lmsUrl), 'lms fayli yo‘q: npm run build:lms');
  const lms = readFileSync(lmsUrl, 'utf8');
  const emptyArt = 'const INLINE_ART = {};';
  const filled = lms.split('\n').find((line) => line.startsWith('const INLINE_ART = {"'));
  assert.ok(filled, 'INLINE_ART to‘ldirilmagan');
  assert.equal(lms.replace(filled, emptyArt), source, 'LMS fayli eskirgan: npm run build:lms ni qayta ishga tushiring');
  const inlined = Object.keys(JSON.parse(filled.slice('const INLINE_ART = '.length, -1)));
  const used = [...new Set([...source.matchAll(/["']((?:icons\/)?[\w-]+\.(?:png|svg))["']/g)].map((match) => match[1]))];
  same(inlined.sort(), used.sort());
});
