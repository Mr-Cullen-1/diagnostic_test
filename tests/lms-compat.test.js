import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from '@babel/parser';

// LMS ga yuklanadigan fayl uchun qoidalar. Ular LMS da xatosiz ishlayotgan fayllardan (ingliz tili diagnostikasi, Dars06) olingan:
// bitta default eksport, "use client" yo‘q, faqat ruxsat etilgan importlar, tashqi manzillar yo‘q, CSS shablonida teskari chiziq/backtick yo‘q.
const FILES = {
  'app/math-placement.jsx': new URL('../app/math-placement.jsx', import.meta.url),
  'lms/math-placement.lms.jsx': new URL('../lms/math-placement.lms.jsx', import.meta.url),
};
const ALLOWED_IMPORTS = new Set(['react', 'framer-motion', 'lucide-react', '@lesson/runtime']);
const LMS_SIZE_BUDGET = 400 * 1024;

function walk(node, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}

for (const [name, url] of Object.entries(FILES)) {
  const code = readFileSync(url, 'utf8');
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });

  test(`${name}: JSX sifatida xatosiz parse bo‘ladi; bitta default eksport (funksiya), boshqa eksport yo‘q, "use client" yo‘q`, () => {
    assert.equal(ast.program.directives.length, 0, '"use client" yoki boshqa direktiva bo‘lmasligi kerak');
    const exports = ast.program.body.filter((node) => node.type.startsWith('Export'));
    assert.equal(exports.length, 1, 'faqat bitta eksport bo‘lishi kerak');
    assert.equal(exports[0].type, 'ExportDefaultDeclaration');
    assert.equal(exports[0].declaration.type, 'FunctionDeclaration');
  });

  test(`${name}: faqat ruxsat etilgan importlar`, () => {
    const imports = ast.program.body.filter((node) => node.type === 'ImportDeclaration').map((node) => node.source.value);
    assert.ok(imports.length > 0 && imports.every((source) => ALLOWED_IMPORTS.has(source)), imports.join());
  });

  test(`${name}: kodda tashqi manzil (http/https) va process.env/require yo‘q; CSS shabloni teskari chiziq, backtick va \${…} siz`, () => {
    const literals = [];
    const identifiers = new Set();
    walk(ast.program, (node) => {
      if (node.type === 'StringLiteral') literals.push(node.value);
      if (node.type === 'TemplateElement') literals.push(node.value.cooked ?? '');
      if (node.type === 'Identifier') identifiers.add(node.name);
    });
    const urls = literals.filter((value) => /https?:\/\//.test(value));
    assert.deepEqual(urls, [], 'tashqi manzil topildi');
    assert.ok(!identifiers.has('require') && !identifiers.has('process'), 'require/process ishlatilmasligi kerak');
    let cssChecked = false;
    walk(ast.program, (node) => {
      if (node.type === 'VariableDeclarator' && node.id.name === 'CSS' && node.init?.type === 'TemplateLiteral') {
        cssChecked = true;
        assert.equal(node.init.expressions.length, 0, 'CSS ichida ${…} bo‘lmasin');
        const raw = node.init.quasis.map((part) => part.value.raw).join('');
        assert.ok(!raw.includes('\\'), 'CSS shablonida teskari chiziq bo‘lmasin');
        assert.ok(!raw.includes('`'), 'CSS shablonida backtick bo‘lmasin');
        assert.ok(!raw.includes('@import'), 'CSS da @import bo‘lmasin');
      }
    });
    assert.ok(cssChecked, 'CSS shabloni topilmadi');
  });
}

test(`lms/math-placement.lms.jsx hajmi ${LMS_SIZE_BUDGET / 1024} KB dan oshmasin (LMS yuklash chegarasi noma’lum, ingliz tili fayli bundan ancha kichik)`, () => {
  const size = statSync(FILES['lms/math-placement.lms.jsx']).size;
  assert.ok(size <= LMS_SIZE_BUDGET, `${Math.round(size / 1024)} KB`);
});
