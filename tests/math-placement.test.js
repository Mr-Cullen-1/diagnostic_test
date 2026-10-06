import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../app/math-placement.jsx', import.meta.url), 'utf8');
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const { banks, isTrueEquality, answersMatch, getResult } = runInNewContext(`
  ${section('const mathTestItems14', 'const LESSON_ID')}
  const MIN_DOMAIN_ITEMS = 3;
  ${section('const EQ_OPS', 'const STAGE_CSS')}
  ${section('const ANSWER_UNITS', 'function InputScreen')}
  ${section('const MAX_SCHOOL_GRADE', 'function ExitDialog')}
  ({ banks: [mathTestItems14, mathTestItems58, mathTestItems911], isTrueEquality, answersMatch, getResult })
`);

const languages = ['uz', 'ru', 'en'];

test('all three mathematics banks have 20 complete and usable items', () => {
  assert.equal(banks.flat().length, 60);
  assert.equal(new Set(banks.flat().map((item) => item.id)).size, 60);
  for (const bank of banks) {
    assert.equal(bank.length, 20);
    for (const item of bank) {
      assert.match(item.id, /^g\d+-/);
      assert.equal(Number(item.id.match(/^g(\d+)-/)[1]), item.grade);
      for (const lang of languages) {
        const content = item[lang];
        assert.ok(content?.skill && content?.question && content?.correctText, `${item.id}/${lang} text`);
        if (item.type === 'choice') {
          assert.equal(content.options.length, 4, `${item.id}/${lang} options`);
          assert.equal(new Set(content.options).size, 4, `${item.id}/${lang} distinct options`);
          assert.ok(content.options.includes(content.answer), `${item.id}/${lang} answer`);
          assert.equal(content.wrong.length, 4, `${item.id}/${lang} feedback`);
        } else if (item.type === 'number' || item.type === 'text') {
          assert.ok(content.answer && content.wrongText, `${item.id}/${lang} input`);
        } else if (item.type === 'sequence' || item.type === 'equation') {
          assert.equal(content.tokens.length, content.expected.length, `${item.id}/${lang} tokens`);
          assert.equal([...content.tokens].sort().join('|'), [...content.expected].sort().join('|'), `${item.id}/${lang} expected tokens`);
          if (item.type === 'equation') assert.ok(isTrueEquality(content.expected), `${item.id}/${lang} equation`);
        } else if (item.type === 'match') {
          assert.equal(content.pairs.length, content.answers.length, `${item.id}/${lang} pairs`);
          assert.equal(new Set(content.pairs.map((pair) => pair.right)).size, content.pairs.length, `${item.id}/${lang} unique matches`);
          assert.equal([...content.pairs.map((pair) => pair.right)].sort().join('|'), [...content.answers].sort().join('|'), `${item.id}/${lang} match answers`);
        } else {
          assert.fail(`${item.id} unsupported type: ${item.type}`);
        }
      }
    }
  }
});

test('mathematical answers accept equivalent numeric forms but reject wrong values', () => {
  assert.ok(answersMatch('3,60', '3,6'));
  assert.ok(answersMatch('4/5', '0,8'));
  assert.ok(answersMatch('x=10', '10'));
  assert.ok(answersMatch('−2', '-2'));
  assert.ok(!answersMatch('3/0', '3'));
  assert.ok(!answersMatch('2/5', '3/5'));
  assert.ok(isTrueEquality(['57', '=', '31', '+', '26']));
  assert.ok(!isTrueEquality(['57', '=', '31', '+', '25']));
});

test('placement handles full mastery and an unmastered first grade', () => {
  const answersFor = (items, firstGradeWrong = false) => Object.fromEntries(items.map((item, index) => [index + 1, {
    itemId: item.id, grade: item.grade, domain: item.domain,
    correct: !firstGradeWrong || item.grade !== items[0].grade,
  }]));
  assert.equal(getResult(answersFor(banks[0]), banks[0]).openGrade, 5);
  assert.equal(getResult(answersFor(banks[1]), banks[1]).openGrade, 9);
  const topBand = getResult(answersFor(banks[2]), banks[2]);
  assert.equal(topBand.openGrade, 11);
  assert.equal(topBand.atTopGrade, true);
  assert.equal(getResult(answersFor(banks[0], true), banks[0]).openGrade, 1);
  const upperBandGap = getResult(answersFor(banks[1], true), banks[1]);
  assert.equal(upperBandGap.openGrade, null);
  assert.equal(upperBandGap.needsLowerBand, true);
});
