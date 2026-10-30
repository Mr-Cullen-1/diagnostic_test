import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

// Mantiq bloki (sof JS) <logic> belgilari orasidan kesib olinadi.
const source = readFileSync(new URL('../app/math-placement.jsx', import.meta.url), 'utf8');
const logic = source.slice(source.indexOf('// <logic>'), source.indexOf('// </logic>'));
const { MATH_ITEMS, LANGS, toSpeech, questionSpeech, answerSpeech, numberToWords, buildTtsUrl } = runInNewContext(`${logic}
  ({ MATH_ITEMS, LANGS, toSpeech, questionSpeech, answerSpeech, numberToWords, buildTtsUrl })
`);

test('sonlar so‘z bilan: uz va ru', () => {
  assert.equal(numberToWords('0', 'uz'), 'nol');
  assert.equal(numberToWords('14', 'uz'), 'o\'n to\'rt');
  assert.equal(numberToWords('36', 'uz'), 'o\'ttiz olti');
  assert.equal(numberToWords('144', 'uz'), 'bir yuz qirq to\'rt');
  assert.equal(numberToWords('1876', 'uz'), 'bir ming sakkiz yuz yetmish olti');
  assert.equal(numberToWords('21', 'ru'), 'двадцать один');
  assert.equal(numberToWords('2000', 'ru'), 'две тысячи');
  assert.equal(numberToWords('5', 'en'), '5');
});

test('oddiy gaplar: amallar nomi bilan aytiladi', () => {
  assert.equal(toSpeech('$5 + 4$ nechaga teng?', 'uz'), 'besh qo\'shuv to\'rt nechaga teng?');
  assert.equal(toSpeech('Сколько будет $13 - 5$?', 'ru'), 'Сколько будет тринадцать минус пять?');
  assert.equal(toSpeech('What is $24 \\times 5$?', 'en'), 'What is 24 times 5?');
  assert.equal(toSpeech('$36 : 4$', 'uz'), 'o\'ttiz olti bo\'lingan to\'rt');
  assert.equal(toSpeech('$25\\%$', 'uz'), 'yigirma besh foiz');
  assert.equal(toSpeech('$40^\\circ$', 'uz'), 'qirq daraja');
});

test('kasr, o‘nli kasr, ildiz, daraja, logarifm, indeks va modul to‘g‘ri aytiladi', () => {
  assert.equal(toSpeech('$\\dfrac{1}{2} + \\dfrac{1}{3}$', 'uz'), 'ikkidan bir qo\'shuv uchdan bir');
  assert.equal(toSpeech('$0{,}6 + 0{,}25$', 'uz'), 'nol butun o\'ndan olti qo\'shuv nol butun yuzdan yigirma besh');
  assert.equal(toSpeech('$\\dfrac{3}{4}$', 'ru'), 'три четвертых');
  assert.equal(toSpeech('$\\sqrt{144}$', 'uz'), 'bir yuz qirq to\'rtning kvadrat ildizi');
  assert.match(toSpeech('$(x + 3)^2$', 'uz'), /iks qo'shuv uch, hammasining kvadrati/);
  assert.equal(toSpeech('$2^5$', 'uz'), 'ikki ning besh darajasi');
  assert.equal(toSpeech('$\\log_2 8$', 'uz'), 'sakkiz ning ikki asosli logarifmi');
  assert.equal(toSpeech('$a_5$', 'uz'), 'a indeks besh');
  assert.equal(toSpeech('$|-9|$', 'en'), 'absolute value of minus 9');
  assert.equal(toSpeech('$4!$', 'ru'), 'четыре факториал');
  assert.equal(toSpeech('$2x - 6 > 0$', 'uz'), 'ikki iks minus olti katta nol');
  assert.equal(toSpeech('$3 : 5$', 'en'), '3 divided by 5', 'nisbat so‘zi yo‘q — bo‘lish');
  assert.equal(toSpeech('The ratio is $3 : 5$', 'en'), 'The ratio is 3 to 5');
  assert.match(toSpeech('Ikki son nisbati $3 : 5$.', 'uz'), /uch ga besh/);
});

test('matn ichidagi belgilar: tirnoq, tire, apostrof, kasr va o‘nli kasr', () => {
  assert.equal(toSpeech('Bilmasangiz — “Bilmayman” ni bosing', 'uz'), 'Bilmasangiz, Bilmayman ni bosing');
  assert.equal(toSpeech('To‘g‘ri javob: 3/4', 'uz'), 'To\'g\'ri javob, to\'rtdan uch');
  assert.equal(toSpeech('2,5', 'ru'), 'две целых пять десятых');
  assert.equal(toSpeech('Avval 7-sinf mavzularini mustahkamlab olamiz', 'uz'), 'Avval yetti sinf mavzularini mustahkamlab olamiz');
  assert.equal(toSpeech('-3', 'uz'), 'minus uch');
});

test('qisqartmalar, mingliklar va ruscha butun sonlar', () => {
  assert.equal(toSpeech('Stolning uzunligi 2 km 300 m, eni 6 sm.', 'uz'), 'Stolning uzunligi ikki kilometr uch yuz metr, eni olti santimetr.');
  assert.equal(toSpeech('Narx 200 000 so‘m edi', 'uz'), 'Narx ikki yuz ming so\'m edi');
  assert.equal(toSpeech('A product cost 200,000 UZS', 'en'), 'A product cost 200000 UZS');
  assert.equal(toSpeech('Поезд ехал 3 часа со скоростью 60 км/ч.', 'ru'), 'Поезд ехал 3 часа со скоростью 60 километров в час.');
  assert.equal(toSpeech('В каждой коробке по $5$ карандашей. Сколько в 4 коробках?', 'ru'), 'В каждой коробке по пять карандашей. Сколько в 4 коробках?');
  assert.equal(toSpeech('Sizga mos sinf: 7-sinf.', 'uz'), 'Sizga mos sinf, yetti sinf.');
  assert.equal(toSpeech('Teng yonli burchagi $40^\\circ$. Uchidagi burchagi?', 'uz'), 'Teng yonli burchagi qirq daraja. Uchidagi burchagi?');
  assert.equal(toSpeech('$(3; -2)$ nuqta', 'uz'), 'uch, minus ikki, nuqta');
  assert.equal(toSpeech('$a\\sqrt{2}$', 'uz'), 'a ikkining kvadrat ildizi');
});

test('TTS manzili dars fayllari bilan bir xil: til belgisi, qavs belgilari ochiq, erkak ovozi', () => {
  const url = buildTtsUrl('https://tts.example/', 'Salom', 'uz');
  assert.equal(url, 'https://tts.example/api/tts?text=[O\'zbekcha%20tallaffuz]%20Salom&g=m');
  assert.match(buildTtsUrl('/x', 'Привет', 'ru'), /^\/x\/api\/tts\?text=\[Русское%20произношение\]|\[%D0%A0/);
  assert.ok(decodeURIComponent(buildTtsUrl('/x', 'a'.repeat(3000), 'en')).length < 1100, 'matn 1000 belgigacha qisqartiriladi');
});

test('bankdagi hamma savol, to‘g‘ri javob va barcha variantlar uchun ovozli matn bor: qolgan TeX/belgi yoki raqam yo‘q', () => {
  const allowed = /^[\p{L}\s.,!?:'-]+$/u;
  for (const item of MATH_ITEMS) {
    for (const lang of LANGS) {
      const spoken = [questionSpeech(item, lang), answerSpeech(item, lang)];
      // Variant matni (va KaTeX varianti) satr yoki [uz, ru, en] ro‘yxati bo‘lishi mumkin.
      const pick = (value) => (Array.isArray(value) ? value[LANGS.indexOf(lang)] ?? value[0] : value);
      if (item.type === 'choice') item.options.forEach((option, index) => spoken.push(toSpeech(item.optionTex ? `$${pick(item.optionTex[index])}$` : pick(option), lang)));
      for (const text of spoken) {
        assert.ok(text.length >= 1, `${item.id}/${lang}: bo‘sh ovozli matn`);
        if (lang !== 'uz') assert.match(text, /^[\p{L}\p{N}\s.,!?:'-]+$/u, `${item.id}/${lang}: ${text}`);
        else assert.match(text, allowed, `${item.id}/${lang}: ${text}`);
        assert.doesNotMatch(text, /\\|\$|\^|_|\{|\}/, `${item.id}/${lang}: TeX qoldi: ${text}`);
      }
    }
  }
});
