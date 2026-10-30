# Junior — matematika diagnostikasi

Qisqa kirish diagnostikasi (1–11 sinf). Yakuniy mahsulot — **bitta fayl**.

| Fayl | Nima |
|---|---|
| [lms/math-placement.lms.jsx](lms/math-placement.lms.jsx) | **LMS ga yuklanadigan yagona fayl**: savollar, qoidalar, natija, animatsiyalar, ovoz, interfeys va rasmlar (data-URI) hammasi ichida. Faqat `react` kerak. |
| [app/math-placement.jsx](app/math-placement.jsx) | Shu faylning manbasi (rasmlarsiz, `public/art` dan oladi). Tahrirlash shu yerda. |
| `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | Faqat Vercel/mahalliy sinov uchun LMS o‘rnini bosuvchi sahifa. |

Manba o‘zgarsa, `npm run build:lms` bilan LMS faylini yangilang (test eskirganini aniqlaydi).

## Mantiq

O‘quvchi sinfi → savollar manbai → sizga mos (ochiladigan) sinf:

| O‘quvchi sinfi | Savollar qaysi sinfdan | Savollar soni | ≥ 90% bo‘lsa | Aks holda |
|---|---|---|---|---|
| 1 | **test yo‘q** | 0 | 1-sinf (darslar) | — |
| 2 | 1 | 6 | 2 | 1 |
| 3 | 2 | 6 | 3 | 2 |
| 4 | 2–3 | 6 | 4 | 3 |
| 5 | 4 | 7 | 5 | 4 |
| 6 | 5 | 7 | 6 | 5 |
| 7 | 6 | 8 | 7 | 6 |
| 8 | 7 | 8 | 8 | 7 |
| 9 | 8 | 10 | 9 | 8 |
| 10 | 9 | 10 | 10 | 9 |
| 11 | 10 | 10 | 11 | 10 |

- **Qoida (hamma sinfda bir xil):** savollar doim bitta past sinfdan. To‘g‘ri javoblar **≥ 90%** bo‘lsa o‘z sinfi, aks holda bitta past sinf (kamida 1) ochiladi. “Bilmayman” xato hisoblanadi.
  Natijasi: 10 ta savolli testda (9–11-sinf) **1 ta xato mumkin**; 6–8 ta savolli testda (2–8-sinf) o‘z sinfi uchun **hammasi to‘g‘ri** bo‘lishi kerak (5/6 = 83%, 6/7 = 86%, 7/8 = 87,5% — 90% dan past). Chegara `OWN_GRADE_THRESHOLD` da.
- **Natijada tushuntirish:** sinf pasaytirilganda “Avval N-sinf mavzularini mustahkamlab olamiz” deb yoziladi (baza darajasi “mustahkam” bo‘lsa ham mantiqiy ko‘rinadi).
- **1-sinf:** savol berilmaydi. “1-sinf uchun test shart emas — darslarni boshlang” oynasi chiqadi, LMS ga tayyor natija yuboriladi (`completionType: "NO_TEST_REQUIRED"`, `placementLevel: "grade_1"`, 0 savol). Bu oyna brauzerda saqlanmaydi: sahifa yangilansa yoki qayta kirilsa, yana odatdagi ochilish ekrani chiqadi.
- **Bir marta o‘tiladi:** tugagan natija brauzerda saqlanadi (`${storageKey}-done`); qayta ochilganda test emas, o‘sha natija ko‘rsatiladi, “Qayta o‘tish” tugmasi yo‘q, `onComplete` qayta chaqirilmaydi. Haqiqiy cheklov (kursni ochish, qayta urinishni bloklash) LMS tomonida. Vercel sinov panelida “Qayta boshlash” yangi urinish boshlaydi.
- **✕ / yopilgan tab:** o‘zgarmagan — tab yopilsa test shu joydan davom etadi; ✕ bosilsa test “tugallanmadi” bo‘ladi (`onComplete` yo‘q), o‘quvchi qayta o‘tishi mumkin. Kursni boshlash uchun diagnostikadan o‘tish shart (LMS qarori).
- **Javob kiritish:** raqam maydoni ostida bir xil o‘lchamdagi belgi tugmalari `−`, `/`, `.`, `,` doim ko‘rinib turadi; harflar qabul qilinmaydi (jimgina olib tashlanadi), 12 belgigacha. Vergul va nuqta teng (`3,5` = `3.5`), `4/5` = `0,8`.
- **Reaksiya:** to‘g‘ri javobdan keyin 1–2 soniyada o‘zi o‘tadi; xato va “Bilmayman”dan keyin o‘tmaydi — o‘quvchi to‘g‘ri javobni o‘qib, “Davom” ni bosadi.
- **Vaqt savollar soniga qarab:** 6–8 ta savol ≈ 3 daqiqa, 10 ta savol ≈ 4 daqiqa (sinf tanlanmaguncha “≈ 3–4”).
- **9–11-sinf — jiddiyroq uslub:** 3‑2‑1 sanoq o‘rniga qisqa to‘q fon va “Boshlaymiz”, konfetti, toj va 3D bezaklarsiz, ranglar o‘zgarmaydi, maskot xotirjam pozalarda.
- **Ovoz:** yuqori o‘ng burchakda yoqish/o‘chirish tugmasi (standart — yoqiq, tanlov brauzerda saqlanadi). Tugma ham ovozli o‘qishni, ham signallarni boshqaradi.
- **Ovozli o‘qish (dars fayllaridagi kabi, qisqa va aniq):** ochilish ekrani (sinf, savollar soni, “Bilmayman”), har bir savol matni, javobdan keyin qisqa xabar (xato/“Bilmayman”da to‘g‘ri javob ham), natija (ball, sizga mos sinf, izoh), 1-sinf va “tugallanmadi” ekrani. Variantlar o‘qilmaydi. Savol kartasidagi “Eshitish” tugmasi gapni qayta o‘qiydi (ovoz o‘chiq bo‘lsa ham). Yangi gap eskisini to‘xtatadi; to‘g‘ri javobdan keyin keyingi savolga o‘tilsa gap to‘xtaydi.
  - Sonlar so‘z bilan aytiladi (uz/ru), amallar nomi bilan (“karra”, “qo‘shuv”, “bo‘lingan”), KaTeX ifodalari gapga aylanadi: kasr (“ikkidan bir”), o‘nli kasr, ildiz, daraja, logarifm, indeks, modul, trigonometriya, `x` → “iks”. Ruscha oddiy matnda butun sonlar raqam bo‘lib qoladi (ovoz kelishikni o‘zi to‘g‘ri aytadi). O‘zbekcha qisqartmalar (sm, km, m…) to‘liq so‘z bo‘ladi.
  - Manba: `ttsApiBase` berilsa `GET {ttsApiBase}/api/tts?text=[til belgisi] …&g=m` (dars fayllaridagi bilan bir xil server), bo‘lmasa brauzer `speechSynthesis`. Brauzer birinchi bosishgacha ovozni bloklasa, birinchi bosish/tugmadan keyin davom etadi.
- Faqat qisqa savol va qisqa javob (son yoki 4 variantli tanlov). Maqsad aniqlik emas — baza bor-yo‘qligini ko‘rish.
- Natija: to‘g‘ri javoblar, baza darajasi (`strong` ≥70%, `partial` ≥40%, `weak`), mavzular bo‘yicha “biladi / qisman / bilmaydi” (mavzuga 1–3 savol to‘g‘ri keladi, shuning uchun “qisman” faqat 2+ savolli mavzuda bo‘ladi).
- Savollar sinf o‘sish tartibida, mavzular xilma-xil, urug‘ (`attemptSeed`) bo‘yicha aniq takrorlanadi.

## LMS shartnomasi (ingliz tili diagnostikasidagi mexanizm bo‘yicha)

```jsx
<MathPlacement
  lang="uz"                 // "uz" | "ru" | "en"
  studentGrade={9}          // 1–11. Bermasa, o‘quvchi o‘zi tanlaydi
  studentName="Aziza"       // ixtiyoriy
  storageKey="math-placement-v1"   // localStorage kaliti (sessiya tiklash)
  attemptSeed={undefined}   // ixtiyoriy
  itemBank={undefined}      // ixtiyoriy, standart — ichki 93 ta savol
  assetBase="/art"          // rasmlar manzili (standart "/art")
  katex={undefined}         // ixtiyoriy: KaTeX nusxasi; bo‘lmasa window.katex, u ham bo‘lmasa katexBase (ixtiyoriy manzil), u ham bo‘lmasa oddiy matn
  ttsApiBase="https://…"    // ixtiyoriy: ovoz serveri (dars fayllaridagi ttsApiBase); bo‘lmasa brauzer ovozi
  onHome={() => {}}
  onProgress={(e) => {}}    // { status: "in_progress"|"complete"|"incomplete", answeredCount, responses, phase, response?, reasonCode? }
  onComplete={(result) => {}} // natija ekrani chiqqanda BIR marta; erta chiqishda chaqirilmaydi; 1-sinfda test o‘rniga tayyor natija
  onFinished={(payload) => {}} // “Yakunlash” / “Darslarni boshlash” bosilganda BIR marta: { lessonId, lessonTitle, durationSec, ...result }; ✕ dan keyin completionType: "INCOMPLETE"
/>
```

`result` kalitlari ingliz tilidagi bilan bir xil: `placementLevel`, `recommendedCourse` (satr, masalan `"grade_5"`), `confidence`, `borderlineWith`,
`answeredCount`, `totalQuestions`, `score`, `levelStats`, `skillStats`, `completionType` (`"FULL_PLACEMENT"` yoki 1-sinfda `"NO_TEST_REQUIRED"`), `flags`, `responses`.
Matematikaga xos qo‘shimchalar: `studentGrade`, `openGrade` (son), `perfectScore` (hammasi to‘g‘ri), `ownGradeUnlocked` (≥ 90%, o‘z sinfi ochildi), `ownGradeThreshold`, `questionGrades`, `baseLevel`, `accuracy`, `lang`, `startedAt`, `completedAt`, `durationSec`, `engineVersion`.

Komponent faqat brauzerda ishlaydi (`localStorage`, `window`): serverda render qilinmasin yoki mount’dan keyin chiqarilsin.

## Dizayn va rasmlar

- Uslub Junior platformasiga mos: to‘q sariq `#fe5b1a`, Roboto, pill tugmalar, 28px yumaloq kartalar, to‘q sariq “hero” karta.
- Hamma ekran bitta viewportga sig‘adi (siljishsiz). **Kirish:** chapda to‘q sariq karta (salom, 3 ta qisqa qoida birin-ketin paydo bo‘ladi, maskot), o‘ngda animatsion sinf tanlash (kartochkalar, tanlanganda ✓ va to‘lqin, savollar soni darhol ko‘rinadi). **Test:** yuqorida yupqa progress, bitta fokusli karta (savol + javob; yonida maskot), pastki qatorda “Bilmayman” chapda va “Tekshirish” o‘ngda. **Natija:** 2 ustun. Telefonda bir ustun; hamma element ekran o‘lchamiga qarab kichrayadi. Keng ekranda yon bo‘shliqlarda 3D bezaklar.
- Rasmlar: `public/art/mascot-*.png` (pozalar: waving, think, thumbs, celebrate, point, reading, trophy, checklist, books), bezaklar (cube, pyramid, orb, chart, shuffle, books, sparkles, crown), `icons/*.svg`. Rasm nomlari faylda `ART` va `DECOR` ro‘yxatlarida.
- `assetBase` prop (standart `"/art"`) rasmlar manzilini beradi. Rasm yuklanmasa zaxira maskot (inline SVG) ko‘rsatiladi, bezaklar yashiriladi.

## Matematik ifodalar (KaTeX)

Savollarda ifodalar `$…$` ichida yoziladi (masalan `$\dfrac{3}{4} \cdot \dfrac{2}{3}$`) va KaTeX bilan chiziladi: kasrlar, darajalar, ildizlar, indekslar, logarifm va hokazo. Savol matnidagi so‘zlar birin-ketin paydo bo‘ladi, ifodalar esa rangli “tabletka” ichida sakrab chiqadi.

KaTeX manbasi (ustuvorlik tartibida): `katex` prop → `window.katex` → `katexBase` (ixtiyoriy, masalan `https://cdn.jsdelivr.net/npm/katex@0.19.1/dist` — shu versiyaga SRI hash qo‘yiladi). **Standart holatda komponent hech qanday tashqi manzil yuklamaydi**; KaTeX bo‘lmasa ifodalar oddiy Unicode matn bo‘lib chiqadi (3/4, x², √18) va test to‘xtamaydi. Sinov sahifasi `katex` ni npm dan prop sifatida beradi.
LMS da chiroyli formulalar kerak bo‘lsa: `katex` prop bering yoki sahifaga `window.katex` ni oldindan yuklang. Yangi savol yozilganda `npm test` hamma ifodani KaTeX bilan qat’iy rejimda tekshiradi.

## LMS uchun yagona fayl

```bash
npm run build:lms     # → lms/math-placement.lms.jsx
```

`public/art` dagi ishlatiladigan rasmlar WebP ga o‘tkazilib data-URI qilib `INLINE_ART` ichiga joylanadi (≈350 KB; asl PNG lar tegilmaydi). Natijaviy fayl faqat `react` ga tayanadi, rasm hostingi shart emas.

**LMS fayliga qo‘yilgan talablar** (ingliz tili diagnostikasi va Dars06 kabi xatosiz ishlayotgan fayllardan olingan; `tests/lms-compat.test.js` tekshiradi): bitta `export default` funksiya va boshqa eksport yo‘q; `"use client"` yo‘q; importlar faqat `react` (ruxsat etilganlar: react, framer-motion, lucide-react, @lesson/runtime); kodda tashqi manzil (http/https) yo‘q; CSS shablonida teskari chiziq, backtick, `${…}` va `@import` yo‘q (shrift Roboto xost sahifadan keladi); fayl hajmi ≤ 400 KB.
Agar LMS rasmlarni o‘zi xosting qilsa, `app/math-placement.jsx` ni (≈90 KB) `assetBase` bilan ishlating.

## Ishga tushirish

```bash
npm install
npm run dev          # http://localhost:3000   (Node 22+)
npm run build && npm start
```

Mahalliy sinov sahifasi: `?lang=ru&grade=5` (sinf bermasangiz tanlash ekrani chiqadi), `?embed=1` — panelsiz, `?tts=https://…` — ovoz serveri (`ttsApiBase`). Yuqoridagi “Callback’lar” tugmasi `onProgress/onComplete` ma’lumotlarini ko‘rsatadi.

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
