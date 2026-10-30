"use client";

/**
 * Junior — matematika bo‘yicha kirish diagnostikasi (yagona JSX fayl).
 *
 * Bu fayl o‘z ichiga hammasini oladi: savollar, tanlash qoidalari, natija hisobi,
 * animatsiyalar (CSS), interfeys va ovoz. Tashqi bog‘liqlik faqat `react`.
 *
 * Matematik ifodalar KaTeX bilan chiziladi: `katex` prop → window.katex → pinlangan CDN (SRI bilan); bo‘lmasa oddiy matn.
 * Rasmlar: public/art (maskot, bezaklar, ikonkalar) — `assetBase` prop (standart "/art"); `npm run build:lms` ularni
 * data-URI qilib faylga joylaydi. Rasm topilmasa interfeys zaxira ko‘rinishda ishlayveradi.
 *
 * LMS shartnomasi ingliz tili diagnostikasi bilan bir xil:
 *   props:     lang ("uz" | "ru" | "en"), studentGrade (1–11; bermasa o‘quvchi o‘zi tanlaydi),
 *              storageKey, attemptSeed, itemBank, assetBase, katex, katexBase, onHome, onProgress, onComplete
 *              (+ ixtiyoriy studentName). Ingliz tilidagi studentAge o‘rniga studentGrade.
 *   onProgress({ status: "in_progress" | "complete" | "incomplete", answeredCount,
 *                response?, responses, phase, reasonCode? })
 *   onComplete(result)   — natija ekrani chiqqanda bir marta; erta chiqishda chaqirilmaydi
 *   result:    placementLevel, recommendedCourse (satr: "grade_5"), confidence, borderlineWith,
 *              answeredCount, totalQuestions, score, levelStats, skillStats,
 *              completionType, flags, responses  (+ matematikaga xos qo‘shimcha kalitlar)
 *
 * Mantiq (1–11-sinf): ochiladigan sinf — o‘z sinfidan bitta past (kamida 1); hammasiga to‘g‘ri javob bersa
 * o‘z sinfi. Savollar: 1–4-sinf uchun 1–2-sinfdan, 5–11-sinf uchun faqat bitta pastdagi sinfdan (8 → 7).
 * 6–10 ta qisqa savol; maqsad — aniqlik emas, baza bor-yo‘qligini ko‘rish.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// <logic>
const ENGINE_VERSION = "math-placement-v4";
const SESSION_VERSION = 3;
// O‘z sinfi ochilishi uchun kerak bo‘lgan to‘g‘ri javoblar ulushi (≥ 90%). 10 ta savolda 1 ta xato mumkin;
// 6–8 ta savolda esa hammasi to‘g‘ri bo‘lishi kerak.
const OWN_GRADE_THRESHOLD = 0.9;
const SECONDS_PER_QUESTION = 25;
const LANGS = ["uz", "ru", "en"];
const DOMAIN_IDS = ["number", "operations", "fractions", "problems", "measurement", "geometry", "algebra", "functions", "probability"];
const TOO_FAST_MS = 700;
const L = (uz, ru, en) => [uz, ru, en];

// Savol: q — [uz, ru, en]; matematik ifodalar $…$ ichida (KaTeX). number turida answer (satr yoki satrlar ro‘yxati),
// choice turida options (oddiy matn: LMS ga shu yoziladi), optionTex (ixtiyoriy, ko‘rinish uchun) va correct (indeks).
const r = String.raw;
const N = (id, grade, domain, q, answer) => ({ id, grade, domain, type: "number", q, answer });
const C = (id, grade, domain, q, options, correct, optionTex) => ({ id, grade, domain, type: "choice", q, options, correct, optionTex });
const MATH_ITEMS = [
  // ── 1-sinf ──
  N("g1-add", 1, "operations", L(r`$5 + 4$ nechaga teng?`, r`Сколько будет $5 + 4$?`, r`What is $5 + 4$?`), "9"),
  N("g1-sub", 1, "operations", L(r`$13 - 5$ nechaga teng?`, r`Сколько будет $13 - 5$?`, r`What is $13 - 5$?`), "8"),
  N("g1-next", 1, "number", L("14 dan keyingi son qaysi?", "Какое число идёт после 14?", "Which number comes right after 14?"), "15"),
  N("g1-tens", 1, "number", L("3 ta o‘nlik va 4 ta birlikdan iborat son qaysi?", "Какое число состоит из 3 десятков и 4 единиц?", "Which number has 3 tens and 4 ones?"), "34"),
  N("g1-word", 1, "problems", L("Mashada 7 ta olma bor edi. U 3 tasini yedi. Nechta olma qoldi?", "У Маши было 7 яблок. Она съела 3. Сколько яблок осталось?", "Masha had 7 apples. She ate 3. How many apples are left?"), "4"),
  N("g1-shape", 1, "geometry", L("Uchburchakning nechta tomoni bor?", "Сколько сторон у треугольника?", "How many sides does a triangle have?"), "3"),
  N("g1-more", 1, "number", L("9 dan 3 ta ko‘p son qaysi?", "Какое число на 3 больше, чем 9?", "Which number is 3 more than 9?"), "12"),
  N("g1-triple", 1, "operations", L(r`$2 + 2 + 2$ nechaga teng?`, r`Сколько будет $2 + 2 + 2$?`, r`What is $2 + 2 + 2$?`), "6"),
  // ── 2-sinf ──
  N("g2-add", 2, "operations", L(r`$36 + 27$ nechaga teng?`, r`Сколько будет $36 + 27$?`, r`What is $36 + 27$?`), "63"),
  N("g2-sub", 2, "operations", L(r`$52 - 18$ nechaga teng?`, r`Сколько будет $52 - 18$?`, r`What is $52 - 18$?`), "34"),
  N("g2-mul", 2, "operations", L(r`$6 \times 7$ nechaga teng?`, r`Сколько будет $6 \times 7$?`, r`What is $6 \times 7$?`), "42"),
  N("g2-div", 2, "operations", L(r`$36 : 4$ nechaga teng?`, r`Сколько будет $36 : 4$?`, r`What is $36 \div 4$?`), "9"),
  N("g2-boxes", 2, "problems", L("Har bir qutida 5 tadan qalam bor. 4 ta qutida nechta qalam bor?", "В каждой коробке по 5 карандашей. Сколько карандашей в 4 коробках?", "Each box holds 5 pencils. How many pencils are in 4 boxes?"), "20"),
  N("g2-length", 2, "measurement", L("1 metr necha santimetr?", "Сколько сантиметров в 1 метре?", "How many centimetres are in 1 metre?"), "100"),
  C("g2-square", 2, "geometry", L("Qaysi shaklning to‘rtta tomoni ham teng?", "У какой фигуры все четыре стороны равны?", "Which shape has four equal sides?"),
    [L("Kvadrat", "Квадрат", "Square"), L("Uchburchak", "Треугольник", "Triangle"), L("Doira", "Круг", "Circle"), L("Beshburchak", "Пятиугольник", "Pentagon")], 0),
  // ── 3-sinf ──
  N("g3-mul", 3, "operations", L(r`$8 \times 7$ nechaga teng?`, r`Сколько будет $8 \times 7$?`, r`What is $8 \times 7$?`), "56"),
  N("g3-div", 3, "operations", L(r`$72 : 9$ nechaga teng?`, r`Сколько будет $72 : 9$?`, r`What is $72 \div 9$?`), "8"),
  N("g3-add", 3, "operations", L(r`$125 + 278$ nechaga teng?`, r`Сколько будет $125 + 278$?`, r`What is $125 + 278$?`), "403"),
  N("g3-sub", 3, "operations", L(r`$500 - 237$ nechaga teng?`, r`Сколько будет $500 - 237$?`, r`What is $500 - 237$?`), "263"),
  N("g3-remainder", 3, "operations", L("17 ni 5 ga bo‘lganda qoldiq nechaga teng?", "Чему равен остаток при делении 17 на 5?", "What is the remainder when 17 is divided by 5?"), "2"),
  N("g3-perimeter", 3, "geometry", L("To‘g‘ri to‘rtburchakning tomonlari 6 sm va 4 sm. Perimetri necha santimetr?", "Стороны прямоугольника 6 см и 4 см. Чему равен периметр в сантиметрах?", "A rectangle has sides 6 cm and 4 cm. What is its perimeter in centimetres?"), "20"),
  N("g3-time", 3, "measurement", L("2 soat necha daqiqa?", "Сколько минут в 2 часах?", "How many minutes are in 2 hours?"), "120"),
  N("g3-third", 3, "fractions", L(r`$12$ ning $\dfrac{1}{3}$ qismi nechaga teng?`, r`Чему равна $\dfrac{1}{3}$ от $12$?`, r`What is $\dfrac{1}{3}$ of $12$?`), "4"),
  N("g3-share", 3, "problems", L("24 ta daftar 3 ta qutiga teng bo‘lib joylandi. Har bir qutida nechta daftar bor?", "24 тетради разложили поровну в 3 коробки. Сколько тетрадей в каждой коробке?", "24 notebooks are shared equally into 3 boxes. How many notebooks are in each box?"), "8"),
  // ── 4-sinf ──
  N("g4-mul", 4, "operations", L(r`$24 \times 5$ nechaga teng?`, r`Сколько будет $24 \times 5$?`, r`What is $24 \times 5$?`), "120"),
  N("g4-div", 4, "operations", L(r`$840 : 6$ nechaga teng?`, r`Сколько будет $840 : 6$?`, r`What is $840 \div 6$?`), "140"),
  N("g4-fraction", 4, "fractions", L(r`$20$ ning $\dfrac{3}{4}$ qismi nechaga teng?`, r`Чему равны $\dfrac{3}{4}$ от $20$?`, r`What is $\dfrac{3}{4}$ of $20$?`), "15"),
  N("g4-area", 4, "geometry", L("To‘g‘ri to‘rtburchakning tomonlari 8 sm va 5 sm. Yuzi necha kvadrat santimetr?", "Стороны прямоугольника 8 см и 5 см. Чему равна его площадь в квадратных сантиметрах?", "A rectangle has sides 8 cm and 5 cm. What is its area in square centimetres?"), "40"),
  N("g4-units", 4, "measurement", L("2 km 300 m necha metr?", "Сколько метров в 2 км 300 м?", "How many metres are in 2 km 300 m?"), "2300"),
  N("g4-speed", 4, "problems", L("Poyezd soatiga 60 km tezlik bilan 3 soat yurdi. U necha kilometr yo‘l bosdi?", "Поезд ехал 3 часа со скоростью 60 км/ч. Сколько километров он проехал?", "A train travelled for 3 hours at 60 km/h. How many kilometres did it cover?"), "180"),
  N("g4-sub", 4, "operations", L(r`$5000 - 1876$ nechaga teng?`, r`Сколько будет $5000 - 1876$?`, r`What is $5000 - 1876$?`), "3124"),
  N("g4-perimeter", 4, "geometry", L("Kvadratning tomoni 7 sm. Perimetri necha santimetr?", "Сторона квадрата 7 см. Чему равен его периметр в сантиметрах?", "A square has a side of 7 cm. What is its perimeter in centimetres?"), "28"),
  // ── 5-sinf ──
  N("g5-fracadd", 5, "fractions", L(r`$\dfrac{1}{2} + \dfrac{1}{3}$ nechaga teng? (kasr ko‘rinishida)`, r`Чему равно $\dfrac{1}{2} + \dfrac{1}{3}$? (дробью)`, r`What is $\dfrac{1}{2} + \dfrac{1}{3}$? (as a fraction)`), "5/6"),
  N("g5-decimal", 5, "number", L(r`$0{,}6 + 0{,}25$ nechaga teng?`, r`Чему равно $0{,}6 + 0{,}25$?`, r`What is $0.6 + 0.25$?`), "0.85"),
  N("g5-percent", 5, "number", L(r`$80$ ning $25\%$ i nechaga teng?`, r`Сколько составляют $25\%$ от $80$?`, r`What is $25\%$ of $80$?`), "20"),
  N("g5-triarea", 5, "geometry", L("Uchburchakning asosi 10 sm, balandligi 6 sm. Yuzi necha kvadrat santimetr?", "Основание треугольника 10 см, высота 6 см. Чему равна его площадь в квадратных сантиметрах?", "A triangle has base 10 cm and height 6 cm. What is its area in square centimetres?"), "30"),
  N("g5-cube", 5, "geometry", L("Qirrasi 3 sm bo‘lgan kubning hajmi necha kub santimetr?", "Ребро куба равно 3 см. Чему равен его объём в кубических сантиметрах?", "A cube has an edge of 3 cm. What is its volume in cubic centimetres?"), "27"),
  N("g5-anglesum", 5, "geometry", L("Uchburchak burchaklarining yig‘indisi necha gradus?", "Чему равна сумма углов треугольника в градусах?", "What is the sum of the angles of a triangle, in degrees?"), "180"),
  N("g5-gcd", 5, "number", L("12 va 18 ning eng katta umumiy bo‘luvchisi nechaga teng?", "Чему равен наибольший общий делитель чисел 12 и 18?", "What is the greatest common divisor of 12 and 18?"), "6"),
  N("g5-equation", 5, "algebra", L(r`$x + 7 = 15$ tenglamada $x$ nechaga teng?`, r`Чему равен $x$ в уравнении $x + 7 = 15$?`, r`In the equation $x + 7 = 15$, what is $x$?`), "8"),
  // ── 6-sinf ──
  N("g6-neg", 6, "number", L(r`$-7 + 12$ nechaga teng?`, r`Чему равно $-7 + 12$?`, r`What is $-7 + 12$?`), "5"),
  N("g6-abs", 6, "number", L(r`$|-9|$ nechaga teng?`, r`Чему равен $|-9|$?`, r`What is $|-9|$?`), "9"),
  N("g6-ratio", 6, "number", L(r`Ikki son nisbati $3 : 5$. Birinchisi 12 bo‘lsa, ikkinchisi nechaga teng?`, r`Два числа относятся как $3 : 5$. Первое равно 12. Чему равно второе?`, r`Two numbers are in the ratio $3 : 5$. The first is 12. What is the second?`), "20"),
  N("g6-equation", 6, "algebra", L(r`$3x + 5 = 20$ tenglamada $x$ nechaga teng?`, r`Чему равен $x$ в уравнении $3x + 5 = 20$?`, r`In the equation $3x + 5 = 20$, what is $x$?`), "5"),
  N("g6-fracmul", 6, "fractions", L(r`$\dfrac{3}{4} \cdot \dfrac{2}{3}$ nechaga teng? (kasr ko‘rinishida)`, r`Чему равно $\dfrac{3}{4} \cdot \dfrac{2}{3}$? (дробью)`, r`What is $\dfrac{3}{4} \cdot \dfrac{2}{3}$? (as a fraction)`), "1/2"),
  C("g6-circle", 6, "geometry", L(r`Aylana uzunligi formulasi qaysi? ($r$ — radius)`, r`Какая формула длины окружности? ($r$ — радиус)`, r`Which is the circumference formula? ($r$ is the radius)`),
    ["2πr", "πr²", "2r", "4πr²"], 0, [r`2\pi r`, r`\pi r^2`, r`2r`, r`4\pi r^2`]),
  N("g6-raise", 6, "problems", L("Mahsulot narxi 200 000 so‘m edi va 10% ga oshdi. Yangi narx necha so‘m?", "Товар стоил 200 000 сумов, цену повысили на 10%. Какова новая цена в сумах?", "A product cost 200,000 UZS and its price rose by 10%. What is the new price in UZS?"), "220000"),
  C("g6-quadrant", 6, "geometry", L(r`$(3; -2)$ nuqta koordinata tekisligining qaysi choragida?`, r`В какой координатной четверти лежит точка $(3; -2)$?`, r`In which quadrant of the coordinate plane is the point $(3, -2)$?`),
    ["I", "II", "III", "IV"], 3),
  N("g6-decdiv", 6, "number", L(r`$4{,}8 : 0{,}6$ nechaga teng?`, r`Сколько будет $4{,}8 : 0{,}6$?`, r`What is $4.8 \div 0.6$?`), "8"),
  N("g6-circlearea", 6, "geometry", L("Radiusi 3 sm bo‘lgan doira yuzi π ning necha barobariga teng?", "Радиус круга 3 см. Площадь круга равна π, умноженному на какое число?", "A circle has radius 3 cm. Its area equals π times what number?"), "9"),
  // ── 7-sinf ──
  N("g7-power", 7, "number", L(r`$2^5$ nechaga teng?`, r`Чему равно $2^5$?`, r`What is $2^5$?`), "32"),
  N("g7-powerrule", 7, "algebra", L(r`$a^3 \cdot a^4 = a^n$. $n$ nechaga teng?`, r`$a^3 \cdot a^4 = a^n$. Чему равно $n$?`, r`$a^3 \cdot a^4 = a^n$. What is $n$?`), "7"),
  N("g7-linear", 7, "algebra", L(r`$5x - 3 = 2x + 9$ tenglamada $x$ nechaga teng?`, r`Чему равен $x$ в уравнении $5x - 3 = 2x + 9$?`, r`In the equation $5x - 3 = 2x + 9$, what is $x$?`), "4"),
  C("g7-square", 7, "algebra", L(r`$(x + 3)^2$ ni yoying.`, r`Раскройте скобки: $(x + 3)^2$`, r`Expand $(x + 3)^2$.`),
    ["x² + 6x + 9", "x² + 9", "x² + 3x + 9", "x² + 6x + 3"], 0, [r`x^2 + 6x + 9`, r`x^2 + 9`, r`x^2 + 3x + 9`, r`x^2 + 6x + 3`]),
  N("g7-function", 7, "functions", L(r`$y = 2x + 1$ funksiyada $x = 3$ bo‘lsa, $y$ nechaga teng?`, r`Для функции $y = 2x + 1$ найдите $y$ при $x = 3$.`, r`For $y = 2x + 1$, what is $y$ when $x = 3$?`), "7"),
  N("g7-isosceles", 7, "geometry", L(r`Teng yonli uchburchakning asosidagi burchagi $40^\circ$. Uchidagi burchagi necha gradus?`, r`В равнобедренном треугольнике угол при основании $40^\circ$. Чему равен угол при вершине, в градусах?`, r`In an isosceles triangle a base angle is $40^\circ$. What is the apex angle, in degrees?`), "100"),
  N("g7-parallel", 7, "geometry", L(r`Ikki parallel to‘g‘ri chiziqni kesuvchi kesdi. Ichki almashinuvchi burchaklardan biri $70^\circ$. Ikkinchisi necha gradus?`, r`Две параллельные прямые пересечены секущей. Один из внутренних накрест лежащих углов равен $70^\circ$. Чему равен другой, в градусах?`, r`Two parallel lines are cut by a transversal. One alternate interior angle is $70^\circ$. What is the other, in degrees?`), "70"),
  N("g7-system", 7, "algebra", L(r`$x + y = 10$ va $x - y = 2$ bo‘lsa, $x$ nechaga teng?`, r`Если $x + y = 10$ и $x - y = 2$, то чему равен $x$?`, r`If $x + y = 10$ and $x - y = 2$, what is $x$?`), "6"),
  N("g7-brackets", 7, "algebra", L(r`$3(x - 2) = x + 4$ tenglamada $x$ nechaga teng?`, r`Чему равен $x$ в уравнении $3(x - 2) = x + 4$?`, r`In the equation $3(x - 2) = x + 4$, what is $x$?`), "5"),
  N("g7-yaxis", 7, "functions", L(r`$y = -x + 4$ to‘g‘ri chiziq Oy o‘qini qaysi ordinatada kesadi?`, r`В какой точке прямая $y = -x + 4$ пересекает ось Oy? (ордината)`, r`At which y-value does the line $y = -x + 4$ cross the Oy axis?`), "4"),
  // ── 8-sinf ──
  N("g8-sqrt", 8, "number", L(r`$\sqrt{144}$ nechaga teng?`, r`Чему равен $\sqrt{144}$?`, r`What is $\sqrt{144}$?`), "12"),
  N("g8-sqrt18", 8, "number", L(r`$\sqrt{18} = a\sqrt{2}$ bo‘lsa, $a$ nechaga teng?`, r`Если $\sqrt{18} = a\sqrt{2}$, то чему равно $a$?`, r`If $\sqrt{18} = a\sqrt{2}$, what is $a$?`), "3"),
  N("g8-quad", 8, "algebra", L(r`$x^2 - 5x + 6 = 0$ tenglamaning kichik ildizi nechaga teng?`, r`Чему равен меньший корень уравнения $x^2 - 5x + 6 = 0$?`, r`What is the smaller root of $x^2 - 5x + 6 = 0$?`), "2"),
  N("g8-disc", 8, "algebra", L(r`$x^2 + 2x - 3 = 0$ tenglamaning diskriminanti nechaga teng?`, r`Чему равен дискриминант уравнения $x^2 + 2x - 3 = 0$?`, r`What is the discriminant of $x^2 + 2x - 3 = 0$?`), "16"),
  C("g8-ineq", 8, "algebra", L(r`$2x - 6 > 0$ tengsizlikning yechimi qaysi?`, r`Каково решение неравенства $2x - 6 > 0$?`, r`What is the solution of $2x - 6 > 0$?`),
    ["x > 3", "x < 3", "x > −3", "x < −3"], 0, [r`x > 3`, r`x < 3`, r`x > -3`, r`x < -3`]),
  C("g8-fraction", 8, "algebra", L(r`$\dfrac{x^2 - 9}{x - 3}$ ni soddalashtiring.`, r`Сократите дробь $\dfrac{x^2 - 9}{x - 3}$.`, r`Simplify $\dfrac{x^2 - 9}{x - 3}$.`),
    ["x + 3", "x − 3", "x² − 3", "3"], 0, [r`x + 3`, r`x - 3`, r`x^2 - 3`, r`3`]),
  N("g8-square", 8, "functions", L(r`$y = x^2$ funksiyada $x = -3$ bo‘lsa, $y$ nechaga teng?`, r`Для функции $y = x^2$ найдите $y$ при $x = -3$.`, r`For $y = x^2$, what is $y$ when $x = -3$?`), "9"),
  N("g8-pyth", 8, "geometry", L("Katetlari 6 va 8 bo‘lgan to‘g‘ri burchakli uchburchakning gipotenuzasi nechaga teng?", "Катеты прямоугольного треугольника 6 и 8. Чему равна гипотенуза?", "The legs of a right triangle are 6 and 8. What is the hypotenuse?"), "10"),
  N("g8-parangle", 8, "geometry", L(r`Parallelogramning bir burchagi $70^\circ$. Unga qo‘shni burchagi necha gradus?`, r`Один угол параллелограмма равен $70^\circ$. Чему равен соседний угол, в градусах?`, r`One angle of a parallelogram is $70^\circ$. What is the adjacent angle, in degrees?`), "110"),
  N("g8-quadsum", 8, "geometry", L("To‘rtburchak ichki burchaklarining yig‘indisi necha gradus?", "Чему равна сумма внутренних углов четырёхугольника, в градусах?", "What is the sum of the interior angles of a quadrilateral, in degrees?"), "360"),
  N("g8-paarea", 8, "geometry", L("Parallelogramning asosi 9 sm, balandligi 4 sm. Yuzi necha kvadrat santimetr?", "Основание параллелограмма 9 см, высота 4 см. Чему равна площадь в квадратных сантиметрах?", "A parallelogram has base 9 cm and height 4 cm. What is its area in square centimetres?"), "36"),
  // ── 9-sinf ──
  N("g9-prog", 9, "algebra", L(r`Arifmetik progressiyada $a_1 = 3$, $d = 4$. $a_5$ nechaga teng?`, r`В арифметической прогрессии $a_1 = 3$, $d = 4$. Чему равно $a_5$?`, r`In an arithmetic progression $a_1 = 3$ and $d = 4$. What is $a_5$?`), "19"),
  N("g9-sum", 9, "algebra", L(r`$1 + 2 + 3 + \dots + 10$ yig‘indisi nechaga teng?`, r`Чему равна сумма $1 + 2 + 3 + \dots + 10$?`, r`What is the sum $1 + 2 + 3 + \dots + 10$?`), "55"),
  N("g9-vieta", 9, "algebra", L(r`$x^2 - 5x + 6 = 0$ tenglama ildizlarining yig‘indisi nechaga teng?`, r`Чему равна сумма корней уравнения $x^2 - 5x + 6 = 0$?`, r`What is the sum of the roots of $x^2 - 5x + 6 = 0$?`), "5"),
  C("g9-ineq", 9, "algebra", L(r`$x^2 - 4 < 0$ tengsizlikning yechimi qaysi?`, r`Каково решение неравенства $x^2 - 4 < 0$?`, r`What is the solution of $x^2 - 4 < 0$?`),
    ["−2 < x < 2", L("x < −2 yoki x > 2", "x < −2 или x > 2", "x < −2 or x > 2"), "x < 2", "x > −2"], 0,
    [r`-2 < x < 2`, L(r`x < -2 \text{ yoki } x > 2`, r`x < -2 \text{ или } x > 2`, r`x < -2 \text{ or } x > 2`), r`x < 2`, r`x > -2`]),
  N("g9-vertex", 9, "functions", L(r`$y = x^2 - 4x + 3$ parabola uchining abssissasi nechaga teng?`, r`Чему равна абсцисса вершины параболы $y = x^2 - 4x + 3$?`, r`What is the x-coordinate of the vertex of $y = x^2 - 4x + 3$?`), "2"),
  N("g9-zero", 9, "functions", L(r`$y = x^2 - 9$ grafigi Ox o‘qini qaysi musbat nuqtada kesadi?`, r`В какой положительной точке график $y = x^2 - 9$ пересекает ось Ox?`, r`At which positive point does the graph of $y = x^2 - 9$ cross the Ox axis?`), "3"),
  N("g9-sin", 9, "functions", L(r`$\sin 30^\circ$ nechaga teng? (kasr ko‘rinishida)`, r`Чему равен $\sin 30^\circ$? (дробью)`, r`What is $\sin 30^\circ$? (as a fraction)`), "1/2"),
  N("g9-radian", 9, "functions", L(r`$90^\circ = \dfrac{\pi}{n}$ radian. $n$ nechaga teng?`, r`$90^\circ = \dfrac{\pi}{n}$ радиан. Чему равно $n$?`, r`$90^\circ = \dfrac{\pi}{n}$ radians. What is $n$?`), "2"),
  N("g9-similar", 9, "geometry", L("O‘xshash uchburchaklarning o‘xshashlik koeffitsiyenti 2. Kichigining perimetri 10 bo‘lsa, kattasiniki nechaga teng?", "Коэффициент подобия двух треугольников равен 2. Периметр меньшего 10. Чему равен периметр большего?", "Two triangles are similar with ratio 2. The smaller has perimeter 10. What is the perimeter of the larger?"), "20"),
  N("g9-inscribed", 9, "geometry", L(r`Aylananing markaziy burchagi $80^\circ$. Shu yoyga tiralgan ichki chizilgan burchak necha gradus?`, r`Центральный угол окружности равен $80^\circ$. Чему равен вписанный угол, опирающийся на ту же дугу, в градусах?`, r`A central angle of a circle is $80^\circ$. What is the inscribed angle on the same arc, in degrees?`), "40"),
  N("g9-die", 9, "probability", L("O‘yin kubigi tashlanganda 4 dan katta son tushish ehtimoli qancha? (kasr)", "Какова вероятность выпадения числа больше 4 при броске кубика? (дробью)", "What is the probability of rolling a number greater than 4 on a die? (as a fraction)"), "1/3"),
  // ── 10-sinf ──
  N("g10-log2", 10, "algebra", L(r`$\log_2 8$ nechaga teng?`, r`Чему равен $\log_2 8$?`, r`What is $\log_2 8$?`), "3"),
  N("g10-log3", 10, "algebra", L(r`$\log_3 81$ nechaga teng?`, r`Чему равен $\log_3 81$?`, r`What is $\log_3 81$?`), "4"),
  N("g10-exp", 10, "algebra", L(r`$2^x = 32$ tenglamada $x$ nechaga teng?`, r`Чему равен $x$ в уравнении $2^x = 32$?`, r`In the equation $2^x = 32$, what is $x$?`), "5"),
  N("g10-geom", 10, "algebra", L(r`Geometrik progressiyada $b_1 = 2$, $q = 3$. $b_3$ nechaga teng?`, r`В геометрической прогрессии $b_1 = 2$, $q = 3$. Чему равно $b_3$?`, r`In a geometric progression $b_1 = 2$ and $q = 3$. What is $b_3$?`), "18"),
  N("g10-tg", 10, "functions", L(r`$\operatorname{tg} 45^\circ$ nechaga teng?`, r`Чему равен $\operatorname{tg} 45^\circ$?`, r`What is $\tan 45^\circ$?`), "1"),
  N("g10-sinx", 10, "functions", L(r`$\sin x = 1$ va $0^\circ \le x \le 180^\circ$ bo‘lsa, $x$ necha gradus?`, r`Если $\sin x = 1$ и $0^\circ \le x \le 180^\circ$, то чему равен $x$, в градусах?`, r`If $\sin x = 1$ and $0^\circ \le x \le 180^\circ$, what is $x$ in degrees?`), "90"),
  C("g10-domain", 10, "functions", L(r`$y = \sqrt{x - 2}$ funksiyaning aniqlanish sohasi qaysi?`, r`Какова область определения функции $y = \sqrt{x - 2}$?`, r`What is the domain of $y = \sqrt{x - 2}$?`),
    ["x ≥ 2", "x > 2", "x ≤ 2", "x ≥ −2"], 0, [r`x \ge 2`, r`x > 2`, r`x \le 2`, r`x \ge -2`]),
  N("g10-prob", 10, "probability", L("Idishda 3 ta qizil va 2 ta ko‘k shar bor. Tasodifiy olingan shar qizil bo‘lish ehtimoli qancha? (kasr)", "В урне 3 красных и 2 синих шара. Какова вероятность вытащить красный шар? (дробью)", "A bag has 3 red and 2 blue balls. What is the probability of drawing a red one? (as a fraction)"), "3/5"),
  N("g10-fact", 10, "probability", L(r`$4!$ nechaga teng?`, r`Чему равно $4!$?`, r`What is $4!$?`), "24"),
  N("g10-edges", 10, "geometry", L("Kubning nechta qirrasi bor?", "Сколько рёбер у куба?", "How many edges does a cube have?"), "12"),
  N("g10-surface", 10, "geometry", L("Qirrasi 2 bo‘lgan kubning to‘la sirti yuzi nechaga teng?", "Ребро куба равно 2. Чему равна площадь его полной поверхности?", "A cube has edge 2. What is its total surface area?"), "24"),
];

// O‘quvchi sinfi → ochiladigan sinf va savollar manbai: [savol sinfi, soni].
// Hamma sinfda bir xil qoida: ochiladigan sinf — o‘z sinfidan bitta past (kamida 1); to‘g‘ri javoblar ≥ 90% bo‘lsa
// (ownGrade) o‘z sinfi ochiladi. Savollar hamma joyda “bitta past sinf”dan: 2 → 1; 3 → 2; 4 → 2–3; 5 → 4; … 11 → 10.
// 1-sinf uchun test yo‘q (NO_TEST_GRADES): o‘quvchi to‘g‘ridan-to‘g‘ri darslarni boshlaydi.
const PLANS = {
  2: { open: 1, ownGrade: 2, parts: [[1, 6]] },
  3: { open: 2, ownGrade: 3, parts: [[2, 6]] },
  4: { open: 3, ownGrade: 4, parts: [[2, 3], [3, 3]] },
  5: { open: 4, ownGrade: 5, parts: [[4, 7]] },
  6: { open: 5, ownGrade: 6, parts: [[5, 7]] },
  7: { open: 6, ownGrade: 7, parts: [[6, 8]] },
  8: { open: 7, ownGrade: 8, parts: [[7, 8]] },
  9: { open: 8, ownGrade: 9, parts: [[8, 10]] },
  10: { open: 9, ownGrade: 10, parts: [[9, 10]] },
  11: { open: 10, ownGrade: 11, parts: [[10, 10]] },
};
const NO_TEST_GRADES = [1];

// Matn ichidagi $…$ — matematik ifoda (KaTeX). Toq indeksdagi bo‘laklar ifoda.
function splitMath(text) {
  return String(text)
    .split("$")
    .map((value, index) => ({ math: index % 2 === 1, value }))
    .filter((part) => part.value !== "");
}
// KaTeX yuklanmaguncha (yoki yuklanmasa) ifoda oddiy Unicode matn sifatida ko‘rsatiladi.
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUBSCRIPT = "₀₁₂₃₄₅₆₇₈₉";
function texToPlain(tex) {
  return String(tex)
    .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√$1")
    .replace(/\\operatorname\{([^{}]*)\}/g, "$1")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\cdot/g, "·").replace(/\\pi/g, "π")
    .replace(/\^\{?\\circ\}?/g, "°").replace(/\\circ/g, "°").replace(/\\dots/g, "…").replace(/\\ge/g, "≥").replace(/\\le/g, "≤").replace(/\\%/g, "%")
    .replace(/\\(sin|cos|tan|log)/g, "$1")
    .replace(/\^\{?(\d)\}?/g, (_, digit) => SUPERSCRIPT[digit])
    .replace(/_\{?(\d)\}?/g, (_, digit) => SUBSCRIPT[digit])
    .replace(/\{,\}/g, ",").replace(/[{}]/g, "").replace(/\\ /g, " ").replace(/\s{2,}/g, " ");
}

function normalizeGrade(value) {
  const grade = Number(value);
  return Number.isInteger(grade) && grade >= 1 && grade <= 11 ? grade : null;
}
function getPlan(grade) {
  return PLANS[grade] ?? null;
}
function planTotal(plan) {
  return plan.parts.reduce((sum, [, count]) => sum + count, 0);
}
function requiresTest(grade) {
  return !NO_TEST_GRADES.includes(grade) && PLANS[grade] !== undefined;
}
// Taxminiy vaqt (daqiqa): savollar soniga qarab. 6–8 ta savol ≈ 3, 10 ta savol ≈ 4.
function estimateMinutes(total) {
  return Math.max(2, Math.round((total * SECONDS_PER_QUESTION) / 60));
}
// 9–11-sinf: jiddiyroq uslub (konfetti, toj, qiziq bezaklarsiz).
function isSeniorGrade(grade) {
  return Number(grade) >= 9;
}
function pickText(value, lang) {
  if (!Array.isArray(value)) return value;
  const index = LANGS.indexOf(lang);
  return value[index < 0 ? 0 : index] ?? value[0];
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(list, seed, salt) {
  const random = makeRandom(hashString(`${seed}:${salt}`));
  const result = list.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

// Har sinf ichida mavzular xilma-xil bo‘lishi uchun eng kam ishlatilgan mavzu tanlanadi;
// savollar sinf o‘sish tartibida (yengildan qiyinga) beriladi.
function buildQueue(itemBank, plan, seed) {
  const domainCount = {};
  const queue = [];
  plan.parts.forEach(([grade, count]) => {
    const pool = seededShuffle(itemBank.filter((item) => item.grade === grade), seed, `pool-${grade}`);
    const picked = [];
    while (picked.length < count && pool.length) {
      let bestIndex = 0;
      let bestScore = Infinity;
      pool.forEach((item, index) => {
        const score = domainCount[item.domain] ?? 0;
        if (score < bestScore) { bestScore = score; bestIndex = index; }
      });
      const [item] = pool.splice(bestIndex, 1);
      domainCount[item.domain] = (domainCount[item.domain] ?? 0) + 1;
      picked.push(item);
    }
    queue.push(...seededShuffle(picked, seed, `order-${grade}`).map((item) => item.id));
  });
  return queue;
}

// ── Javoblarni tekshirish ──
function cleanAnswer(value) {
  let text = String(value ?? "").trim().toLowerCase();
  text = text.replace(/[−–—]/g, "-").replace(/[\s  ]+/g, "");
  text = text.replace(/^[a-zа-яё]=/, "").replace(/[°%]/g, "");
  return text;
}
const NUMBER_FORM = /^(-?(?:\d+(?:[.,]\d+)?|[.,]\d+)(?:\/\d+)?)[a-zа-яё²³‘’'ʻ]*\.?$/;
function toNumber(raw) {
  const match = cleanAnswer(raw).match(NUMBER_FORM);
  if (!match) return null;
  const core = match[1].replace(",", ".");
  if (core.includes("/")) {
    const [top, bottom] = core.split("/");
    return Number(bottom) === 0 ? null : Number(top) / Number(bottom);
  }
  return Number(core);
}
function matchOne(given, expected) {
  const a = toNumber(given);
  const b = toNumber(expected);
  if (a !== null && b !== null) {
    if (Math.abs(a - b) < 1e-9) return true;
    // 220 000, 220.000 va 220,000 — mingliklar ajratilgan yozuv.
    const grouped = cleanAnswer(given).replace(/^\d{1,3}(?:[.,]\d{3})+$/, (text) => text.replace(/[.,]/g, ""));
    const g = toNumber(grouped);
    return g !== null && Math.abs(g - b) < 1e-9;
  }
  return cleanAnswer(given) === cleanAnswer(expected);
}
function answersMatch(given, expected) {
  const accepted = Array.isArray(expected) ? expected : [expected];
  return accepted.some((one) => matchOne(given, one));
}
function showNumber(text, lang) {
  return lang === "en" ? text : text.replace(/^(\d+)\.(\d+)$/, "$1,$2");
}
function correctAnswerText(item, lang) {
  if (item.type === "choice") return pickText(item.options[item.correct], lang);
  const first = Array.isArray(item.answer) ? item.answer[0] : item.answer;
  return showNumber(first, lang);
}
function isCorrectAnswer(item, value) {
  return item.type === "choice" ? value === item.correct : answersMatch(value, item.answer);
}

function buildResponse({ item, lang, correct, skipped, answerText, answerTimeMs }) {
  return {
    itemId: item.id,
    level: `grade_${item.grade}`,
    grade: item.grade,
    difficulty: null,
    domain: item.domain,
    type: item.type,
    stage: "quiz",
    blockIndex: null,
    correct,
    skipped,
    answer: skipped ? null : answerText,
    correctAnswer: correctAnswerText(item, lang),
    answerTimeMs,
    audioPlays: 0,
    tooFast: !skipped && answerTimeMs < TOO_FAST_MS,
    answeredAt: new Date().toISOString(),
  };
}

function calculateLevelStats(responses, plan) {
  return Object.fromEntries(plan.parts.map(([grade]) => {
    const own = responses.filter((response) => response.grade === grade);
    const correct = own.filter((response) => response.correct).length;
    return [`grade_${grade}`, { level: `grade_${grade}`, correct, total: own.length, accuracy: own.length ? correct / own.length : 0 }];
  }));
}
function calculateSkillStats(responses) {
  return Object.fromEntries(DOMAIN_IDS.map((domain) => {
    const own = responses.filter((response) => response.domain === domain);
    const correct = own.filter((response) => response.correct).length;
    const status = !own.length ? null : correct === own.length ? "know" : correct === 0 ? "unknown" : "partial";
    return [domain, { correct, total: own.length, accuracy: own.length ? correct / own.length : 0, status }];
  }));
}

function buildResult({ studentGrade, plan, responses, startedAt, completedAt, lang }) {
  const totalQuestions = responses.length;
  const score = responses.filter((response) => response.correct).length;
  const accuracy = totalQuestions ? score / totalQuestions : 0;
  const baseLevel = accuracy >= 0.7 ? "strong" : accuracy >= 0.4 ? "partial" : "weak";
  const tooFastCount = responses.filter((response) => response.tooFast).length;
  const clearCut = accuracy >= 0.7 || accuracy <= 0.3;
  // To‘g‘ri javoblar ≥ 90% bo‘lsa o‘z sinfi, aks holda bitta past; “Bilmayman” xato hisoblanadi.
  const perfectScore = totalQuestions > 0 && score === totalQuestions;
  const ownGradeUnlocked = totalQuestions > 0 && Boolean(plan.ownGrade) && score * 100 >= totalQuestions * Math.round(OWN_GRADE_THRESHOLD * 100);
  const openGrade = ownGradeUnlocked ? plan.ownGrade : plan.open;
  const placementLevel = `grade_${openGrade}`;
  const durationSec = startedAt && completedAt ? Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 1000)) : null;
  return {
    placementLevel,
    recommendedCourse: placementLevel,
    confidence: clearCut && tooFastCount < 4 ? "high" : "medium",
    borderlineWith: null,
    answeredCount: totalQuestions,
    totalQuestions,
    score,
    levelStats: calculateLevelStats(responses, plan),
    skillStats: calculateSkillStats(responses),
    completionType: "FULL_PLACEMENT",
    flags: { startInconsistent: false, inconsistency: false, audioError: false, tooFastCount },
    responses,
    studentGrade,
    openGrade,
    perfectScore,
    ownGradeUnlocked,
    ownGradeThreshold: OWN_GRADE_THRESHOLD,
    questionGrades: plan.parts.map(([grade]) => grade),
    baseLevel,
    accuracy,
    lang,
    startedAt: startedAt ?? null,
    completedAt: completedAt ?? null,
    durationSec,
    engineVersion: ENGINE_VERSION,
  };
}

// 1-sinf: test o‘tkazilmaydi, to‘g‘ridan-to‘g‘ri darslar. LMS tayyor natija oladi (ingliz “SELF_REPORT_KIDS” kabi).
function buildNoTestResult({ studentGrade = 1, lang, now = new Date().toISOString() }) {
  const placementLevel = `grade_${studentGrade}`;
  return {
    placementLevel,
    recommendedCourse: placementLevel,
    confidence: "high",
    borderlineWith: null,
    answeredCount: 0,
    totalQuestions: 0,
    score: 0,
    levelStats: {},
    skillStats: calculateSkillStats([]),
    completionType: "NO_TEST_REQUIRED",
    flags: { startInconsistent: false, inconsistency: false, audioError: false, tooFastCount: 0 },
    responses: [],
    studentGrade,
    openGrade: studentGrade,
    perfectScore: false,
    ownGradeUnlocked: false,
    ownGradeThreshold: OWN_GRADE_THRESHOLD,
    questionGrades: [],
    baseLevel: null,
    accuracy: 0,
    lang,
    startedAt: now,
    completedAt: now,
    durationSec: 0,
    engineVersion: ENGINE_VERSION,
  };
}

function createInitialSession(seed = Date.now(), studentGrade = null) {
  return {
    version: SESSION_VERSION,
    phase: "intro",
    seed,
    studentGrade,
    plan: null,
    queue: [],
    responses: [],
    result: null,
    incomplete: null,
    startedAt: null,
  };
}
// Saqlangan sessiya faqat shu holda tiklanadi: versiya, faol savol bosqichi, ma’lum savollar,
// hali tugamagan va (agar LMS sinf bersa) sinf mos kelsa.
function isRestorableSession(parsed, itemMap, propGrade) {
  if (!parsed || parsed.version !== SESSION_VERSION || parsed.phase !== "quiz") return false;
  if (!Array.isArray(parsed.queue) || !parsed.queue.length || !Array.isArray(parsed.responses)) return false;
  if (parsed.responses.length >= parsed.queue.length) return false;
  if (!parsed.plan || !Array.isArray(parsed.plan.parts)) return false;
  if ([...parsed.queue, ...parsed.responses.map((item) => item.itemId)].some((id) => !itemMap.has(id))) return false;
  return propGrade === null || parsed.studentGrade === propGrade;
}

// Diagnostika bir marta o‘tiladi: tugagan natija saqlanadi, qayta ochilganda test emas, natija ko‘rsatiladi.
function isRestorableResult(saved, propGrade) {
  if (!saved || saved.engineVersion !== ENGINE_VERSION || typeof saved.placementLevel !== "string") return false;
  // 1-sinf (NO_TEST_REQUIRED) saqlanmaydi: bu oyna o‘tkinchi, qayta kirilganda odatdagi ochilish ekrani chiqadi.
  if (saved.completionType !== "FULL_PLACEMENT") return false;
  return propGrade === null || saved.studentGrade === propGrade;
}

// Bank tekshiruvi: muammolar ro‘yxatini qaytaradi (bo‘sh bo‘lsa — to‘g‘ri).
function validateMathBank(itemBank = MATH_ITEMS) {
  const problems = [];
  const seen = new Set();
  itemBank.forEach((item) => {
    if (seen.has(item.id)) problems.push(`${item.id}: takroriy id`);
    seen.add(item.id);
    if (!DOMAIN_IDS.includes(item.domain)) problems.push(`${item.id}: noma’lum mavzu`);
    if (!Array.isArray(item.q) || item.q.length !== 3 || item.q.some((text) => !text)) problems.push(`${item.id}: savol matni to‘liq emas`);
    else if (item.q.some((text) => (text.match(/\$/g) ?? []).length % 2 !== 0)) problems.push(`${item.id}: “$” belgilari juft emas`);
    if (item.type === "number") {
      if (!item.answer || (Array.isArray(item.answer) && !item.answer.length)) problems.push(`${item.id}: javob yo‘q`);
    } else if (item.type === "choice") {
      const options = item.options ?? [];
      if (options.length !== 4) problems.push(`${item.id}: 4 ta variant kerak`);
      LANGS.forEach((lang) => {
        const texts = options.map((option) => pickText(option, lang));
        if (new Set(texts).size !== texts.length || texts.some((text) => !text)) problems.push(`${item.id}/${lang}: variantlar takrorlangan yoki bo‘sh`);
      });
      if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct >= options.length) problems.push(`${item.id}: correct indeksi noto‘g‘ri`);
      if (item.optionTex && item.optionTex.length !== options.length) problems.push(`${item.id}: optionTex soni variantlar soniga teng emas`);
    } else {
      problems.push(`${item.id}: qo‘llab-quvvatlanmaydigan tur`);
    }
  });
  return problems;
}
// </logic>

// ── Matnlar ──
const CONTENT = {
  uz: {
    hello: (name) => `Salom, ${name}!`,
    defaultName: "O‘quvchi",
    minutes: (n) => `≈ ${n} daqiqa`,
    minutesRange: "≈ 3–4 daqiqa",
    questionsCount: (n) => `${n} ta savol`,
    stepsTitle: "Savollar",
    pickOne: "Bitta variantni tanlang",
    yourGrade: "Sinfingiz",
    gradeWord: "sinf",
    groups: ["Boshlang‘ich · 1–4", "O‘rta · 5–9", "Yuqori · 10–11"],
    statQuestions: "Savollar",
    statTime: "Vaqt",
    statGrade: "Sinf",
    timeUnit: "daq.",
    pickHint: "Savollar sinfingizga moslab tanlanadi",
    rules: ["Har bir savolga qisqa javob bering", "Bilmasangiz — “Bilmayman” ni bosing", "Oxirida sizga mos sinf ochiladi"],
    introTitle: "Matematika bo‘yicha qisqa tekshiruv",
    introSub: (count, grade) => `${grade}-sinf uchun ${count} ta qisqa savol — taxminan 3 daqiqa.`,
    introNote: "Bu imtihon emas: bilim bazasi bor-yo‘qligini ko‘ramiz. Bilmagan savolda “Bilmayman” ni bosing.",
    pickGrade: "Nechanchi sinfda o‘qiysiz?",
    gradeLabel: (n) => `${n}-sinf`,
    start: "Boshlaymiz",
    back: "Orqaga",
    go: "Ketdik!",
    skip: "Bilmayman",
    check: "Tekshirish",
    placeholder: "Javobingiz",
    hint: "Qisqa javobni yozing",
    empty: "Avval javobni yozing.",
    correct: ["Barakalla!", "Ajoyib!", "To‘g‘ri!", "Zo‘r!"],
    wrong: ["Hechqisi yo‘q!", "Deyarli!", "Keyingisida albatta!"],
    skipped: "Mayli, buni birga o‘rganamiz.",
    rightAnswer: "To‘g‘ri javob",
    next: "Davom",
    seeResult: "Natijani ko‘rish",
    exit: "Testni to‘xtatish",
    exitTitle: "Testni to‘xtatasizmi?",
    exitText: "Hozir to‘xtatsangiz, sizga mos sinf aniqlanmaydi.",
    keep: "Davom etaman",
    confirmExit: "To‘xtatish",
    resultEyebrow: "Natija tayyor",
    resultTitle: (name) => `${name}, ajoyib ish!`,
    scoreLabel: "To‘g‘ri javoblar",
    openTitle: "Sizga mos sinf",
    openGrade: (n) => `${n}-sinf`,
    openNoteBelow: (n) => `Avval ${n}-sinf mavzularini mustahkamlab olamiz`,
    openNotePerfect: "Ajoyib natija — o‘z sinfingizdan boshlaysiz!",
    baseTitle: "Bilim bazasi",
    base: { strong: "Baza mustahkam", partial: "Baza qisman bor", weak: "Asoslarni mustahkamlaymiz" },
    baseNote: {
      strong: "Mavzularning ko‘pchiligini bilasiz — takrorlash tez o‘tadi.",
      partial: "Ba’zi mavzular yaxshi, ba’zilari takrorlashni talab qiladi.",
      weak: "Bu normal: o‘qish aynan shu asoslardan boshlanadi.",
    },
    topicsTitle: "Mavzular bo‘yicha",
    status: { know: "Biladi", partial: "Qisman", unknown: "Bilmaydi" },
    retake: "Qayta o‘tish",
    finish: "Yakunlash",
    startLessons: "Darslarni boshlash",
    noTestEyebrow: "Test shart emas",
    noTestTitle: "Siz darslarni boshlashingiz mumkin!",
    noTestText: "1-sinf uchun test shart emas — to‘g‘ridan-to‘g‘ri 1-sinf darslaridan boshlang.",
    noTestHint: "1-sinf uchun test shart emas. Darslarni hoziroq boshlashingiz mumkin!",
    noTestIntroTitle: "Darslar siz uchun ochiq!",
    perks: [
      { title: "Darslar ochiq", text: "“Darslarni boshlash” tugmasini bosing va davom eting." },
      { title: "Coin va pointlar yig‘ing", text: "Kunlik darslar va vazifalarni bajaring — mukofot oling." },
      { title: "Mavzuli mashqlar", text: "Qo‘shimcha mashq qilish uchun har bir mavzuga alohida mashqlar bor." },
    ],
    perkStats: [["Darslar", "Ochiq"], ["Coin", "Yig‘ing"], ["Mashq", "Mavzuli"]],
    goCalm: "Boshlaymiz",
    soundOn: "Ovozni yoqish",
    soundOff: "Ovozni o‘chirish",
    keysLabel: "Maxsus belgilar",
    keys: { minus: "Minus", slash: "Kasr chizig‘i", dot: "Nuqta", comma: "Vergul" },
    incompleteEyebrow: "Test tugallanmadi",
    incompleteTitle: "Daraja aniqlanmadi",
    incompleteText: "Sizga mos sinfni aniqlash uchun barcha savollarga javob berish kerak.",
    incompleteProgress: (done, total) => `Javob berilgan: ${done} / ${total}`,
    domains: {
      number: "Sonlar", operations: "Amallar", fractions: "Kasrlar", problems: "Masalalar",
      measurement: "O‘lchovlar", geometry: "Geometriya", algebra: "Algebra", functions: "Funksiyalar", probability: "Ehtimollik",
    },
  },
  ru: {
    hello: (name) => `Привет, ${name}!`,
    defaultName: "Ученик",
    minutes: (n) => `≈ ${n} мин`,
    minutesRange: "≈ 3–4 мин",
    questionsCount: (n) => `${n} вопросов`,
    stepsTitle: "Вопросы",
    pickOne: "Выбери один вариант",
    yourGrade: "Твой класс",
    gradeWord: "класс",
    groups: ["Начальная · 1–4", "Средняя · 5–9", "Старшая · 10–11"],
    statQuestions: "Вопросы",
    statTime: "Время",
    statGrade: "Класс",
    timeUnit: "мин",
    pickHint: "Вопросы подберутся под твой класс",
    rules: ["Отвечай коротко на каждый вопрос", "Не знаешь — нажми «Не знаю»", "В конце откроется подходящий тебе класс"],
    introTitle: "Короткая проверка по математике",
    introSub: (count, grade) => `${count} коротких вопросов для ${grade} класса — примерно 3 минуты.`,
    introNote: "Это не экзамен: мы смотрим, есть ли база. Если не знаешь ответ — нажми «Не знаю».",
    pickGrade: "В каком ты классе?",
    gradeLabel: (n) => `${n} класс`,
    start: "Начинаем",
    back: "Назад",
    go: "Поехали!",
    skip: "Не знаю",
    check: "Проверить",
    placeholder: "Твой ответ",
    hint: "Напиши короткий ответ",
    empty: "Сначала введи ответ.",
    correct: ["Молодец!", "Отлично!", "Верно!", "Супер!"],
    wrong: ["Ничего страшного!", "Почти!", "В следующий раз получится!"],
    skipped: "Ничего, разберём это вместе.",
    rightAnswer: "Правильный ответ",
    next: "Дальше",
    seeResult: "Смотреть результат",
    exit: "Остановить тест",
    exitTitle: "Остановить тест?",
    exitText: "Если остановить сейчас, подходящий класс определён не будет.",
    keep: "Продолжить",
    confirmExit: "Остановить",
    resultEyebrow: "Результат готов",
    resultTitle: (name) => `${name}, отличная работа!`,
    scoreLabel: "Верных ответов",
    openTitle: "Подходящий тебе класс",
    openGrade: (n) => `${n} класс`,
    openNoteBelow: (n) => `Сначала закрепим темы ${n} класса`,
    openNotePerfect: "Отличный результат — начинаешь со своего класса!",
    baseTitle: "База знаний",
    base: { strong: "База крепкая", partial: "База есть частично", weak: "Укрепим основы" },
    baseNote: {
      strong: "Большинство тем ты знаешь — повторение пройдёт быстро.",
      partial: "Одни темы хорошо, другие стоит повторить.",
      weak: "Это нормально: обучение начнётся именно с этих основ.",
    },
    topicsTitle: "По темам",
    status: { know: "Знает", partial: "Частично", unknown: "Не знает" },
    retake: "Пройти заново",
    finish: "Завершить",
    startLessons: "Начать уроки",
    noTestEyebrow: "Тест не нужен",
    noTestTitle: "Можно начинать уроки!",
    noTestText: "Для 1 класса тест не нужен — начинай сразу с уроков 1 класса.",
    noTestHint: "Для 1 класса тест не нужен. Можно сразу начать уроки!",
    noTestIntroTitle: "Уроки для тебя открыты!",
    perks: [
      { title: "Уроки открыты", text: "Нажми «Начать уроки» и продолжай." },
      { title: "Копи коины и поинты", text: "Проходи ежедневные уроки и задания — получай награды." },
      { title: "Упражнения по темам", text: "Для дополнительной практики у каждой темы есть свои упражнения." },
    ],
    perkStats: [["Уроки", "Открыты"], ["Коины", "Копи"], ["Практика", "По темам"]],
    goCalm: "Начинаем",
    soundOn: "Включить звук",
    soundOff: "Выключить звук",
    keysLabel: "Специальные символы",
    keys: { minus: "Минус", slash: "Дробная черта", dot: "Точка", comma: "Запятая" },
    incompleteEyebrow: "Тест не завершён",
    incompleteTitle: "Уровень не определён",
    incompleteText: "Чтобы получить рекомендацию, нужно ответить на все вопросы.",
    incompleteProgress: (done, total) => `Отвечено: ${done} / ${total}`,
    domains: {
      number: "Числа", operations: "Действия", fractions: "Дроби", problems: "Задачи",
      measurement: "Величины", geometry: "Геометрия", algebra: "Алгебра", functions: "Функции", probability: "Вероятность",
    },
  },
  en: {
    hello: (name) => `Hi, ${name}!`,
    defaultName: "Student",
    minutes: (n) => `≈ ${n} min`,
    minutesRange: "≈ 3–4 min",
    questionsCount: (n) => `${n} questions`,
    stepsTitle: "Questions",
    pickOne: "Pick one option",
    yourGrade: "Your grade",
    gradeWord: "grade",
    groups: ["Primary · 1–4", "Middle · 5–9", "Upper · 10–11"],
    statQuestions: "Questions",
    statTime: "Time",
    statGrade: "Grade",
    timeUnit: "min",
    pickHint: "Questions are matched to your grade",
    rules: ["Give a short answer to each question", "Not sure? Tap “I do not know”", "At the end, the grade that suits you opens"],
    introTitle: "A quick maths check",
    introSub: (count, grade) => `${count} short questions for grade ${grade} — about 3 minutes.`,
    introNote: "This is not an exam: we just check whether the basics are there. If you do not know, tap “I do not know”.",
    pickGrade: "Which grade are you in?",
    gradeLabel: (n) => `Grade ${n}`,
    start: "Let’s go",
    back: "Back",
    go: "Go!",
    skip: "I do not know",
    check: "Check",
    placeholder: "Your answer",
    hint: "Type a short answer",
    empty: "Type an answer first.",
    correct: ["Well done!", "Excellent!", "Correct!", "Super!"],
    wrong: ["No worries!", "Almost!", "Next one is yours!"],
    skipped: "That is fine, we will learn it together.",
    rightAnswer: "Correct answer",
    next: "Next",
    seeResult: "See the result",
    exit: "Stop the test",
    exitTitle: "Stop the test?",
    exitText: "If you stop now, no suitable grade will be determined.",
    keep: "Keep going",
    confirmExit: "Stop",
    resultEyebrow: "Result is ready",
    resultTitle: (name) => `${name}, great job!`,
    scoreLabel: "Correct answers",
    openTitle: "The grade that suits you",
    openGrade: (n) => `Grade ${n}`,
    openNoteBelow: (n) => `First we will consolidate grade ${n} topics`,
    openNotePerfect: "Great result — you start at your own grade!",
    baseTitle: "Knowledge base",
    base: { strong: "Strong base", partial: "Partial base", weak: "Let’s build the basics" },
    baseNote: {
      strong: "You know most topics — the review will go fast.",
      partial: "Some topics are solid, others need a review.",
      weak: "That is fine: learning starts exactly with these basics.",
    },
    topicsTitle: "By topic",
    status: { know: "Knows", partial: "Partly", unknown: "Does not know" },
    retake: "Take it again",
    finish: "Finish",
    startLessons: "Start lessons",
    noTestEyebrow: "No test needed",
    noTestTitle: "You can start the lessons!",
    noTestText: "No test is needed for grade 1 — start right away with the grade 1 lessons.",
    noTestHint: "No test is needed for grade 1. You can start the lessons right away!",
    noTestIntroTitle: "Your lessons are open!",
    perks: [
      { title: "Lessons are open", text: "Press “Start lessons” and carry on." },
      { title: "Collect coins and points", text: "Finish the daily lessons and tasks to earn rewards." },
      { title: "Practice by topic", text: "Every topic has its own extra exercises to practise with." },
    ],
    perkStats: [["Lessons", "Open"], ["Coins", "Collect"], ["Practice", "By topic"]],
    goCalm: "Begin",
    soundOn: "Turn sound on",
    soundOff: "Mute sound",
    keysLabel: "Special symbols",
    keys: { minus: "Minus", slash: "Fraction slash", dot: "Dot", comma: "Comma" },
    incompleteEyebrow: "Test not finished",
    incompleteTitle: "Level not determined",
    incompleteText: "To get a recommendation, all questions must be answered.",
    incompleteProgress: (done, total) => `Answered: ${done} / ${total}`,
    domains: {
      number: "Numbers", operations: "Operations", fractions: "Fractions", problems: "Word problems",
      measurement: "Measures", geometry: "Geometry", algebra: "Algebra", functions: "Functions", probability: "Probability",
    },
  },
};
const DOMAIN_GLYPH = { number: "123", operations: "± ×", fractions: "½", problems: "?", measurement: "cm", geometry: "△", algebra: "x", functions: "f(x)", probability: "P" };
const GLOWS = ["#fe5b1a", "#019acb", "#7c5cff", "#10b981", "#ec4899"];
const CONFETTI_COLORS = ["#fe5b1a", "#019acb", "#7c5cff", "#10b981", "#ec4899", "#f59e0b"];
// Faqat to‘g‘ri javobdan keyin o‘zi o‘tadi; xato va “Bilmayman”dan keyin o‘quvchi “Davom” ni bosadi.
const REACTION_MS = { ok: 1100 };

// ── Rasmlar (public/art) ──
// Standart manzil: `${assetBase}/${nom}` (assetBase prop, standart "/art"). `npm run build:lms` bu ro‘yxatni
// data-URI bilan to‘ldiradi — shunda yuklanadigan yagona fayl rasm hostingiga muhtoj bo‘lmaydi.
const INLINE_ART = {};
const ART = {
  waving: "mascot-waving.png", think: "mascot-think.png", thumbs: "mascot-thumbs.png", celebrate: "mascot-celebrate.png",
  point: "mascot-point.png", trophy: "mascot-trophy.png", checklist: "mascot-checklist.png",
  books: "mascot-books.png", laptop: "mascot-laptop.png", pencil: "mascot-pencil.png", sparkles: "sparkles.png", crown: "crown.png",
  iconTime: "icons/daily-reset.svg", iconQuestions: "icons/random-questions.svg", iconLesson: "icons/lesson.svg", iconDone: "icons/test-complete.svg",
  iconCoin: "icons/coin.svg", iconTrainer: "icons/trainer.svg",
};
const RULE_ICONS = [ART.iconQuestions, ART.iconLesson, ART.iconDone];
const PERK_ICONS = [ART.iconLesson, ART.iconCoin, ART.iconTrainer];
// Har bir yosh uchun o‘z animatsiyasi: kichiklarda o‘ynoqi sakrash, o‘rtadagilarda yengil suzish, kattalarda deyarli sezilmas nafas.
const moodOf = (grade) => (!grade ? "hello" : grade <= 2 ? "play" : grade <= 4 ? "hop" : grade <= 8 ? "glide" : "calm");
const GRADE_GROUPS = [[1, 4], [5, 9], [10, 11]];
// Murakkab javoblar uchun belgilar tugmalari (barchasi bir xil o‘lchamda): minus, kasr chizig‘i, nuqta, vergul.
const NUMBER_KEYS = [["−", "minus"], ["/", "slash"], [".", "dot"], [",", "comma"]];
const DECOR = [
  { name: "cube.png", side: "left", top: 9, size: 84, delay: 0 },
  { name: "pyramid.png", side: "left", top: 70, size: 92, delay: -2.2 },
  { name: "books.png", side: "left", top: 38, size: 70, delay: -4 },
  { name: "orb.png", side: "right", top: 12, size: 96, delay: -1 },
  { name: "chart.png", side: "right", top: 44, size: 76, delay: -3.1 },
  { name: "shuffle.png", side: "right", top: 74, size: 72, delay: -5 },
];
const ArtContext = createContext("/art");
const artUrl = (name, base) => INLINE_ART[name] ?? `${base.replace(/\/$/, "")}/${name}`;

// ── KaTeX ──
// Ustuvorlik: `katex` prop → window.katex → pinlangan versiya + SRI bilan CDN. Yuklanmaguncha (yoki yuklanmasa)
// ifodalar oddiy Unicode matn ko‘rinishida chiqadi, test to‘xtamaydi.
const KATEX_BASE = "https://cdn.jsdelivr.net/npm/katex@0.19.1/dist";
const KATEX_SRI = {
  js: "sha384-a1WQdjRj162i159OYq041X6I4K8NenkrI09LlPmiHg0YOb7CR+wJOraXwK9abpnE",
  css: "sha384-WwGtaC6ywCHxA5cstpj/3+xIZvTez8dq2IcBQaXRkenHZ7FVVq1ZROtURwfbtTlG",
};
const KatexContext = createContext(null);
const katexLoads = new Map();
function loadKatex(base) {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.katex) return Promise.resolve(window.katex);
  const root = base.replace(/\/$/, "");
  if (!katexLoads.has(root)) {
    katexLoads.set(root, new Promise((resolve) => {
      const pinned = root === KATEX_BASE;
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = `${root}/katex.min.css`;
      if (pinned) { css.integrity = KATEX_SRI.css; css.crossOrigin = "anonymous"; }
      document.head.appendChild(css);
      const script = document.createElement("script");
      script.src = `${root}/katex.min.js`;
      script.async = true;
      if (pinned) { script.integrity = KATEX_SRI.js; script.crossOrigin = "anonymous"; }
      script.onload = () => resolve(window.katex ?? null);
      script.onerror = () => { katexLoads.delete(root); resolve(null); };
      document.head.appendChild(script);
    }));
  }
  return katexLoads.get(root);
}
function useKatex(katexProp, base) {
  const [loaded, setLoaded] = useState(() => (typeof window !== "undefined" ? window.katex ?? null : null));
  const needed = !katexProp && !loaded;
  useEffect(() => {
    if (!needed) return undefined;
    let alive = true;
    loadKatex(base).then((lib) => { if (alive && lib) setLoaded(lib); });
    return () => { alive = false; };
  }, [needed, base]);
  return katexProp ?? loaded;
}

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;800;900&display=swap");
@property --glow{syntax:"<color>";inherits:true;initial-value:#fe5b1a}
.mp-root{--accent:#fe5b1a;--accent-dark:#e94b0d;--ink:#151515;--muted:#737373;--canvas:#f6f6f5;--line:#e9e5e2;--ok:#10b981;--bad:#ef4444;--warn:#f59e0b;--shadow:0 18px 45px rgba(63,39,27,.09),0 2px 5px rgba(63,39,27,.035);position:relative;display:flex;height:var(--mp-min-h,100dvh);min-height:0;overflow:hidden;color:var(--ink);font-family:Roboto,Arial,sans-serif;background:radial-gradient(circle at 10% 6%,color-mix(in srgb,var(--glow) 16%,transparent),transparent 40%),radial-gradient(circle at 94% 96%,color-mix(in srgb,var(--glow) 11%,transparent),transparent 38%),var(--canvas);transition:--glow .7s ease}
.mp-root *,.mp-root *::before,.mp-root *::after{box-sizing:border-box}
.mp-root button,.mp-root input{font:inherit}
.mp-root img{display:block;max-width:100%;user-select:none;-webkit-user-drag:none}
.mp-decor{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.mp-decor img{position:absolute;height:auto;opacity:.92;filter:drop-shadow(0 12px 16px rgba(63,39,27,.16));animation:mp-float 9s ease-in-out infinite}
.mp-stage{position:relative;z-index:1;flex:1;min-width:0;min-height:0;display:grid;grid-template-rows:minmax(0,1fr);width:100%;max-width:1780px;margin:0 auto;padding:clamp(10px,2.2vh,28px) clamp(12px,2.6vw,48px);overflow:auto;grid-template-columns:minmax(0,1fr);animation:mp-screen .6s cubic-bezier(.2,.9,.25,1) backwards}
.mp-card{background:#fff;border:1px solid rgba(225,225,225,.7);border-radius:28px;box-shadow:var(--shadow)}
.mp-label{display:block;color:var(--muted);font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.mp-eyebrow{margin:0;color:var(--accent);font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.mp-eyebrow--light{color:rgba(255,255,255,.9)}
.mp-rise{animation:mp-rise .6s var(--d,0ms) cubic-bezier(.2,.9,.25,1) backwards}
.mp-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 22px;border:0;border-radius:999px;background:var(--accent);color:#fff;font-size:15px;font-weight:800;letter-spacing:.01em;white-space:nowrap;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,background .18s ease,color .18s ease,border-color .18s ease}
.mp-btn:not(:disabled):hover{background:var(--accent-dark);box-shadow:0 10px 20px rgba(254,91,26,.24);transform:translateY(-2px)}
.mp-btn:not(:disabled):active{transform:scale(.97)}
.mp-btn:disabled{opacity:.4;cursor:not-allowed}
.mp-btn--lg{min-height:clamp(48px,7vh,58px);padding:0 30px;font-size:16px}
.mp-btn--block{width:100%}
.mp-btn--soft{border:1px solid #eadfd9;background:#fff;color:#665752}
.mp-btn--soft:not(:disabled):hover{border-color:#f78a5c;background:#fff5ef;color:#bf4211;box-shadow:none}
.mp-btn .mp-arrow{display:inline-block}
.mp-btn:not(:disabled) .mp-arrow{animation:mp-nudge 1.6s ease-in-out infinite}
.mp-glass{transition:background .18s,transform .18s;display:inline-flex;align-items:center;gap:8px;align-self:flex-start;min-height:38px;padding:0 16px;border:0;border-radius:999px;background:rgba(255,255,255,.2);color:#fff;font-size:14px;font-weight:800;cursor:pointer;transition:background .18s}
.mp-glass:hover{background:rgba(255,255,255,.32);transform:translateX(-3px)}
.mp-orange{position:relative;isolation:isolate;overflow:hidden;display:flex;flex-direction:column;gap:clamp(12px,2.4vh,28px);min-height:0;padding:clamp(16px,3vh,40px) clamp(18px,2.8vw,44px);border-radius:28px;background:var(--accent);color:#fff;box-shadow:var(--shadow)}
.mp-orange::after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at 88% 12%,rgba(255,255,255,.22),transparent 34%)}
.mp-spark{position:absolute;z-index:1;top:6%;right:6%;width:clamp(44px,6vw,84px);height:auto;animation:mp-twinkle 2.6s ease-in-out infinite}
.mp-chips{display:flex;flex-wrap:wrap;gap:8px;min-width:0}
.mp-chip{display:inline-flex;align-items:center;gap:8px;min-height:34px;padding:0 14px 0 8px;border-radius:999px;background:#fff;color:#151515;font-size:clamp(12px,1.5vh,14px);font-weight:700;white-space:nowrap}
.mp-chip img{width:20px;height:20px}
.mp-mascot-img{flex:none;width:auto;object-fit:contain;filter:drop-shadow(0 12px 16px rgba(120,40,0,.26));animation:mp-bounce 3.4s ease-in-out infinite}
.mp-intro{align-self:center;width:100%;max-width:1500px;justify-self:center;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(12px,1.8vw,26px);height:min(100%,780px);min-height:0}
.mp-hero{container-type:inline-size}
.mp-hero-copy{display:flex;flex-direction:column;gap:clamp(10px,2vh,22px);position:relative;z-index:2}
.mp-hero h1{margin:0;font-size:clamp(24px,5.6cqw,68px);line-height:1.02;letter-spacing:-.05em;font-weight:900}
.mp-rules{display:grid;gap:clamp(6px,1.6vh,16px);margin:0;padding:0;list-style:none}
.mp-rules li{display:flex;align-items:center;gap:14px;padding:clamp(6px,1.6vh,16px) 20px clamp(6px,1.6vh,16px) 8px;border-radius:999px;background:rgba(255,255,255,.17);font-size:clamp(13px,2.5cqw,25px);font-weight:700;line-height:1.25}
.mp-rules li i{flex:none;display:grid;place-items:center;width:clamp(30px,6.4cqw,56px);aspect-ratio:1;border-radius:50%;background:#fff}
.mp-rules li i img{width:58%;height:58%}
.mp-perks{display:grid;gap:clamp(8px,1.8vh,18px);margin:clamp(2px,1vh,10px) 0 0;padding:0;list-style:none;counter-reset:perk}
.mp-perks li{position:relative;display:flex;align-items:center;gap:clamp(12px,1.6cqw,18px);padding:clamp(10px,1.8vh,18px) clamp(14px,2cqw,24px) clamp(10px,1.8vh,18px) clamp(10px,1.2cqw,14px);border-radius:24px;background:rgba(255,255,255,.17);animation:mp-perk .7s var(--d,0ms) cubic-bezier(.2,.9,.25,1) backwards}
.mp-perks li::after{content:counter(perk);counter-increment:perk;position:absolute;top:50%;right:clamp(12px,1.8cqw,22px);transform:translateY(-50%);color:rgba(255,255,255,.28);font-size:clamp(28px,5.4cqw,54px);font-weight:900;letter-spacing:-.06em;line-height:1;pointer-events:none}
.mp-perks i{flex:none;display:grid;place-items:center;width:clamp(40px,7.2cqw,64px);aspect-ratio:1;border-radius:50%;background:#fff;box-shadow:0 8px 18px rgba(120,40,0,.18);animation:mp-pop .6s calc(var(--d,0ms) + 220ms) cubic-bezier(.2,.9,.25,1) backwards}
.mp-perks i img{width:56%;height:56%}
.mp-perks div{display:flex;flex-direction:column;gap:clamp(2px,.5vh,5px);min-width:0;padding-right:clamp(22px,4.6cqw,48px)}
.mp-perks b{font-size:clamp(16px,2.9cqw,27px);font-weight:800;letter-spacing:-.02em;line-height:1.15}
.mp-perks span{color:rgba(255,255,255,.92);font-size:clamp(13px,2.1cqw,19px);font-weight:500;line-height:1.4;text-wrap:pretty}
.mp-perkstats .mp-stat{animation:mp-perk .7s var(--d,0ms) cubic-bezier(.2,.9,.25,1) backwards}
.mp-perkstats .mp-stat b{font-size:clamp(14px,2.3vh,19px);letter-spacing:-.02em;overflow-wrap:anywhere}
.mp-perkstats .mp-stat span{overflow:hidden;text-overflow:ellipsis}
.mp-hero[data-mood=play] .mp-mascot-img{animation:mp-wiggle 2.4s ease-in-out infinite}
.mp-hero[data-mood=hop] .mp-mascot-img{animation:mp-hop 1.9s cubic-bezier(.3,.7,.4,1) infinite}
.mp-hero[data-mood=glide] .mp-mascot-img{animation:mp-bounce 4.4s ease-in-out infinite}
.mp-hero[data-mood=calm] .mp-mascot-img{animation:mp-breathe 5.2s ease-in-out infinite}
.mp-hero[data-mood=play] .mp-spark{animation-duration:1.6s}
.mp-hero[data-mood=calm] .mp-spark{animation-duration:5s}
.mp-hero[data-mood=calm] .mp-perks li{animation-name:mp-calm}
.mp-hero-foot{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;min-width:0}
.mp-hero-foot .mp-mascot-img{height:clamp(90px,min(27vh,25cqw),250px)}
.mp-setup{display:flex;flex-direction:column;justify-content:center;gap:clamp(12px,2.4vh,26px);min-height:0;padding:clamp(18px,3.4vh,48px) clamp(18px,2.8vw,48px)}
.mp-setup h2{margin:0;font-size:clamp(24px,calc(.8vw + 2.6vh),38px);line-height:1.05;letter-spacing:-.045em;font-weight:900}
.mp-sub{margin:clamp(4px,.8vh,8px) 0 0;color:var(--muted);font-size:clamp(13px,1.8vh,16px);line-height:1.45}
.mp-setup{position:relative;overflow:hidden;justify-content:space-between;background-image:radial-gradient(circle at 100% 0,#fff0e8 0,transparent 44%),radial-gradient(circle at 0 100%,#fff6f1 0,transparent 42%)}
.mp-setup-deco{position:absolute;top:clamp(14px,3vh,34px);right:clamp(16px,2.6vw,44px);width:clamp(54px,10vh,104px);height:auto;pointer-events:none;filter:drop-shadow(0 10px 14px rgba(63,39,27,.18));animation:mp-float 7s ease-in-out infinite}
.mp-setup-head{position:relative;display:flex;flex-direction:column;gap:clamp(4px,.8vh,8px);padding-right:clamp(60px,11vh,116px)}
.mp-setup-head .mp-sub{margin:0}
.mp-groups{display:flex;flex-direction:column;gap:clamp(8px,1.8vh,20px)}
.mp-group{display:flex;flex-direction:column;gap:clamp(5px,1vh,10px)}
.mp-glabel{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:clamp(10px,1.4vh,12px);font-weight:800;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}
.mp-glabel::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}
.mp-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(6px,1.2vh,12px)}
.mp-stat{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-areas:"i l" "i v";column-gap:10px;align-items:center;padding:clamp(8px,1.5vh,16px) clamp(10px,1vw,16px);border:1px solid #f6e3d8;border-radius:18px;background:#fff7f2;transition:background .3s,border-color .3s,transform .3s}
.mp-stats.is-ready .mp-stat{background:#fff0e6;border-color:#fcd2bd}
.mp-stat img{grid-area:i;width:clamp(24px,3.6vh,34px);height:auto}
.mp-stat span{grid-area:l;color:var(--muted);font-size:clamp(10px,1.4vh,12px);font-weight:800;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.mp-stat b{grid-area:v;display:flex;align-items:baseline;gap:4px;font-size:clamp(18px,3.2vh,30px);font-weight:900;letter-spacing:-.03em;line-height:1.1;animation:mp-pop .45s both}
.mp-stat b small{color:var(--muted);font-size:.5em;font-weight:800;letter-spacing:0}
.mp-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(6px,1.2vh,12px);padding-top:6px}
.mp-tile{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:clamp(46px,8vh,76px);padding:6px 2px;border:1.5px solid var(--line);border-radius:20px;background:#fff;color:var(--ink);cursor:pointer;animation:mp-rise .5s var(--d,0ms) cubic-bezier(.2,.9,.25,1) backwards;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease,color .18s ease}
.mp-tile b{font-size:clamp(20px,3.6vh,32px);font-weight:900;letter-spacing:-.04em;line-height:1}
.mp-tile span{color:var(--muted);font-size:clamp(9px,1.3vh,11px);font-weight:800;letter-spacing:.1em;text-transform:uppercase;transition:color .18s}
.mp-tile:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 12px 24px rgba(254,91,26,.16)}
.mp-tile:active{transform:scale(.96)}
.mp-tile.is-on{border-color:transparent;background:linear-gradient(145deg,#ff8a57,#fe5b1a);color:#fff;box-shadow:0 14px 28px rgba(254,91,26,.36);transform:translateY(-4px) scale(1.05)}
.mp-tile.is-on span{color:rgba(255,255,255,.88)}
.mp-tile em{position:absolute;top:-7px;right:-7px;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#fff;color:var(--accent);font-style:normal;font-size:13px;font-weight:900;box-shadow:0 4px 10px rgba(0,0,0,.18);animation:mp-pop .35s both}
.mp-tile.is-on::after{content:"";position:absolute;inset:-5px;border-radius:24px;border:2px solid var(--accent);opacity:0;animation:mp-ping .9s ease-out}
.mp-locked{display:flex;align-items:center;gap:16px;padding:clamp(12px,2.4vh,22px) 22px;border-radius:24px;background:linear-gradient(145deg,#ff8a57,#fe5b1a);color:#fff;box-shadow:0 14px 28px rgba(254,91,26,.3)}
.mp-locked b{font-size:clamp(44px,8vh,72px);line-height:1;letter-spacing:-.06em;font-weight:900}
.mp-locked span{font-size:clamp(16px,2.4vh,22px);font-weight:800}
.mp-focus{display:grid;grid-template-rows:auto minmax(0,1fr);gap:clamp(10px,2vh,20px);width:100%;max-width:1220px;margin:0 auto;height:100%;min-height:0}
.mp-top{display:flex;align-items:center;gap:14px}
.mp-seg{flex:1;display:flex;gap:5px}
.mp-seg i{flex:1;height:10px;border-radius:99px;background:rgba(21,21,21,.1);transition:background .4s}
.mp-seg i.is-ok{background:var(--ok)}.mp-seg i.is-bad{background:var(--bad)}.mp-seg i.is-skip{background:var(--warn)}
.mp-seg i.is-now{background:var(--glow);animation:mp-pulse 1.1s ease-in-out infinite}
.mp-counter{font-weight:800;font-size:15px;letter-spacing:.06em;color:var(--muted);white-space:nowrap}
.mp-icon-btn{display:grid;place-items:center;width:40px;height:40px;flex:none;border:1px solid #eadfd9;border-radius:50%;background:#fff;color:#665752;font-size:17px;line-height:1;cursor:pointer;transition:background .2s,transform .15s}
.mp-icon-btn:hover{background:#fff5ef;transform:rotate(90deg)}.mp-icon-btn:active{transform:rotate(90deg) scale(.9)}
.mp-qcard{display:grid;grid-template-columns:minmax(0,1fr) clamp(150px,21vw,300px);grid-template-rows:minmax(0,1fr) auto;column-gap:clamp(12px,2vw,36px);min-height:0;padding:clamp(18px,3.6vh,44px) clamp(18px,3vw,56px) clamp(12px,2.4vh,24px);animation:mp-slide .5s cubic-bezier(.2,.9,.25,1) both}
.mp-qcard[data-state=bad]{animation:mp-shake .5s both}
.mp-qcard[data-state=ok]{animation:mp-glow .6s both}
.mp-qmain{display:flex;flex-direction:column;justify-content:center;gap:clamp(14px,3vh,34px);min-width:0;min-height:0}
.mp-qhead{display:flex;align-items:center;justify-content:space-between;gap:12px}
.mp-topic{display:inline-flex;align-items:center;gap:8px;padding:5px 14px 5px 6px;border-radius:999px;background:color-mix(in srgb,var(--glow) 12%,#fff);color:var(--glow);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;transition:color .7s}
.mp-topic b{display:grid;place-items:center;min-width:26px;height:26px;padding:0 7px;border-radius:99px;background:var(--glow);color:#fff;font-size:11px;letter-spacing:0;transition:background .7s}
.mp-root .mp-minimasc{display:none;height:clamp(44px,7vh,60px);width:auto}
.mp-q{margin:0;font-size:clamp(21px,calc(1.2vw + 2.5vh),48px);line-height:1.3;letter-spacing:-.025em;font-weight:800}
.mp-w{display:inline-block;animation:mp-word .5s var(--d,0ms) cubic-bezier(.2,.9,.25,1) backwards}
.mp-mpill{display:inline-block;margin:.08em .06em;padding:.04em .46em .1em;border-radius:.6em;background:color-mix(in srgb,var(--glow) 11%,#fff);color:var(--glow);vertical-align:middle;line-height:1.35;animation:mp-pill .65s var(--d,0ms) cubic-bezier(.2,1.3,.4,1) backwards;transition:color .7s,background .7s}
.mp-mpill .katex{font-size:1.1em;color:inherit}
.mp-tex-plain{font-family:"Times New Roman",serif;font-style:italic}
.mp-opts{display:grid;grid-template-columns:1fr;gap:clamp(8px,1.4vh,14px)}
.mp-opt{display:flex;align-items:center;gap:12px;width:100%;min-height:clamp(48px,9vh,80px);padding:8px 18px;border:1.5px solid var(--line);border-radius:20px;background:#fff;color:var(--ink);font-size:clamp(16px,2.6vh,25px);font-weight:700;text-align:left;cursor:pointer;animation:mp-rise .45s var(--d,0ms) cubic-bezier(.2,.9,.25,1) backwards;transition:transform .15s,border-color .2s,background .2s,opacity .3s}
.mp-opt:not(:disabled):hover{border-color:var(--accent);background:#fff8f4;transform:translateY(-2px)}
.mp-opt:not(:disabled):active{transform:scale(.98)}
.mp-opt i{flex:none;display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#f1efed;color:var(--muted);font-style:normal;font-size:13px;font-weight:800}
.mp-opt .katex{font-size:1.08em}
.mp-opt.is-ok{border-color:var(--ok);background:#ecfdf5;color:#047857}
.mp-opt.is-ok i{background:var(--ok);color:#fff}
.mp-opt.is-bad{border-color:var(--bad);background:#fef2f2;color:#b91c1c}
.mp-opt.is-dim{opacity:.4}
.mp-input{width:100%;min-width:0;min-height:clamp(54px,10vh,84px);padding:0 22px;border:1.5px solid var(--line);border-radius:20px;background:#fff;color:var(--ink);font-size:clamp(22px,3.8vh,40px);font-weight:800;outline:none;transition:border-color .2s,box-shadow .2s,background .3s}
.mp-input:focus{border-color:var(--accent);box-shadow:0 0 0 4px rgba(254,91,26,.16)}
.mp-input.is-ok{border-color:var(--ok);background:#ecfdf5;color:#047857}
.mp-input.is-bad{border-color:var(--bad);background:#fef2f2;color:#b91c1c}
.mp-error{margin:8px 0 0;color:var(--bad);font-size:14px;font-weight:700}
.mp-qside{display:grid;place-items:center;min-height:0;min-width:0}
.mp-qpic{display:grid;place-items:center;height:min(100%,clamp(150px,38vh,290px));aspect-ratio:1;max-width:100%;min-height:0}
.mp-qpic img,.mp-qpic .mp-mascot{box-sizing:border-box;padding:8px;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 12px 16px rgba(63,39,27,.18));animation:mp-pop .5s both}
.mp-qbar{position:relative;grid-column:1/-1;min-width:0;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 12px;min-height:clamp(58px,9vh,76px);margin-top:clamp(8px,1.6vh,18px);padding-top:clamp(10px,1.8vh,16px);border-top:1px solid #f1e7e2}
.mp-qbar > .mp-btn{flex:0 0 auto;max-width:100%}
.mp-qbar > .mp-btn:not(.mp-btn--soft){margin-left:auto}
.mp-barhint{color:var(--muted);font-size:14px;font-weight:700}
.mp-fbtext{flex:1 1 160px;display:flex;align-items:center;gap:12px;min-width:0;font-size:clamp(13px,1.9vh,17px);line-height:1.3;animation:mp-rise .3s both}
.mp-fbtext i{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;color:#fff;font-style:normal;font-size:16px;font-weight:900}
.mp-fbtext strong{display:block;font-size:clamp(16px,2.3vh,21px);font-weight:900;letter-spacing:-.02em}
.mp-fbtext--ok{color:#047857}.mp-fbtext--ok i{background:var(--ok)}
.mp-fbtext--bad{color:#b91c1c}.mp-fbtext--bad i{background:var(--bad)}
.mp-fbtext--skip{color:#b45309}.mp-fbtext--skip i{background:var(--warn)}
.mp-fbtext span{color:var(--ink)}
.mp-timer{position:absolute;left:0;right:0;top:-1px;height:3px;background:var(--accent);opacity:.45;transform-origin:left;animation:mp-timer linear forwards}
.mp-mascot{flex:none;overflow:visible}
.mp-resultgrid{align-self:center;width:100%;max-width:1560px;justify-self:center;display:grid;grid-template-columns:minmax(300px,.82fr) minmax(0,1.18fr);gap:clamp(12px,1.8vw,26px);height:min(100%,780px);min-height:0}
.mp-ring{position:relative;width:clamp(96px,17vh,150px);aspect-ratio:1}
.mp-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.mp-ring circle{fill:none;stroke-width:12;stroke-linecap:round}
.mp-ring .bg{stroke:rgba(255,255,255,.28)}
.mp-ring .fg{stroke:#fff;stroke-dasharray:326.7;stroke-dashoffset:326.7;animation:mp-ring 1.2s .3s cubic-bezier(.3,.8,.3,1) forwards}
.mp-ring b{position:absolute;inset:0;display:grid;place-items:center;font-size:clamp(24px,4.2vh,36px);font-weight:900;letter-spacing:-.03em}
.mp-open{position:relative;z-index:2;padding:clamp(10px,1.8vh,18px) 18px;border-radius:20px;background:#fff;color:var(--ink);box-shadow:0 12px 26px rgba(120,40,0,.18)}
.mp-open b{display:block;margin:2px 0;font-size:clamp(30px,5.6vh,52px);line-height:1.05;letter-spacing:-.05em;font-weight:900;color:var(--accent);animation:mp-pop .6s .5s both}
.mp-open small{display:block;color:var(--muted);font-size:clamp(12px,1.6vh,14px);line-height:1.4}
.mp-crown{position:absolute;z-index:2;top:clamp(10px,2vh,26px);right:clamp(14px,3vw,40px);width:clamp(48px,8vh,80px);animation:mp-bounce 2.4s ease-in-out infinite}
.mp-resultbody{position:relative;display:flex;flex-direction:column;gap:clamp(12px,2.2vh,24px);min-height:0;padding:clamp(18px,3.6vh,48px) clamp(18px,2.8vw,48px);overflow:auto;background-image:radial-gradient(circle at 100% 0,#fff0e8 0,transparent 44%),radial-gradient(circle at 0 100%,#fff6f1 0,transparent 42%)}
.mp-rhead{display:flex;flex-direction:column;gap:clamp(4px,.8vh,8px);padding-right:clamp(60px,11vh,116px)}
.mp-rhead h2{margin:0;font-size:clamp(26px,calc(.9vw + 3.2vh),48px);line-height:1.04;letter-spacing:-.05em;font-weight:900}
.mp-rhead--strong{color:#047857}.mp-rhead--partial{color:#b45309}.mp-rhead--weak{color:var(--accent)}
.mp-rhead .mp-sub{margin:0;max-width:46ch}
.mp-res-main{display:flex;align-items:center;gap:clamp(12px,2.4cqw,28px);position:relative;z-index:2}
.mp-res-main .mp-ring{flex:none}
.mp-res-main .mp-open{flex:1;min-width:0}
.mp-topics{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:clamp(8px,1.6vh,16px);align-content:center}
.mp-tcell{display:flex;flex-direction:column;gap:3px;padding:clamp(12px,2.4vh,24px) clamp(16px,1.4vw,24px);border:1.5px solid;border-radius:20px;animation:mp-rise .5s both}
.mp-tcell b{font-size:clamp(15px,2.6vh,22px);font-weight:900;letter-spacing:-.02em}.mp-tcell span{font-size:clamp(13px,1.9vh,16px);font-weight:700}
.mp-tbar{display:block;height:7px;margin-top:clamp(6px,1.2vh,12px);border-radius:99px;background:rgba(0,0,0,.08);overflow:hidden}
.mp-tbar u{display:block;height:100%;border-radius:inherit;background:currentColor;transform-origin:left;animation:mp-grow .9s .7s cubic-bezier(.3,.8,.3,1) backwards}
.mp-tcell--know{border-color:#a7f3d0;background:#ecfdf5;color:#047857}
.mp-tcell--partial{border-color:#fde68a;background:#fffbeb;color:#b45309}
.mp-tcell--unknown{border-color:#fecaca;background:#fef2f2;color:#b91c1c}
.mp-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:auto}
.mp-actions .mp-btn{flex:1 1 170px}
.mp-orange--result{justify-content:space-between}
.mp-orange--result .mp-hero-foot{margin-top:0}
.mp-orange--result .mp-ring{width:clamp(100px,min(24vh,22cqw),230px)}
.mp-orange--result .mp-ring b{font-size:clamp(26px,min(5.6vh,5.4cqw),54px)}
.mp-orange--result .mp-open{padding:clamp(12px,2.4vh,26px) clamp(16px,2.4cqw,28px)}
.mp-orange--result .mp-open b{font-size:clamp(32px,min(7vh,8cqw),78px)}
.mp-orange--result .mp-open small{font-size:clamp(12px,min(1.9vh,2.2cqw),17px)}
.mp-orange--result h1{font-size:clamp(24px,5.6cqw,66px)}
.mp-orange--result .mp-eyebrow{font-size:clamp(12px,1.9cqw,15px)}
.mp-incomplete{align-self:center;justify-self:center;display:flex;flex-direction:column;align-items:center;gap:14px;max-width:560px;padding:clamp(20px,4vh,44px);text-align:center}
.mp-incomplete img{height:clamp(110px,22vh,190px);width:auto}
.mp-incomplete h1{margin:0;font-size:clamp(26px,4.4vh,40px);letter-spacing:-.05em;font-weight:900}
.mp-incomplete p{margin:0;color:var(--muted);line-height:1.5}
.mp-confetti{position:absolute;inset:0;z-index:4;overflow:hidden;pointer-events:none}
.mp-confetti i{position:absolute;top:-16px;width:10px;height:16px;border-radius:3px;animation:mp-fall 2.8s ease-in forwards}
.mp-count{position:absolute;inset:0;z-index:6;display:grid;place-items:center;background:var(--accent);color:#fff;font-weight:900;font-size:clamp(90px,26vh,220px);animation:mp-wipe .5s cubic-bezier(.2,.9,.25,1) both}
.mp-count.is-leaving{animation:mp-wipe-out .45s cubic-bezier(.6,0,.4,1) forwards;pointer-events:none}
.mp-count span{display:block;animation:mp-countpop .7s cubic-bezier(.2,1.4,.4,1) both}
.mp-count span.is-go{font-size:.38em}
.mp-overlay{position:absolute;inset:0;z-index:8;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.55);animation:mp-fade .2s both}
.mp-dialog{width:100%;max-width:440px;padding:26px;border-radius:28px;background:#fff;box-shadow:0 24px 70px rgba(0,0,0,.3);animation:mp-pop .3s both}
.mp-dialog h2{margin:0 0 8px;font-size:24px;letter-spacing:-.03em}.mp-dialog p{margin:0 0 18px;color:var(--muted);line-height:1.5}
.mp-dialog div{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}
.mp-btn--shine:not(:disabled)::after{content:"";position:absolute;top:0;bottom:0;left:0;width:55%;background:linear-gradient(110deg,transparent,rgba(255,255,255,.42),transparent);transform:translateX(-140%) skewX(-18deg);animation:mp-shine 3.4s ease-in-out 1s infinite;pointer-events:none}
.mp-btn--glow:not(:disabled){animation:mp-glowpulse 2.2s ease-in-out infinite}
@keyframes mp-screen{from{opacity:0;transform:translateY(24px) scale(.985)}}
@keyframes mp-shine{0%,55%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(300%) skewX(-18deg)}}
@keyframes mp-glowpulse{0%,100%{box-shadow:0 0 0 0 rgba(254,91,26,.45)}60%{box-shadow:0 0 0 14px rgba(254,91,26,0)}}
@keyframes mp-wipe{from{clip-path:circle(0% at 50% 82%)}to{clip-path:circle(150% at 50% 82%)}}
@keyframes mp-wipe-out{from{clip-path:circle(150% at 50% 50%);opacity:1}to{clip-path:circle(0% at 50% 50%);opacity:.6}}
.mp-keys{display:flex;gap:8px;margin-top:clamp(8px,1.4vh,14px)}
.mp-key{flex:none;display:grid;place-items:center;width:clamp(42px,6.4vh,54px);height:clamp(42px,6.4vh,54px);padding:0;border:1.5px solid var(--line);border-radius:14px;background:#fff;color:var(--ink);font-size:clamp(20px,3vh,26px);font-weight:800;line-height:1;cursor:pointer;transition:transform .15s,border-color .2s,background .2s,color .2s}
.mp-key:not(:disabled):hover{border-color:var(--accent);color:var(--accent);transform:translateY(-2px)}
.mp-key:not(:disabled):active{transform:scale(.92);background:#fff5ef}
.mp-key:disabled{opacity:.4;cursor:not-allowed}
.mp-notice{display:flex;align-items:center;gap:12px;padding:clamp(10px,2vh,18px) 16px;border:1px solid #a7f3d0;border-radius:20px;background:#ecfdf5;color:#047857;font-size:clamp(14px,2vh,17px);font-weight:700;line-height:1.4;animation:mp-rise .5s both}
.mp-notice img{flex:none;width:clamp(28px,4vh,38px);height:auto}
.mp-sound:hover{transform:scale(1.08)}
.mp-sound.is-floating{position:absolute;top:10px;right:10px;z-index:7;background:rgba(255,255,255,.94);box-shadow:0 6px 16px rgba(63,39,27,.16)}
.mp-count--calm{background:#151515;font-weight:300;font-size:clamp(64px,16vh,120px);animation:mp-fade .35s both}
.mp-count--calm span{animation:mp-calm .55s ease both}
.mp-count--calm span.is-go{font-size:.3em;font-weight:500;letter-spacing:.24em;text-transform:uppercase}
.mp-count--calm.is-leaving{animation:mp-fadeout .4s ease forwards}
.mp-root[data-tone=senior] .mp-decor,.mp-root[data-tone=senior] .mp-spark{display:none}
.mp-notest h1{max-width:18ch}
@keyframes mp-perk{from{opacity:0;transform:translateX(-28px) scale(.96)}to{opacity:1;transform:none}}
@keyframes mp-wiggle{0%,100%{transform:translateY(0) rotate(0)}20%{transform:translateY(-12px) rotate(-5deg)}40%{transform:translateY(0) rotate(4deg)}60%{transform:translateY(-6px) rotate(-3deg)}80%{transform:translateY(0) rotate(2deg)}}
@keyframes mp-hop{0%,55%,100%{transform:translateY(0) scale(1,1)}10%{transform:translateY(0) scale(1.05,.94)}30%{transform:translateY(-20px) scale(.97,1.04)}45%{transform:translateY(0) scale(1.04,.95)}}
@keyframes mp-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.025) translateY(-3px)}}
@keyframes mp-calm{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes mp-fadeout{to{opacity:0}}
@keyframes mp-grow{from{transform:scaleX(0)}}
@keyframes mp-float{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-18px) rotate(6deg)}}
@keyframes mp-twinkle{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.15) rotate(8deg)}}
@keyframes mp-pulse{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.5)}}
@keyframes mp-slide{from{opacity:0;transform:translateX(46px) scale(.98)}to{opacity:1;transform:none}}
@keyframes mp-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes mp-word{from{opacity:0;transform:translateY(.5em) scale(.94);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}
@keyframes mp-pill{from{opacity:0;transform:scale(.6) translateY(.4em)}to{opacity:1;transform:none}}
@keyframes mp-fade{from{opacity:0}to{opacity:1}}
@keyframes mp-pop{0%{transform:scale(.88)}60%{transform:scale(1.05)}100%{transform:scale(1)}}
@keyframes mp-ping{0%{opacity:.7;transform:scale(.92)}100%{opacity:0;transform:scale(1.25)}}
@keyframes mp-nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}
@keyframes mp-shake{0%,100%{transform:none}18%{transform:translateX(-9px)}36%{transform:translateX(8px)}54%{transform:translateX(-6px)}72%{transform:translateX(4px)}}
@keyframes mp-glow{0%{box-shadow:var(--shadow)}40%{box-shadow:0 0 0 6px rgba(16,185,129,.35),var(--shadow)}100%{box-shadow:var(--shadow)}}
@keyframes mp-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes mp-timer{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes mp-ring{to{stroke-dashoffset:var(--off,0)}}
@keyframes mp-countpop{0%{opacity:0;transform:scale(.3)}60%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}
@keyframes mp-fall{to{transform:translateY(110vh) rotate(540deg);opacity:.9}}
@media (min-width:1100px){.mp-opts{grid-template-columns:1fr 1fr}}
@media (max-width:1499px){.mp-decor{display:none}}
@media (max-width:860px){
  .mp-stage{padding:10px 12px;overflow-y:auto}
  .mp-intro,.mp-resultgrid{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);height:100%;align-self:stretch;gap:10px}
  .mp-orange{padding:14px 16px;gap:10px}
  .mp-hero h1{font-size:clamp(22px,7cqw,34px)}
  .mp-rules{display:none}
  .mp-spark{display:none}
  .mp-hero-foot .mp-mascot-img{height:clamp(64px,11vh,110px)}
  .mp-setup{justify-content:flex-start;gap:12px;padding:16px}
  .mp-stat{grid-template-columns:1fr;grid-template-areas:"l" "v";padding:8px 10px}
  .mp-stat img{display:none}
  .mp-tile{min-height:clamp(46px,7.5vh,64px);border-radius:16px}
  .mp-focus{max-width:none}
  .mp-qcard{grid-template-columns:minmax(0,1fr);padding:16px 16px 12px;border-radius:24px}
  .mp-qside{display:none}
  .mp-root .mp-minimasc{display:block}
  .mp-qmain{justify-content:flex-start;gap:clamp(12px,2.4vh,22px)}
  .mp-q{font-size:clamp(19px,5.3vw,28px)}
  .mp-qbar{gap:10px}
  .mp-qbar .mp-btn{min-height:46px;padding:0 18px}
  .mp-fbtext i{width:30px;height:30px}
  .mp-resultgrid{grid-template-rows:auto auto;align-content:start;gap:12px}
  .mp-orange--result{gap:14px;padding:18px}
  .mp-orange--result .mp-spark{display:none}
  .mp-orange--result h1{font-size:clamp(24px,7.4vw,32px)}
  .mp-res-main{gap:14px}
  .mp-orange--result .mp-ring{width:clamp(84px,24vw,110px)}
  .mp-orange--result .mp-ring b{font-size:22px}
  .mp-orange--result .mp-open{padding:12px 14px}
  .mp-orange--result .mp-open b{font-size:clamp(28px,8.4vw,38px)}
  .mp-orange--result .mp-open small{font-size:12px;line-height:1.35}
  .mp-orange--result .mp-hero-foot,.mp-orange--result .mp-open small{display:none}
  .mp-orange--result .mp-eyebrow{font-size:12px}
  .mp-crown{display:none}
  .mp-resultbody{gap:14px;padding:18px;overflow:visible;min-height:auto}
  .mp-topics{flex:none}
  .mp-resultbody .mp-setup-deco{display:none}
  .mp-rhead{padding-right:0}
  .mp-rhead h2{font-size:clamp(24px,7vw,30px)}
  .mp-topics{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .mp-tcell{padding:12px 14px}.mp-tcell b{font-size:15px}.mp-tcell span{font-size:13px}
  .mp-actions{position:sticky;bottom:0;z-index:3;margin:2px -4px -4px;padding:14px 4px 4px;background:linear-gradient(to top,#fff 72%,rgba(255,255,255,0))}
  .mp-actions .mp-btn{flex:1 1 130px;min-height:50px}
  .mp-setup-head .mp-eyebrow{display:none}
  .mp-tile{min-height:clamp(44px,6.2vh,58px)}
}
@media (max-width:860px) and (min-height:1100px){.mp-rules{display:grid}}
@media (max-width:860px){.mp-perks{gap:6px;margin:0}.mp-perks span,.mp-perks li::after{display:none}.mp-perks li{padding:5px 14px 5px 5px;border-radius:999px}.mp-perks i{width:34px}.mp-perks div{padding:0}.mp-perks b{font-size:clamp(13px,3.8vw,16px);line-height:1.2}}
@media (max-width:860px) and (min-height:900px){.mp-perks li{padding:8px 16px 8px 8px}.mp-perks i{width:42px}.mp-perks div{gap:2px}.mp-perks span{display:block;font-size:13px}.mp-perks b{font-size:16px}}
@media (max-width:860px){.mp-perkstats,.mp-setup.is-free .mp-sub{display:none}}
@media (max-width:860px) and (max-height:699px){.mp-perks{display:none}}
@media (min-width:861px) and (max-height:700px){.mp-perks span{display:none}.mp-perks li{padding:8px 16px 8px 8px}.mp-perks li::after{font-size:28px}}
@media (max-width:860px) and (max-height:899px){.mp-orange--result .mp-mascot-img,.mp-setup .mp-glabel{display:none}}
@media (max-width:860px) and (max-height:700px){.mp-orange{padding:10px 14px;gap:8px}.mp-setup{gap:8px;padding:12px 14px}.mp-setup .mp-sub,.mp-setup .mp-glabel,.mp-setup-deco{display:none}.mp-groups{gap:6px}.mp-stat{padding:6px 10px}.mp-hero-foot .mp-mascot-img{height:54px}.mp-tile{min-height:42px}.mp-locked{padding:8px 16px}.mp-locked b{font-size:34px}}
@media (min-width:861px) and (max-height:700px){.mp-setup .mp-glabel,.mp-setup-deco{display:none}.mp-groups{gap:6px}.mp-setup{gap:10px}.mp-stat{padding:6px 12px}}
/* Telefonda mavzular bo‘yicha katakchalar faqat joy yetarli bo‘lsa (balandlik ≥ 760px) ko‘rsatiladi. */
@media (max-width:600px) and (max-height:759px){.mp-resultbody > .mp-glabel,.mp-topics{display:none}.mp-resultbody{gap:16px}}
@media (prefers-reduced-motion:reduce){.mp-root *,.mp-root *::before,.mp-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

// ── Ovoz (ixtiyoriy; brauzer bloklasa test ishlayveradi) ──
function useSfx(enabled = true) {
  const contextRef = useRef(null);
  useEffect(() => () => {
    contextRef.current?.close?.();
    contextRef.current = null;
  }, []);
  const play = useCallback((notes) => {
    if (typeof window === "undefined" || !enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const context = contextRef.current ?? new AudioContextClass();
      contextRef.current = context;
      if (context.state === "suspended") void context.resume();
      let at = context.currentTime;
      notes.forEach(([from, to, length]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(from, at);
        oscillator.frequency.exponentialRampToValueAtTime(to, at + length * 0.8);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.08, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + length + 0.02);
        at += length * 0.85;
      });
    } catch {
      // Audio bloklangan bo‘lsa, diagnostika baribir ishlaydi.
    }
  }, [enabled]);
  return useMemo(() => ({
    correct: () => play([[660, 880, 0.18]]),
    wrong: () => play([[330, 220, 0.24]]),
    skip: () => play([[392, 330, 0.18]]),
    finish: () => play([[523, 523, 0.14], [659, 659, 0.14], [784, 1046, 0.28]]),
    tick: () => play([[880, 880, 0.08]]),
  }), [play]);
}

// ── Storage ──
function safeLoadSession(storageKey, itemMap, propGrade) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isRestorableSession(parsed, itemMap, propGrade) ? parsed : null;
  } catch {
    return null;
  }
}
function saveSession(storageKey, session) {
  if (typeof window === "undefined") return;
  try {
    if (session.phase === "quiz") window.localStorage.setItem(storageKey, JSON.stringify(session));
    else window.localStorage.removeItem(storageKey);
  } catch {
    // Private rejimda storage yopiq bo‘lishi mumkin — test xotirada ishlaydi.
  }
}

// ── Kichik komponentlar ──
// Rasm yuklanmasa (host /art ni bermasa) interfeys buzilmaydi: zaxira ko‘rsatiladi yoki hech narsa.
function Pic({ name, className, style, fallback = null }) {
  const base = useContext(ArtContext);
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  // Bitta JSX fayl bo‘lgani uchun next/image emas, oddiy <img> ishlatiladi.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} style={style} src={artUrl(name, base)} alt="" draggable={false} onError={() => setFailed(true)} />;
}

function MascotFallback() {
  return (
    <svg className="mp-mascot" viewBox="0 0 64 64" aria-hidden="true">
      <line x1="32" y1="7" x2="32" y2="15" stroke="#fe5b1a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="6" r="4" fill="#fe5b1a" />
      <rect x="7" y="15" width="50" height="41" rx="15" fill="#fff" stroke="#151515" strokeWidth="3" />
      <circle cx="22" cy="32" r="4.5" fill="#151515" />
      <circle cx="42" cy="32" r="4.5" fill="#151515" />
      <path d="M22 42 Q32 52 42 42" fill="none" stroke="#151515" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Decor() {
  return (
    <div className="mp-decor" aria-hidden="true">
      {DECOR.map((item) => (
        <Pic key={item.name} name={item.name} style={{ [item.side]: "1.4%", top: `${item.top}%`, width: item.size, animationDelay: `${item.delay}s` }} />
      ))}
    </div>
  );
}

function Confetti() {
  return (
    <div className="mp-confetti" aria-hidden="true">
      {Array.from({ length: 34 }, (_, index) => (
        <i key={index} style={{
          left: `${(index * 29 + 7) % 100}%`,
          background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          animationDelay: `${(index % 9) * 0.12}s`,
          animationDuration: `${2.2 + (index % 5) * 0.35}s`,
          transform: `rotate(${index * 37}deg)`,
        }} />
      ))}
    </div>
  );
}

// Bitta matematik ifoda: KaTeX bo‘lsa — chiroyli, bo‘lmasa — oddiy Unicode.
function Tex({ tex }) {
  const lib = useContext(KatexContext);
  const html = useMemo(() => {
    if (!lib) return null;
    try { return lib.renderToString(tex, { throwOnError: false, strict: "ignore" }); } catch { return null; }
  }, [lib, tex]);
  if (!html) return <span className="mp-tex-plain">{texToPlain(tex)}</span>;
  return <span className="mp-tex" dangerouslySetInnerHTML={{ __html: html }} />;
}

// Savol matni: so‘zlar birin-ketin paydo bo‘ladi, ifodalar esa rangli “tabletka” ichida sakrab chiqadi.
function QuestionText({ text }) {
  let order = 0;
  const delay = () => `${Math.min(order++ * 55, 900)}ms`;
  return (
    <>
      {splitMath(text).map((part, partIndex) => {
        if (part.math) return <span key={`m${partIndex}`} className="mp-mpill" style={{ "--d": delay() }}><Tex tex={part.value} /></span>;
        return part.value.split(/(\s+)/).map((chunk, chunkIndex) => (
          /^\s+$/.test(chunk) || chunk === ""
            ? chunk
            : <span key={`w${partIndex}-${chunkIndex}`} className="mp-w" style={{ "--d": delay() }}>{chunk}</span>
        ));
      })}
    </>
  );
}

function AnswerView({ item, lang }) {
  if (item.type === "choice" && item.optionTex) return <b><Tex tex={pickText(item.optionTex[item.correct], lang)} /></b>;
  const first = Array.isArray(item.answer) ? item.answer[0] : item.answer;
  const fraction = item.type === "number" ? /^(-?\d+)\/(\d+)$/.exec(first) : null;
  if (fraction) return <b><Tex tex={`\\dfrac{${fraction[1]}}{${fraction[2]}}`} /></b>;
  return <b>{correctAnswerText(item, lang)}</b>;
}

function stepState(response, index, activeIndex) {
  if (response) return response.skipped ? "is-skip" : response.correct ? "is-ok" : "is-bad";
  return index === activeIndex ? "is-now" : "";
}

function Progress({ total, responses, activeIndex }) {
  return (
    <div className="mp-seg" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={responses.length}>
      {Array.from({ length: total }, (_, index) => <i key={index} className={stepState(responses[index], index, activeIndex)} />)}
    </div>
  );
}

function Dialog({ ui, onCancel, onConfirm }) {
  return (
    <div className="mp-overlay" role="dialog" aria-modal="true" aria-labelledby="mp-exit-title">
      <section className="mp-dialog">
        <h2 id="mp-exit-title">{ui.exitTitle}</h2>
        <p>{ui.exitText}</p>
        <div>
          <button type="button" className="mp-btn mp-btn--soft" onClick={onCancel}>{ui.keep}</button>
          <button type="button" className="mp-btn mp-btn--shine" onClick={onConfirm}>{ui.confirmExit}</button>
        </div>
      </section>
    </div>
  );
}

function IntroScreen({ ui, name, grade, lockedGrade, onPick, onStart, onHome }) {
  const plan = grade ? getPlan(grade) : null;
  const noTest = Boolean(grade) && !requiresTest(grade);
  const total = plan ? planTotal(plan) : 0;
  const minutes = plan ? estimateMinutes(total) : null;
  return (
    <div className="mp-stage">
      <div className="mp-intro">
        <section className="mp-orange mp-hero" data-mood={moodOf(grade)}>
          <button type="button" className="mp-glass" onClick={onHome}>← {ui.back}</button>
          <div className="mp-hero-copy">
            <p className="mp-eyebrow mp-eyebrow--light mp-rise" style={{ "--d": "0ms" }}>{ui.hello(name)}</p>
            <h1 key={noTest ? "free" : "test"} className="mp-rise" style={{ "--d": "90ms" }}>{noTest ? ui.noTestIntroTitle : ui.introTitle}</h1>
            {noTest && <ol className="mp-perks">
              {ui.perks.map((perk, index) => (
                <li key={perk.title} style={{ "--d": `${450 + index * 750}ms` }}>
                  <i><Pic name={PERK_ICONS[index]} /></i>
                  <div><b>{perk.title}</b><span>{perk.text}</span></div>
                </li>
              ))}
            </ol>}
            {!noTest && <ol className="mp-rules">
              {ui.rules.map((rule, index) => (
                <li key={rule} className="mp-rise" style={{ "--d": `${240 + index * 150}ms` }}>
                  <i><Pic name={RULE_ICONS[index]} /></i>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>}
          </div>
          <Pic name={ART.sparkles} className="mp-spark" />
          <div className="mp-hero-foot">
            <div className="mp-chips">
              {!noTest && <span className="mp-chip"><Pic name={ART.iconTime} />{minutes ? ui.minutes(minutes) : ui.minutesRange}</span>}
              {plan && <span className="mp-chip"><Pic name={ART.iconQuestions} />{ui.questionsCount(total)}</span>}
            </div>
            <Pic name={ART.waving} className="mp-mascot-img" fallback={<MascotFallback />} />
          </div>
        </section>
        <section className={`mp-card mp-setup ${noTest ? "is-free" : ""}`}>
          <Pic name={ART.books} className="mp-setup-deco" />
          <div className="mp-setup-head">
            <p className="mp-eyebrow mp-rise" style={{ "--d": "0ms" }}>{ui.yourGrade}</p>
            <h2 className="mp-rise" style={{ "--d": "60ms" }}>{ui.pickGrade}</h2>
            <p className="mp-sub mp-rise" style={{ "--d": "140ms" }}>{ui.pickHint}</p>
          </div>
          {lockedGrade && grade ? (
            <div className="mp-locked mp-rise" style={{ "--d": "200ms" }}><b>{grade}</b><span>{ui.gradeWord}</span></div>
          ) : (
            <div className="mp-groups" role="radiogroup" aria-label={ui.pickGrade}>
              {GRADE_GROUPS.map(([from, to], groupIndex) => (
                <div key={from} className="mp-group">
                  <span className="mp-glabel mp-rise" style={{ "--d": `${120 + groupIndex * 90}ms` }}>{ui.groups[groupIndex]}</span>
                  <div className="mp-tiles">
                    {Array.from({ length: to - from + 1 }, (_, offset) => from + offset).map((value) => (
                      <button key={value} type="button" role="radio" aria-checked={grade === value} className={`mp-tile ${grade === value ? "is-on" : ""}`}
                        style={{ "--d": `${160 + value * 38}ms` }} onClick={() => onPick(value)}>
                        <b>{value}</b><span>{ui.gradeWord}</span>
                        {grade === value && <em aria-hidden="true">✓</em>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {noTest ? (
            <>
              <div className="mp-notice" aria-live="polite"><Pic name={ART.iconDone} /><span>{ui.noTestHint}</span></div>
              <div className="mp-stats is-ready mp-perkstats">
                {ui.perkStats.map(([label, value], index) => (
                  <div key={label} className="mp-stat" style={{ "--d": `${900 + index * 750}ms` }}>
                    <Pic name={PERK_ICONS[index]} />
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
          <div className={`mp-stats ${plan ? "is-ready" : ""}`} aria-live="polite">
            <div className="mp-stat">
              <Pic name={ART.iconQuestions} />
              <span>{ui.statQuestions}</span>
              <b key={`q${plan ? planTotal(plan) : "-"}`}>{plan ? planTotal(plan) : "—"}</b>
            </div>
            <div className="mp-stat">
              <Pic name={ART.iconTime} />
              <span>{ui.statTime}</span>
              <b key={`t${minutes ?? "-"}`}>{minutes ? `≈${minutes}` : "—"}<small>{minutes ? ui.timeUnit : ""}</small></b>
            </div>
            <div className="mp-stat">
              <Pic name={ART.iconLesson} />
              <span>{ui.statGrade}</span>
              <b key={`g${grade ?? "-"}`}>{grade ?? "—"}</b>
            </div>
          </div>
          )}
          <button type="button" className="mp-btn mp-btn--lg mp-btn--block mp-btn--glow mp-btn--shine" disabled={!grade} onClick={onStart}>{noTest ? ui.startLessons : ui.start} <span className="mp-arrow">→</span></button>
        </section>
      </div>
    </div>
  );
}

function QuestionCard({ item, ui, lang, seed, index, total, reaction, senior, onAnswer, onNext }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const answered = reaction?.response ?? null;
  const state = answered ? (answered.skipped ? "skip" : answered.correct ? "ok" : "bad") : "idle";
  const order = useMemo(() => (item.type === "choice" ? seededShuffle(item.options.map((_, i) => i), seed, `opts-${item.id}`) : []), [item, seed]);
  const messageIndex = hashString(`${seed}:${item.id}`);
  const message = state === "ok" ? ui.correct[messageIndex % ui.correct.length] : state === "bad" ? ui.wrong[messageIndex % ui.wrong.length] : ui.skipped;
  // Faqat to‘liq (qirqilmagan) pozalar: point va thumbs rasmlari chetidan kesilgan, shuning uchun ishlatilmaydi.
  const pose = state === "ok" ? (senior || messageIndex % 2 ? ART.checklist : ART.celebrate) : state === "bad" ? ART.pencil : state === "skip" ? ART.laptop : ART.think;
  const isLast = index === total - 1;
  const isChoice = item.type === "choice";
  const submitNumber = () => {
    if (answered) return;
    if (!value.trim()) { setError(ui.empty); return; }
    setError("");
    onAnswer({ value: value.trim(), text: value.trim(), skipped: false });
  };
  const skip = () => onAnswer({ value: null, text: null, skipped: true });
  // Faqat raqam va . , / − belgilari qabul qilinadi; harf kiritilsa jimgina olib tashlanadi (12 belgigacha).
  const cleanInput = (text) => text.replace(/[^0-9.,/\-−\s]/g, "").slice(0, 12);
  const insertSymbol = (symbol) => {
    if (answered) return;
    const field = inputRef.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? start;
    const next = cleanInput(`${value.slice(0, start)}${symbol}${value.slice(end)}`);
    setValue(next);
    setError("");
    requestAnimationFrame(() => {
      if (!field) return;
      field.focus();
      const caret = Math.min(start + 1, next.length);
      field.setSelectionRange(caret, caret);
    });
  };
  return (
    <article className="mp-card mp-qcard" data-state={state} data-item={item.id}>
      <div className="mp-qmain">
        <div className="mp-qhead">
          <span className="mp-topic"><b>{DOMAIN_GLYPH[item.domain]}</b>{ui.domains[item.domain]}</span>
          <Pic key={`mini-${pose}`} name={pose} className="mp-minimasc" />
        </div>
        <h2 className="mp-q"><QuestionText text={pickText(item.q, lang)} /></h2>
        {isChoice ? (
          <div className="mp-opts">
            {order.map((optionIndex, position) => {
              const isRight = optionIndex === item.correct;
              const text = pickText(item.options[optionIndex], lang);
              const cls = answered ? (isRight ? "is-ok" : answered.answer === text ? "is-bad" : "is-dim") : "";
              return (
                <button key={optionIndex} type="button" data-opt={optionIndex} className={`mp-opt ${cls}`} disabled={Boolean(answered)}
                  style={{ "--d": `${300 + position * 70}ms` }} onClick={() => onAnswer({ value: optionIndex, text, skipped: false })}>
                  <i>{String.fromCharCode(65 + position)}</i>
                  {item.optionTex ? <Tex tex={pickText(item.optionTex[optionIndex], lang)} /> : text}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <input ref={inputRef} className={`mp-input ${answered ? (answered.correct ? "is-ok" : "is-bad") : ""}`} value={answered ? (answered.answer ?? "") : value}
              onChange={(event) => { setValue(cleanInput(event.target.value)); if (error) setError(""); }}
              onKeyDown={(event) => { if (event.key === "Enter") submitNumber(); }}
              disabled={Boolean(answered)} placeholder={ui.placeholder} aria-label={ui.placeholder}
              inputMode="decimal" enterKeyHint="done" autoComplete="off" autoCapitalize="off" autoFocus />
            <div className="mp-keys" role="group" aria-label={ui.keysLabel}>
              {NUMBER_KEYS.map(([symbol, keyName]) => (
                <button key={keyName} type="button" className="mp-key" data-key={symbol} aria-label={ui.keys[keyName]} title={ui.keys[keyName]}
                  disabled={Boolean(answered)} onMouseDown={(event) => event.preventDefault()} onClick={() => insertSymbol(symbol)}>{symbol}</button>
              ))}
            </div>
            {error && <p className="mp-error" role="alert">{error}</p>}
          </div>
        )}
      </div>
      <aside className="mp-qside"><div className="mp-qpic"><Pic key={pose} name={pose} fallback={<MascotFallback />} /></div></aside>
      <footer className="mp-qbar">
        {answered ? (
          <>
            <div className={`mp-fbtext mp-fbtext--${state}`} role="status" aria-live="polite">
              <i aria-hidden="true">{state === "ok" ? "✓" : state === "bad" ? "✕" : "–"}</i>
              <div>
                <strong>{message}</strong>
                {state !== "ok" && <span>{ui.rightAnswer}: <AnswerView item={item} lang={lang} /></span>}
              </div>
            </div>
            <button type="button" className={`mp-btn mp-btn--shine ${state === "ok" ? "" : "mp-btn--glow"}`} onClick={onNext}>{isLast ? ui.seeResult : ui.next} <span className="mp-arrow">→</span></button>
            {state === "ok" && <i className="mp-timer" style={{ animationDuration: `${REACTION_MS.ok}ms` }} />}
          </>
        ) : (
          <>
            <button type="button" className="mp-btn mp-btn--soft" onClick={skip}>{ui.skip}</button>
            {isChoice
              ? <span className="mp-barhint">{ui.pickOne}</span>
              : <button type="button" className="mp-btn mp-btn--shine" onClick={submitNumber}>{ui.check} ✓</button>}
          </>
        )}
      </footer>
    </article>
  );
}

function QuizScreen({ item, ui, lang, seed, index, total, responses, reaction, senior, soundOn, onToggleSound, onAnswer, onNext, onExit }) {
  return (
    <div className="mp-stage">
      <div className="mp-focus">
        <header className="mp-top">
          <Progress total={total} responses={responses} activeIndex={index} />
          <span className="mp-counter">{index + 1} / {total}</span>
          <SoundToggle on={soundOn} onToggle={onToggleSound} ui={ui} />
          <button type="button" className="mp-icon-btn" onClick={onExit} aria-label={ui.exit} title={ui.exit}>✕</button>
        </header>
        <QuestionCard key={item.id} item={item} ui={ui} lang={lang} seed={seed} index={index} total={total} reaction={reaction} senior={senior} onAnswer={onAnswer} onNext={onNext} />
      </div>
    </div>
  );
}

function ResultScreen({ ui, name, result, senior, onHome }) {
  const tested = DOMAIN_IDS.filter((domain) => result.skillStats[domain].total > 0);
  const offset = 326.7 * (1 - result.accuracy);
  const pose = senior
    ? (result.baseLevel === "weak" ? ART.laptop : ART.checklist)
    : result.perfectScore ? ART.trophy : result.baseLevel === "strong" ? ART.celebrate : result.baseLevel === "partial" ? ART.checklist : ART.books;
  const atOwnGrade = result.ownGradeUnlocked && result.openGrade === result.studentGrade;
  return (
    <div className="mp-stage">
      {!senior && <Confetti />}
      <div className="mp-resultgrid">
        <section className="mp-orange mp-hero mp-orange--result">
          {atOwnGrade && !senior && <Pic name={ART.crown} className="mp-crown" />}
          <Pic name={ART.sparkles} className="mp-spark" />
          <div className="mp-hero-copy">
            <p className="mp-eyebrow mp-eyebrow--light mp-rise" style={{ "--d": "0ms" }}>{ui.resultEyebrow}</p>
            <h1 className="mp-rise" style={{ "--d": "90ms" }}>{ui.resultTitle(name)}</h1>
          </div>
          <div className="mp-res-main mp-rise" style={{ "--d": "220ms" }}>
            <div className="mp-ring" style={{ "--off": offset }}>
              <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="bg" cx="60" cy="60" r="52" /><circle className="fg" cx="60" cy="60" r="52" /></svg>
              <b>{result.score}/{result.totalQuestions}</b>
            </div>
            <div className="mp-open">
              <span className="mp-label">{ui.openTitle}</span>
              <b>{ui.openGrade(result.openGrade)}</b>
              <small>{atOwnGrade ? ui.openNotePerfect : ui.openNoteBelow(result.openGrade)}</small>
            </div>
          </div>
          <div className="mp-hero-foot">
            <div className="mp-chips mp-rise" style={{ "--d": "380ms" }}>
              <span className="mp-chip"><Pic name={ART.iconDone} />{ui.scoreLabel}: {result.score}/{result.totalQuestions}</span>
              <span className="mp-chip"><Pic name={ART.iconLesson} />{ui.base[result.baseLevel]}</span>
            </div>
            <Pic name={pose} className="mp-mascot-img" fallback={<MascotFallback />} />
          </div>
        </section>
        <section className="mp-card mp-resultbody">
          <Pic name={ART.chart} className="mp-setup-deco" />
          <div className="mp-rhead">
            <p className="mp-eyebrow mp-rise" style={{ "--d": "60ms" }}>{ui.baseTitle}</p>
            <h2 className={`mp-rise mp-rhead--${result.baseLevel}`} style={{ "--d": "130ms" }}>{ui.base[result.baseLevel]}</h2>
            <p className="mp-sub mp-rise" style={{ "--d": "200ms" }}>{ui.baseNote[result.baseLevel]}</p>
          </div>
          <span className="mp-glabel mp-rise" style={{ "--d": "260ms" }}>{ui.topicsTitle}</span>
          <div className="mp-topics">
            {tested.map((domain, index) => {
              const stat = result.skillStats[domain];
              return (
                <div key={domain} className={`mp-tcell mp-tcell--${stat.status}`} style={{ animationDelay: `${0.35 + index * 0.08}s` }}>
                  <b>{ui.domains[domain]}</b>
                  <span>{ui.status[stat.status]} · {stat.correct}/{stat.total}</span>
                  <i className="mp-tbar" aria-hidden="true"><u style={{ width: `${Math.round(stat.accuracy * 100)}%` }} /></i>
                </div>
              );
            })}
          </div>
          <div className="mp-actions mp-rise" style={{ "--d": `${450 + tested.length * 60}ms` }}>
            <button type="button" className="mp-btn mp-btn--glow mp-btn--shine" onClick={onHome}>{ui.finish} <span className="mp-arrow">→</span></button>
          </div>
        </section>
      </div>
    </div>
  );
}

function IncompleteScreen({ ui, incomplete, onRetake, onHome }) {
  return (
    <div className="mp-stage">
      <section className="mp-card mp-incomplete">
        <Pic name={ART.laptop} fallback={<MascotFallback />} />
        <p className="mp-eyebrow">{ui.incompleteEyebrow}</p>
        <h1>{ui.incompleteTitle}</h1>
        <p>{ui.incompleteText}</p>
        <strong>{ui.incompleteProgress(incomplete.answeredCount, incomplete.totalQuestions)}</strong>
        <div className="mp-actions" style={{ width: "100%" }}>
          <button type="button" className="mp-btn mp-btn--soft" onClick={onHome}>{ui.finish}</button>
          <button type="button" className="mp-btn mp-btn--glow mp-btn--shine" onClick={onRetake}>{ui.retake}</button>
        </div>
      </section>
    </div>
  );
}

// Ovozni yoqish/o‘chirish tugmasi (standart — yoqiq). Testda sarlavhada, boshqa ekranlarda yuqori o‘ng burchakda.
function SoundToggle({ on, onToggle, ui, floating = false }) {
  const label = on ? ui.soundOff : ui.soundOn;
  return (
    <button type="button" className={`mp-icon-btn mp-sound ${floating ? "is-floating" : ""}`} aria-pressed={on} aria-label={label} title={label} onClick={onToggle}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" />
        {on ? (<><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" /></>) : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
      </svg>
    </button>
  );
}

// 1-sinf: savol yo‘q — do‘stona oyna, to‘g‘ridan-to‘g‘ri darslarga.
function NoTestScreen({ ui, name, onHome }) {
  return (
    <div className="mp-stage">
      <section className="mp-card mp-incomplete mp-notest">
        <Pic name={ART.celebrate} className="mp-rise" fallback={<MascotFallback />} />
        <p className="mp-eyebrow mp-rise" style={{ "--d": "80ms" }}>{ui.hello(name)}</p>
        <h1 className="mp-rise" style={{ "--d": "140ms" }}>{ui.noTestTitle}</h1>
        <p className="mp-rise" style={{ "--d": "220ms" }}>{ui.noTestText}</p>
        <button type="button" className="mp-btn mp-btn--lg mp-btn--glow mp-btn--shine mp-rise" style={{ "--d": "300ms" }} onClick={onHome}>{ui.startLessons} <span className="mp-arrow">→</span></button>
      </section>
    </div>
  );
}

// Tugagan natija va ovoz sozlamasi brauzerda saqlanadi.
function loadCompleted(storageKey, propGrade) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${storageKey}-done`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isRestorableResult(parsed, propGrade) ? parsed : null;
  } catch {
    return null;
  }
}
function saveCompleted(storageKey, result) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(`${storageKey}-done`, JSON.stringify(result)); } catch { /* storage yopiq */ }
}
function loadSoundPref(storageKey) {
  if (typeof window === "undefined") return true;
  try { return window.localStorage.getItem(`${storageKey}-sound`) !== "off"; } catch { return true; }
}
function saveSoundPref(storageKey, on) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(`${storageKey}-sound`, on ? "on" : "off"); } catch { /* storage yopiq */ }
}

export { MATH_ITEMS, PLANS, getPlan, requiresTest, estimateMinutes, isSeniorGrade, buildNoTestResult, isRestorableResult, buildQueue, buildResult, buildResponse, answersMatch, isCorrectAnswer, isRestorableSession, validateMathBank, normalizeGrade, splitMath, texToPlain };

/**
 * @param {{
 *   lang?: "uz" | "ru" | "en",
 *   studentName?: string,
 *   studentGrade?: number | string,
 *   storageKey?: string,
 *   attemptSeed?: number,
 *   itemBank?: typeof MATH_ITEMS,
 *   assetBase?: string,
 *   katex?: { renderToString: (tex: string, options?: object) => string },
 *   katexBase?: string,
 *   onHome?: () => void,
 *   onProgress?: (event: { status: "in_progress" | "complete" | "incomplete", answeredCount: number, responses: object[], phase: string, response?: object, reasonCode?: string }) => void,
 *   onComplete?: (result: ReturnType<typeof buildResult>) => void,
 * }} props
 */
export default function MathPlacement({
  lang = "uz",
  studentName,
  studentGrade,
  storageKey = "math-placement-v1",
  attemptSeed,
  itemBank = MATH_ITEMS,
  assetBase = "/art",
  katex,
  katexBase = KATEX_BASE,
  onHome = () => {},
  onProgress,
  onComplete,
}) {
  const activeLang = LANGS.includes(lang) ? lang : "uz";
  const ui = CONTENT[activeLang];
  const propGrade = normalizeGrade(studentGrade);
  const name = (studentName ?? "").trim() || ui.defaultName;
  const itemMap = useMemo(() => new Map(itemBank.map((item) => [item.id, item])), [itemBank]);
  const [session, setSession] = useState(() => {
    const seed = attemptSeed ?? Date.now();
    const done = loadCompleted(storageKey, propGrade);
    if (done) {
      return { ...createInitialSession(seed, propGrade), phase: "result", studentGrade: done.studentGrade, result: done };
    }
    return safeLoadSession(storageKey, itemMap, propGrade) ?? createInitialSession(seed, propGrade);
  });
  const [soundOn, setSoundOn] = useState(() => loadSoundPref(storageKey));
  const [pickedGrade, setPickedGrade] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [reaction, setReaction] = useState(null);
  const [exitOpen, setExitOpen] = useState(false);
  const questionStartedAtRef = useRef(0);
  const completionReportedRef = useRef(false);
  const sfx = useSfx(soundOn);
  const katexLib = useKatex(katex, katexBase);

  useEffect(() => { saveSession(storageKey, session); }, [storageKey, session]);

  const answeredCount = session.responses.length;
  const activeIndex = reaction ? answeredCount - 1 : answeredCount;
  const currentItem = session.phase === "quiz" ? (reaction?.item ?? itemMap.get(session.queue[activeIndex]) ?? null) : null;
  const grade = propGrade ?? pickedGrade ?? session.studentGrade;
  const senior = isSeniorGrade(grade);
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    saveSoundPref(storageKey, next);
  };

  useEffect(() => {
    if (currentItem && !reaction) questionStartedAtRef.current = Date.now();
  }, [currentItem, reaction]);

  const begin = useCallback(() => {
    const plan = getPlan(grade);
    if (!plan) return;
    const queue = buildQueue(itemBank, plan, session.seed);
    completionReportedRef.current = false;
    setSession({ ...session, phase: "quiz", studentGrade: grade, plan, queue, responses: [], result: null, incomplete: null, startedAt: new Date().toISOString() });
  }, [grade, itemBank, session]);

  // 1-sinf: test yo‘q. Tayyor natija LMS ga yuboriladi va do‘stona oyna ochiladi.
  const startNoTest = useCallback(() => {
    const result = buildNoTestResult({ studentGrade: grade, lang: activeLang });
    setSession({ ...session, phase: "notest", studentGrade: grade, plan: null, queue: [], responses: [], result });
    if (!completionReportedRef.current) {
      completionReportedRef.current = true;
      onProgress?.({ status: "complete", answeredCount: 0, responses: [], phase: "notest" });
      onComplete?.(result);
    }
  }, [activeLang, grade, onComplete, onProgress, session]);

  useEffect(() => {
    if (countdown === null) return undefined;
    const timer = setTimeout(() => {
      if (countdown > 0) setCountdown(countdown - 1);
      else if (countdown === 0) { setCountdown(-1); begin(); }
      else setCountdown(null);
    }, countdown === -1 ? 460 : countdown === 0 ? 550 : 720);
    return () => clearTimeout(timer);
  }, [countdown, begin]);

  const answerCurrent = useCallback(({ value, text, skipped }) => {
    if (reaction || !currentItem) return;
    const correct = !skipped && isCorrectAnswer(currentItem, value);
    const response = buildResponse({
      item: currentItem, lang: activeLang, correct, skipped, answerText: text,
      answerTimeMs: Math.max(0, Date.now() - questionStartedAtRef.current),
    });
    const responses = [...session.responses, response];
    if (skipped) sfx.skip(); else if (correct) sfx.correct(); else sfx.wrong();
    setSession({ ...session, responses });
    setReaction({ response, item: currentItem });
    onProgress?.({ status: "in_progress", answeredCount: responses.length, response, responses, phase: "quiz", revised: false });
  }, [activeLang, currentItem, onProgress, reaction, session, sfx]);

  const advance = useCallback(() => {
    if (!reaction) return;
    setReaction(null);
    if (session.responses.length < session.queue.length) return;
    const completedAt = new Date().toISOString();
    const result = buildResult({ studentGrade: session.studentGrade, plan: session.plan, responses: session.responses, startedAt: session.startedAt, completedAt, lang: activeLang });
    setSession({ ...session, phase: "result", result });
    saveCompleted(storageKey, result);
    sfx.finish();
    if (!completionReportedRef.current) {
      completionReportedRef.current = true;
      onProgress?.({ status: "complete", answeredCount: result.answeredCount, responses: result.responses, phase: "result" });
      onComplete?.(result);
    }
  }, [activeLang, onComplete, onProgress, reaction, session, sfx, storageKey]);

  // Faqat to‘g‘ri javobdan keyin o‘zi o‘tadi; xato va “Bilmayman”dan keyin “Davom” tugmasi bosiladi.
  useEffect(() => {
    if (!reaction || !reaction.response.correct) return undefined;
    const timer = setTimeout(advance, REACTION_MS.ok);
    return () => clearTimeout(timer);
  }, [reaction, advance]);

  const resetTest = useCallback(() => {
    if (typeof window !== "undefined") {
      try { window.localStorage.removeItem(storageKey); } catch { /* storage yopiq */ }
    }
    completionReportedRef.current = false;
    setReaction(null);
    setCountdown(null);
    setExitOpen(false);
    setPickedGrade(null);
    setSession(createInitialSession(attemptSeed ?? Date.now(), propGrade));
  }, [attemptSeed, propGrade, storageKey]);

  const exitTest = useCallback(() => {
    setExitOpen(false);
    setReaction(null);
    completionReportedRef.current = false;
    const incomplete = {
      reasonCode: "STUDENT_EXITED_BEFORE_COMPLETION",
      answeredCount: session.responses.length,
      totalQuestions: session.queue.length,
      endedAt: new Date().toISOString(),
    };
    setSession({ ...session, phase: "incomplete", result: null, incomplete });
    onProgress?.({ status: "incomplete", phase: "incomplete", reasonCode: incomplete.reasonCode, answeredCount: incomplete.answeredCount, responses: session.responses });
  }, [onProgress, session]);

  const glow = session.phase === "quiz" && !senior ? GLOWS[Math.max(activeIndex, 0) % GLOWS.length] : GLOWS[0];
  let screen = null;
  if (session.phase === "intro") {
    screen = (
      <IntroScreen ui={ui} name={name} grade={grade} lockedGrade={propGrade !== null} onPick={setPickedGrade} onHome={onHome}
        onStart={() => { sfx.tick(); if (requiresTest(grade)) setCountdown(senior ? 2 : 3); else startNoTest(); }} />
    );
  } else if (session.phase === "quiz" && currentItem) {
    screen = (
      <QuizScreen item={currentItem} ui={ui} lang={activeLang} seed={session.seed} index={activeIndex} total={session.queue.length}
        responses={session.responses} reaction={reaction} senior={senior} soundOn={soundOn} onToggleSound={toggleSound}
        onAnswer={answerCurrent} onNext={advance} onExit={() => setExitOpen(true)} />
    );
  } else if (session.phase === "result" && session.result) {
    screen = <ResultScreen ui={ui} name={name} result={session.result} senior={senior} onHome={onHome} />;
  } else if (session.phase === "notest" && session.result) {
    screen = <NoTestScreen ui={ui} name={name} onHome={onHome} />;
  } else if (session.phase === "incomplete" && session.incomplete) {
    screen = <IncompleteScreen ui={ui} incomplete={session.incomplete} onRetake={resetTest} onHome={onHome} />;
  }

  return (
    <ArtContext.Provider value={assetBase}>
      <KatexContext.Provider value={katexLib}>
        <div className="mp-root" data-tone={senior ? "senior" : "junior"} style={{ "--glow": glow }}>
          <style>{CSS}</style>
          <Decor />
          {screen}
          {session.phase !== "quiz" && <SoundToggle on={soundOn} onToggle={toggleSound} ui={ui} floating />}
          {countdown !== null && (
            <div className={`mp-count ${senior ? "mp-count--calm" : ""} ${countdown === -1 ? "is-leaving" : ""}`} role="status" aria-live="assertive">
              <span key={Math.max(countdown, 0)} className={countdown <= 0 ? "is-go" : ""}>{countdown <= 0 ? (senior ? ui.goCalm : ui.go) : countdown}</span>
            </div>
          )}
          {exitOpen && <Dialog ui={ui} onCancel={() => setExitOpen(false)} onConfirm={exitTest} />}
        </div>
      </KatexContext.Provider>
    </ArtContext.Provider>
  );
}
