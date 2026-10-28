// LMS ga yuklash uchun YAGONA, o‘zida hammasi bor fayl yasaydi: public/art dagi ishlatiladigan rasmlar data-URI
// qilib app/math-placement.jsx ichiga joylanadi (INLINE_ART). Natija: lms/math-placement.lms.jsx (git’ga kiradi).
// app/math-placement.jsx yoki public/art o‘zgarsa qayta ishga tushiring: npm run build:lms
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'app', 'math-placement.jsx');
const artDir = join(root, 'public', 'art');
const outPath = join(root, 'lms', 'math-placement.lms.jsx');
const MIME = { png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', jpg: 'image/jpeg' };

const source = readFileSync(sourcePath, 'utf8');
const marker = 'const INLINE_ART = {};';
if (!source.includes(marker)) throw new Error(`"${marker}" topilmadi — manba fayl o‘zgargan.`);

// Rasm nomlari faqat ART va DECOR ro‘yxatlarida yoziladi.
const names = [...new Set([...source.matchAll(/["']((?:icons\/)?[\w-]+\.(?:png|svg|webp|jpg))["']/g)].map((match) => match[1]))];
const inline = {};
let bytes = 0;
for (const name of names) {
  const buffer = readFileSync(join(artDir, name));
  bytes += buffer.length;
  inline[name] = `data:${MIME[name.split('.').pop()]};base64,${buffer.toString('base64')}`;
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, source.replace(marker, `const INLINE_ART = ${JSON.stringify(inline)};`));
console.log(`${names.length} ta rasm (${Math.round(bytes / 1024)} KB) joylandi → ${outPath} (${Math.round(statSync(outPath).size / 1024)} KB)`);
