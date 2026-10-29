# Junior — matematika diagnostikasi

Qisqa kirish diagnostikasi (1–11 sinf). Yakuniy mahsulot — **bitta fayl**.

| Fayl | Nima |
|---|---|
| [lms/math-placement.lms.jsx](lms/math-placement.lms.jsx) | **LMS ga yuklanadigan yagona fayl**: savollar, qoidalar, natija, animatsiyalar, ovoz, interfeys va rasmlar (data-URI) hammasi ichida. Faqat `react` kerak. |
| [app/math-placement.jsx](app/math-placement.jsx) | Shu faylning manbasi (rasmlarsiz, `public/art` dan oladi). Tahrirlash shu yerda. |
| `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | Faqat Vercel/mahalliy sinov uchun LMS o‘rnini bosuvchi sahifa. |

Manba o‘zgarsa, `npm run build:lms` bilan LMS faylini yangilang (test eskirganini aniqlaydi).

## Mantiq

O‘quvchi sinfi → sizga mos (ochiladigan) sinf va savollar manbai:

| O‘quvchi sinfi | Ochiladigan sinf | Savollar qaysi sinfdan | Savollar soni |
|---|---|---|---|
| 1 | 1 | 1-sinf | 6 |
| 2 | 1 (100% bo‘lsa 2) | 1–2-sinf | 6 |
| 3 | 2 (100% bo‘lsa 3) | 1–2-sinf | 6 |
| 4 | 3 (100% bo‘lsa 4) | 1–2-sinf | 6 |
| 5 | 4 (100% bo‘lsa 5) | 4-sinf | 7 |
| 6 | 5 (100% bo‘lsa 6) | 5-sinf | 7 |
| 7 | 6 (100% bo‘lsa 7) | 6-sinf | 8 |
| 8 | 7 (100% bo‘lsa 8) | 7-sinf | 8 |
| 9 / 10 / 11 | 8 / 9 / 10 (100% bo‘lsa o‘z sinfi) | 8 / 9 / 10-sinf | 10 |

- **Ochiladigan sinf (1–11-sinf, bir xil qoida):** o‘z sinfidan bitta past (kamida 1-sinf). Faqat hammasiga to‘g‘ri javob (100%) bersa o‘z sinfi ochiladi; bitta xato yoki “Bilmayman” ham 100% ni buzadi.
- Savollar: 5–11-sinf uchun faqat bitta pastdagi sinfdan (8-sinf → 7-sinf savollari); 1–4-sinf uchun 1–2-sinfdan.
- Faqat qisqa savol va qisqa javob (son yoki 4 variantli tanlov). ≈3 daqiqa.
- Maqsad aniqlik emas — baza bor-yo‘qligini ko‘rish. Ochiladigan sinf qoidadan keladi; natija uni faqat 100% holatida o‘z sinfiga ko‘taradi.
- Natija: to‘g‘ri javoblar, baza darajasi (`strong` ≥70%, `partial` ≥40%, `weak`), mavzular bo‘yicha “biladi / qisman / bilmaydi”.
- Savollar sinf o‘sish tartibida, mavzular xilma-xil, urug‘ (`attemptSeed`) bo‘yicha aniq takrorlanadi.

## LMS shartnomasi (ingliz tili diagnostikasidagi mexanizm bo‘yicha)

```jsx
<MathPlacement
  lang="uz"                 // "uz" | "ru" | "en"
  studentGrade={9}          // 1–11. Bermasa, o‘quvchi o‘zi tanlaydi
  studentName="Aziza"       // ixtiyoriy
  storageKey="math-placement-v1"   // localStorage kaliti (sessiya tiklash)
  attemptSeed={undefined}   // ixtiyoriy
  itemBank={undefined}      // ixtiyoriy, standart — ichki 82 ta savol
  assetBase="/art"          // rasmlar manzili (standart "/art")
  katex={undefined}         // ixtiyoriy: KaTeX nusxasi; bo‘lmasa window.katex yoki CDN (katexBase)
  onHome={() => {}}
  onProgress={(e) => {}}    // { status: "in_progress"|"complete"|"incomplete", answeredCount, responses, phase, response?, reasonCode? }
  onComplete={(result) => {}} // natija ekrani chiqqanda BIR marta; erta chiqishda chaqirilmaydi
/>
```

`result` kalitlari ingliz tilidagi bilan bir xil: `placementLevel`, `recommendedCourse` (satr, masalan `"grade_5"`), `confidence`, `borderlineWith`,
`answeredCount`, `totalQuestions`, `score`, `levelStats`, `skillStats`, `completionType` (`"FULL_PLACEMENT"`), `flags`, `responses`.
Matematikaga xos qo‘shimchalar: `studentGrade`, `openGrade` (son), `perfectScore`, `questionGrades`, `baseLevel`, `accuracy`, `lang`, `startedAt`, `completedAt`, `durationSec`, `engineVersion`.

Komponent faqat brauzerda ishlaydi (`localStorage`, `window`): serverda render qilinmasin yoki mount’dan keyin chiqarilsin.

## Dizayn va rasmlar

- Uslub Junior platformasiga mos: to‘q sariq `#fe5b1a`, Roboto, pill tugmalar, 28px yumaloq kartalar, to‘q sariq “hero” karta.
- Hamma ekran bitta viewportga sig‘adi (siljishsiz). **Kirish:** chapda to‘q sariq karta (salom, 3 ta qisqa qoida birin-ketin paydo bo‘ladi, maskot), o‘ngda animatsion sinf tanlash (kartochkalar, tanlanganda ✓ va to‘lqin, savollar soni darhol ko‘rinadi). **Test:** yuqorida yupqa progress, bitta fokusli karta (savol + javob; yonida maskot), pastki qatorda “Bilmayman” chapda va “Tekshirish” o‘ngda. **Natija:** 2 ustun. Telefonda bir ustun; hamma element ekran o‘lchamiga qarab kichrayadi. Keng ekranda yon bo‘shliqlarda 3D bezaklar.
- Rasmlar: `public/art/mascot-*.png` (pozalar: waving, think, thumbs, celebrate, point, reading, trophy, checklist, books), bezaklar (cube, pyramid, orb, chart, shuffle, books, sparkles, crown), `icons/*.svg`. Rasm nomlari faylda `ART` va `DECOR` ro‘yxatlarida.
- `assetBase` prop (standart `"/art"`) rasmlar manzilini beradi. Rasm yuklanmasa zaxira maskot (inline SVG) ko‘rsatiladi, bezaklar yashiriladi.

## Matematik ifodalar (KaTeX)

Savollarda ifodalar `$…$` ichida yoziladi (masalan `$\dfrac{3}{4} \cdot \dfrac{2}{3}$`) va KaTeX bilan chiziladi: kasrlar, darajalar, ildizlar, indekslar, logarifm va hokazo. Savol matnidagi so‘zlar birin-ketin paydo bo‘ladi, ifodalar esa rangli “tabletka” ichida sakrab chiqadi.

KaTeX manbasi (ustuvorlik tartibida): `katex` prop → `window.katex` → pinlangan CDN (`katexBase`, standart `https://cdn.jsdelivr.net/npm/katex@0.19.1/dist`, SRI hash bilan). Hech biri bo‘lmasa ifodalar oddiy Unicode matn bo‘lib chiqadi (3/4, x², √18) va test to‘xtamaydi.
LMS CDN ga chiqa olmasa: KaTeX ni o‘zingiz xosting qilib `katexBase` bering yoki `window.katex` ni oldindan yuklang. Yangi savol yozilganda `npm test` hamma ifodani KaTeX bilan qat’iy rejimda tekshiradi.

## LMS uchun yagona fayl

```bash
npm run build:lms     # → lms/math-placement.lms.jsx
```

`public/art` dagi ishlatiladigan rasmlar data-URI qilib `INLINE_ART` ichiga joylanadi (≈550 KB). Natijaviy fayl faqat `react` ga tayanadi, rasm hostingi shart emas. Ifodalar uchun KaTeX yuqoridagi tartibda olinadi.
Agar LMS rasmlarni o‘zi xosting qilsa, `app/math-placement.jsx` ni (≈90 KB) `assetBase` bilan ishlating.

## Ishga tushirish

```bash
npm install
npm run dev          # http://localhost:3000   (Node 22+)
npm run build && npm start
```

Mahalliy sinov sahifasi: `?lang=ru&grade=5` (sinf bermasangiz tanlash ekrani chiqadi), `?embed=1` — panelsiz. Yuqoridagi “Callback’lar” tugmasi `onProgress/onComplete` ma’lumotlarini ko‘rsatadi.

## Tekshiruvlar

```bash
npm test                         # birlik testlar (bank, qoidalar, javoblar, natija kontrakti)
npm run lint
node tests/browser-check.mjs     # haqiqiy Chrome’da to‘liq oqim (avval server ishga tushirilgan bo‘lishi kerak)
node tests/fit-check.mjs         # barcha ekranlar 1920×913 … 390×844 gacha bitta viewportga sig‘ishini o‘lchaydi
```

## Vercel

Ko‘rinishni Vercel’da ko‘rish va tekshirish: GitHub repozitoriyni Vercel’da **Add New → Project** orqali import qiling (framework Next.js avtomatik, `vercel.json`: `npm ci` + `npm run build`, Node 22). Ochilgan sahifa — LMS sinov paneli bilan diagnostika: yuqorida til (UZ/RU/EN), `studentGrade` tanlash, “Qayta boshlash” va `onProgress/onComplete` ma’lumotlari (“Callback’lar”). `?embed=1` — panelsiz sof ko‘rinish, `?lang=ru&grade=5` — tayyor sozlamalar bilan.
Loyiha serverga ehtiyoj sezmaydi (baza, API, muhit o‘zgaruvchilari yo‘q).
