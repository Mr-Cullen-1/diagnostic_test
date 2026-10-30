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
 *              storageKey, attemptSeed, itemBank, assetBase, katex, katexBase, onHome, onProgress, onComplete,
 *              onFinished (+ ixtiyoriy studentName). Ingliz tilidagi studentAge o‘rniga studentGrade.
 *              Ovozli o‘qish: ttsApiBase (dars fayllaridagi kabi GET {ttsApiBase}/api/tts); bermasa brauzer speechSynthesis.
 *   onProgress({ status: "in_progress" | "complete" | "incomplete", answeredCount,
 *                response?, responses, phase, reasonCode? })
 *   onComplete(result)   — natija ekrani chiqqanda bir marta; erta chiqishda chaqirilmaydi
 *   onFinished(payload)  — o‘quvchi “Yakunlash” / “Darslarni boshlash” ni bosganda bir marta (ingliz tili diagnostikasidagi kabi):
 *                          { lessonId, lessonTitle, durationSec, ...result }; erta chiqilgan bo‘lsa completionType: "INCOMPLETE"
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- sinovlar (vm orqali) chaqiradi
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
// ── Ovozli o‘qish (TTS) uchun matn tayyorlash ──
// Dars fayllaridagi usul bilan bir xil: sonlar so‘z bilan, amallar nomi bilan aytiladi, KaTeX ifodalari gapga aylanadi.
const LANG_TAG = { ru: "[Русское произношение]", uz: "[O'zbekcha tallaffuz]", en: "[English pronunciation]" };
function buildTtsUrl(base, text, lang) {
  const tag = LANG_TAG[lang] ?? LANG_TAG.uz;
  const body = `${tag} ${String(text).slice(0, Math.max(0, 1000 - tag.length - 1))}`;
  return `${String(base).replace(/\/$/, "")}/api/tts?text=${encodeURIComponent(body).replace(/%5B/g, "[").replace(/%5D/g, "]")}&g=m`;
}

const SPEECH_NUMBERS = {
  uz: { 0: "nol", 1: "bir", 2: "ikki", 3: "uch", 4: "to'rt", 5: "besh", 6: "olti", 7: "yetti", 8: "sakkiz", 9: "to'qqiz", 10: "o'n", 20: "yigirma", 30: "o'ttiz", 40: "qirq", 50: "ellik", 60: "oltmish", 70: "yetmish", 80: "sakson", 90: "to'qson" },
  ru: {
    0: "ноль", 1: "один", 2: "два", 3: "три", 4: "четыре", 5: "пять", 6: "шесть", 7: "семь", 8: "восемь", 9: "девять", 10: "десять",
    11: "одиннадцать", 12: "двенадцать", 13: "тринадцать", 14: "четырнадцать", 15: "пятнадцать", 16: "шестнадцать", 17: "семнадцать",
    18: "восемнадцать", 19: "девятнадцать", 20: "двадцать", 30: "тридцать", 40: "сорок", 50: "пятьдесят", 60: "шестьдесят",
    70: "семьдесят", 80: "восемьдесят", 90: "девяносто",
  },
};
const RU_HUNDREDS = { 1: "сто", 2: "двести", 3: "триста", 4: "четыреста", 5: "пятьсот", 6: "шестьсот", 7: "семьсот", 8: "восемьсот", 9: "девятьсот" };
const RU_DENOMINATORS = {
  2: ["вторая", "вторых"], 3: ["третья", "третьих"], 4: ["четвертая", "четвертых"], 5: ["пятая", "пятых"], 6: ["шестая", "шестых"],
  7: ["седьмая", "седьмых"], 8: ["восьмая", "восьмых"], 9: ["девятая", "девятых"], 10: ["десятая", "десятых"],
  11: ["одиннадцатая", "одиннадцатых"], 12: ["двенадцатая", "двенадцатых"], 100: ["сотая", "сотых"],
};
const isNum = (value) => /^\d+$/.test(value);
function numberToWords(value, lang) {
  if (lang === "en") return String(value);
  const n = Number(value);
  const words = SPEECH_NUMBERS[lang] ?? SPEECH_NUMBERS.uz;
  if (!Number.isInteger(n) || n < 0 || n > 999999) return String(value);
  if (Object.prototype.hasOwnProperty.call(words, n)) return words[n];
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    let head;
    if (lang === "ru") {
      const lastTwo = thousands % 100;
      const last = thousands % 10;
      const form = lastTwo >= 11 && lastTwo <= 19 ? "тысяч" : last === 1 ? "тысяча" : last >= 2 && last <= 4 ? "тысячи" : "тысяч";
      head = `${numberToWords(thousands, lang).replace(/один$/, "одна").replace(/два$/, "две")} ${form}`;
    } else head = `${numberToWords(thousands, lang)} ming`;
    return rest ? `${head} ${numberToWords(rest, lang)}` : head;
  }
  if (n < 20 && lang === "uz") return `${words[10]} ${words[n - 10]}`;
  if (n < 100) return `${words[Math.floor(n / 10) * 10]} ${words[n % 10]}`.trim();
  const hundred = lang === "ru" ? RU_HUNDREDS[Math.floor(n / 100)] : `${words[Math.floor(n / 100)]} yuz`;
  const rest = n % 100;
  return rest ? `${hundred} ${numberToWords(rest, lang)}` : hundred;
}
function fractionToWords(numerator, denominator, lang) {
  if (lang === "en") return `${numerator} over ${denominator}`;
  if (lang === "ru") {
    const n = Number(numerator);
    const d = Number(denominator);
    const forms = RU_DENOMINATORS[d];
    const cardinal = numberToWords(n, lang);
    const numeratorWord = n % 100 >= 11 && n % 100 <= 19 ? cardinal : cardinal.replace(/один$/, "одна").replace(/два$/, "две");
    if (d === 0 || d === 1) return `${cardinal} разделить на ${numberToWords(d, lang)}`;
    return forms ? `${numeratorWord} ${n === 1 ? forms[0] : forms[1]}` : `${cardinal} разделить на ${numberToWords(d, lang)}`;
  }
  return `${numberToWords(denominator, lang)}dan ${numberToWords(numerator, lang)}`;
}
function decimalToWords(whole, fraction, lang) {
  if (lang === "en") return `${whole} point ${[...fraction].join(" ")}`;
  if (fraction.length > 3) {
    const digits = [...fraction].map((digit) => numberToWords(digit, lang)).join(" ");
    return lang === "ru" ? `${numberToWords(whole, lang)} целых, ${digits}` : `${numberToWords(whole, lang)} butun, ${digits}`;
  }
  if (lang === "ru") {
    const feminine = (value) => {
      const n = Number(value);
      const words = numberToWords(value, lang);
      if (n % 100 >= 11 && n % 100 <= 19) return words;
      if (n % 10 === 1) return words.replace(/один$/, "одна");
      if (n % 10 === 2) return words.replace(/два$/, "две");
      return words;
    };
    const wholeNumber = Number(whole);
    const fractionNumber = Number(fraction);
    const wholeForm = wholeNumber % 100 !== 11 && wholeNumber % 10 === 1 ? "целая" : "целых";
    const one = fractionNumber % 100 !== 11 && fractionNumber % 10 === 1;
    const place = one ? { 1: "десятая", 2: "сотая", 3: "тысячная" } : { 1: "десятых", 2: "сотых", 3: "тысячных" };
    return `${feminine(whole)} ${wholeForm} ${feminine(fraction)} ${place[fraction.length]}`;
  }
  return `${numberToWords(whole, lang)} butun ${{ 1: "o'ndan", 2: "yuzdan", 3: "mingdan" }[fraction.length]} ${numberToWords(fraction, lang)}`;
}

const SPEECH = {
  uz: {
    mul: " karra ", div: " bo'lingan ", ratio: " ga ", plus: " qo'shuv ", minus: " minus ", eq: " teng ", lt: " kichik ", gt: " katta ",
    le: " kichik yoki teng ", ge: " katta yoki teng ", ne: " teng emas ", approx: " taxminan ", deg: " daraja ", pct: " foiz ", pi: " pi ",
    dots: " va hokazo ", abs: "modul", fact: "faktorial",
    fn: { sin: "sinus", cos: "kosinus", tan: "tangens", cot: "kotangens" },
    letters: { x: "iks", y: "igrek", n: "en", b: "be", d: "de", q: "ku", r: "er" },
  },
  ru: {
    mul: " умножить на ", div: " разделить на ", ratio: " к ", plus: " плюс ", minus: " минус ", eq: " равно ", lt: " меньше ", gt: " больше ",
    le: " меньше или равно ", ge: " больше или равно ", ne: " не равно ", approx: " примерно ", deg: " градусов ", pct: " процентов ", pi: " пи ",
    dots: " и так далее ", abs: "модуль", fact: "факториал",
    fn: { sin: "синус", cos: "косинус", tan: "тангенс", cot: "котангенс" },
    letters: { x: "икс", y: "игрек", n: "эн", a: "а", b: "бэ", d: "дэ", q: "ку", r: "эр" },
  },
  en: {
    mul: " times ", div: " divided by ", ratio: " to ", plus: " plus ", minus: " minus ", eq: " equals ", lt: " less than ", gt: " greater than ",
    le: " less than or equal to ", ge: " greater than or equal to ", ne: " not equal to ", approx: " about ", deg: " degrees ", pct: " percent ", pi: " pi ",
    dots: " and so on ", abs: "absolute value of", fact: "factorial",
    fn: { sin: "sine", cos: "cosine", tan: "tangent", cot: "cotangent" },
    letters: {},
  },
};

const spokenNum = (value, lang) => (isNum(value) ? numberToWords(value, lang) : value);
function speakRoot(operand, lang) {
  const word = spokenNum(operand, lang);
  const simple = isNum(operand) || /^[A-Za-z]$/.test(operand);
  if (lang === "ru") return simple ? `корень из ${word}` : `корень из выражения ${word},`;
  if (lang === "en") return simple ? `square root of ${word}` : `square root of ${word},`;
  if (isNum(operand)) return `${word}ning kvadrat ildizi`;
  return simple ? `${word} ning kvadrat ildizi` : `kvadrat ildiz ostida ${word},`;
}
function speakFraction(top, bottom, lang) {
  if (lang === "ru") return `дробь, числитель ${top}, знаменатель ${bottom},`;
  if (lang === "en") return `fraction, numerator ${top}, denominator ${bottom},`;
  return `surati ${top}, maxraji ${bottom},`;
}
function speakLog(base, argument, lang) {
  if (lang === "ru") return `логарифм ${argument} по основанию ${base}`;
  if (lang === "en") return `log base ${base} of ${argument}`;
  return `${argument} ning ${base} asosli logarifmi`;
}
function speakIndex(letter, index, lang) {
  if (lang === "ru") return `${letter} с индексом ${index}`;
  if (lang === "en") return `${letter} sub ${index}`;
  return `${letter} indeks ${index}`;
}
// Daraja: qavs ichidagi asos “hammasi” deb aytiladi, shunda x + 3 ning kvadrati x + (3 kvadrat) bilan adashmaydi.
function speakPower(base, exponent, lang) {
  const paren = base.startsWith("(");
  const inner = spokenNum(paren ? base.slice(1, -1).trim() : base, lang);
  const power = spokenNum(exponent, lang);
  const square = exponent === "2";
  if (square || exponent === "3") {
    if (lang === "ru") return paren ? `${inner}, всё в ${square ? "квадрате" : "кубе"},` : `${inner} в ${square ? "квадрате" : "кубе"}`;
    if (lang === "en") return paren ? `${inner}, all ${square ? "squared" : "cubed"},` : `${inner} ${square ? "squared" : "cubed"}`;
    return paren ? `${inner}, hammasining ${square ? "kvadrati" : "kubi"},` : `${inner} ${square ? "kvadrat" : "kub"}`;
  }
  if (lang === "ru") return `${inner}${paren ? ", всё" : ""} в степени ${power}`;
  if (lang === "en") return `${inner}${paren ? ", all" : ""} to the power ${power}`;
  return paren ? `${inner}, hammasining ${power} darajasi,` : `${inner} ning ${power} darajasi`;
}
// edges=false: bo‘lak boshidagi nuqta (“…daraja. Uchidagi…”) saqlanadi; to‘liq gap yig‘ilgach bosh/oxiridagi tinish belgilari olinadi.
function tidySpeech(text, edges = true) {
  const tidy = text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])(?:\s*[,.;:])+/g, "$1")
    .replace(/,\s*([.!?])/g, "$1")
    .trim();
  return edges ? tidy.replace(/^[\s,.;:]+/, "") : tidy;
}
// Unicode belgilar va sonlar → so‘zlar (matn ham, KaTeX dan chiqqan ifoda ham shu bosqichdan o‘tadi).
function symbolsToWords(text, lang) {
  const T = SPEECH[lang];
  return text
    .replace(/(\d+)[.,](\d+)/g, (_, whole, fraction) => decimalToWords(whole, fraction, lang))
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_, top, bottom) => fractionToWords(top, bottom, lang))
    .replace(/([A-Za-z0-9]+)([²³⁴⁵⁶⁷⁸⁹]+)/g, (_, base, sup) => speakPower(base, [...sup].map((char) => SUPERSCRIPT.indexOf(char)).join(""), lang))
    .replace(/√\s*(\d+|[A-Za-z]|\([^()]*\))/g, (_, operand) => speakRoot(operand.replace(/^\(|\)$/g, "").trim(), lang))
    .replace(/([A-Za-z])([₀-₉]+)/g, (_, letter, sub) => speakIndex(letter, [...sub].map((char) => SUBSCRIPT.indexOf(char)).join(""), lang))
    .replace(/−/g, T.minus)
    .replace(/[×·]/g, T.mul).replace(/÷/g, T.div).replace(/∶/g, T.ratio)
    .replace(/≤/g, T.le).replace(/≥/g, T.ge).replace(/≠/g, T.ne).replace(/≈/g, T.approx)
    .replace(/</g, T.lt).replace(/>/g, T.gt).replace(/=/g, T.eq).replace(/\+/g, T.plus)
    .replace(/%/g, T.pct).replace(/°/g, T.deg).replace(/π/g, T.pi).replace(/…/g, T.dots)
    .replace(/\s*\/\s*/g, T.div);
}
// Yakuniy tozalash: 2x → “ikki iks”, qolgan raqamlar → so‘z, o‘qib bo‘lmaydigan belgilar olib tashlanadi.
function finishSpeech(text, lang, keepDigits = false) {
  const letters = SPEECH[lang].letters;
  let result = text
    .replace(/(\d)-(?=\p{L})/gu, "$1 ")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/(^|[^A-Za-z'])([a-z])(?![A-Za-z'])/g, (match, before, letter) => (letters[letter] ? `${before}${letters[letter]}` : match));
  result = result.replace(/\d+/g, (digits) => (keepDigits || lang === "en" || digits.length > 6 ? digits : numberToWords(digits, lang)));
  return tidySpeech(result.replace(/[()[\]{}|]/g, " ").replace(/;/g, ",").replace(/[^\p{L}\p{N}\s.,!?:'-]/gu, " "), false);
}
// KaTeX (TeX) ifodasi → so‘zlar. Tuzilma (kasr, ildiz, daraja, logarifm…) birinchi, belgilar keyin.
function speakMath(tex, lang, ratio) {
  let s = String(tex).replace(/\{,\}/g, ",").replace(/\\(left|right)(?![A-Za-z])/g, "").replace(/\\[,;:! ]/g, " ");
  s = s.replace(/\^\{?\\circ\}?|\\circ/g, "°").replace(/-/g, " − ");
  for (let pass = 0; pass < 3; pass += 1) {
    s = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, top, bottom) => (
      isNum(top.trim()) && isNum(bottom.trim()) ? fractionToWords(top.trim(), bottom.trim(), lang) : speakFraction(top.trim(), bottom.trim(), lang)
    ));
  }
  // Tuzilma so‘zlari atrofida bo‘sh joy: a\sqrt{2} → “a ikkining kvadrat ildizi” (“aikkining” emas).
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, (_, operand) => ` ${speakRoot(operand.trim(), lang)} `).replace(/\\sqrt\s*(\w)/g, (_, operand) => ` ${speakRoot(operand, lang)} `);
  s = s.replace(/\\log_\{?(\w+)\}?\s*(\w+)/g, (_, base, argument) => ` ${speakLog(base, argument, lang)} `);
  s = s.replace(/\\(?:operatorname|text)\{([^{}]*)\}/g, "$1");
  s = s.replace(/(\([^()]*\)|[A-Za-z]|\d+(?:\.\d+)?)\^\{?([^{}\s]+)\}?/g, (_, base, exponent) => ` ${speakPower(base, exponent, lang)} `);
  s = s.replace(/([A-Za-z])_\{?(\w)\}?/g, (_, letter, index) => ` ${speakIndex(letter, index, lang)} `);
  s = s.replace(/\|([^|]+)\|/g, (_, inside) => ` ${SPEECH[lang].abs} ${inside} `);
  s = s.replace(/(\d+)!/g, `$1 ${SPEECH[lang].fact}`);
  s = s.replace(/\\(sin|cos|tan|cot)(?![A-Za-z])/g, (_, name) => ` ${SPEECH[lang].fn[name]} `)
    .replace(/(^|[^A-Za-z])(tg|ctg)(?![A-Za-z])/g, (_, before, name) => `${before} ${SPEECH[lang].fn[name === "tg" ? "tan" : "cot"]} `);
  s = s.replace(/\\(?:times|cdot)(?![A-Za-z])/g, "×").replace(/\\div(?![A-Za-z])/g, "÷").replace(/\\pi(?![A-Za-z])/g, "π")
    .replace(/\\le(?![A-Za-z])/g, "≤").replace(/\\ge(?![A-Za-z])/g, "≥").replace(/\\neq?(?![A-Za-z])/g, "≠").replace(/\\approx/g, "≈")
    .replace(/\\%/g, "%").replace(/\\[lc]?dots/g, "…").replace(/\\/g, "");
  s = s.replace(/\s*:\s*/g, ratio ? " ∶ " : " ÷ ").replace(/(\d)\s*\(/g, "$1 × (").replace(/\)/g, ", ");
  return finishSpeech(symbolsToWords(s, lang), lang);
}
// O‘zbek ovozlari qisqartmalarni (sm, km, m…) harfma-harf o‘qiydi — sondan keyin to‘liq so‘zga almashtiramiz.
const UZ_UNITS = { km: "kilometr", sm: "santimetr", mm: "millimetr", kg: "kilogramm", ml: "millilitr", m: "metr", g: "gramm", l: "litr" };
function expandUnits(text, lang) {
  if (lang === "uz") return text.replace(/(\d)\s*(km|sm|mm|kg|ml|m|g|l)(?![\p{L}'])/gu, (_, digit, unit) => `${digit} ${UZ_UNITS[unit]}`);
  if (lang === "ru") return text.replace(/км\/ч/g, "километров в час").replace(/м\/с/g, "метров в секунду");
  return text.replace(/km\/h/g, "kilometers per hour");
}
// Ruscha oddiy matnda butun sonlar raqam bo‘lib qoladi: ovoz o‘zi kelishikni to‘g‘ri aytadi (“в 4 коробках”). Ifodalarda — so‘z bilan.
function speakPlain(text, lang) {
  let s = expandUnits(String(text), lang)
    .replace(/(\d{1,3})\s(\d{3})(?!\d)/g, "$1$2").replace(/(\d{1,3})\s(\d{3})(?!\d)/g, "$1$2");
  if (lang === "en") s = s.replace(/(\d{1,3}),(\d{3})(?!\d)/g, "$1$2");
  s = s
    .replace(/[‘’ʻʼ`]/g, "'").replace(/[“”«»"]/g, "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/(^|[\s(])-(?=[\dA-Za-z(])/g, "$1 − ").replace(/\s-\s/g, " − ")
    .replace(/\s*:\s*/g, ", ");
  return finishSpeech(symbolsToWords(s, lang), lang, lang === "ru");
}
// Savol/javob/xabar matni ($…$ — KaTeX ifodasi) → ovozga tayyor gap.
function toSpeech(text, lang) {
  const language = LANGS.includes(lang) ? lang : "uz";
  const source = String(text ?? "");
  const ratio = /nisbat|отнош|ratio/i.test(source);
  return tidySpeech(splitMath(source).map((part) => (part.math ? speakMath(part.value, language, ratio) : speakPlain(part.value, language))).join(" "));
}
function questionSpeech(item, lang) {
  return toSpeech(pickText(item.q, lang), lang);
}
function answerSpeech(item, lang) {
  if (item.type === "choice" && item.optionTex) return toSpeech(`$${pickText(item.optionTex[item.correct], lang)}$`, lang);
  return toSpeech(correctAnswerText(item, lang), lang);
}
// </logic>

// ── LMS bilan aloqa: onFinished yuki ──
const LESSON_ID = "math-placement-v1";
const LESSON_TITLES = {
  uz: "Matematika bo‘yicha joylashtirish diagnostikasi",
  ru: "Диагностика уровня по математике",
  en: "Mathematics placement diagnostic",
};

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
    listen: "Eshitish",
    sayTest: (name, grade, count, minutes) => `Salom, ${name}! ${grade}-sinf uchun ${count} ta qisqa savol, taxminan ${minutes} daqiqa. Bilmasangiz, “Bilmayman” tugmasini bosing.`,
    sayFree: (name) => [`Salom, ${name}! Darslar siz uchun ochiq.`, "Kunlik darslar va vazifalar bilan coin va pointlar yig‘ing.", "Qo‘shimcha mashq uchun mavzuli mashqlar ham bor."],
    sayScore: (score, total) => `${total} ta savoldan ${score} tasiga to‘g‘ri javob berdingiz.`,
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
    listen: "Слушать",
    sayTest: (name, grade, count, minutes) => `Привет, ${name}! Для ${grade} класса ${count} коротких вопросов, примерно ${minutes} минут. Не знаешь — нажми «Не знаю».`,
    sayFree: (name) => [`Привет, ${name}! Уроки для тебя открыты.`, "Проходи ежедневные уроки и задания — копи коины и поинты.", "Для дополнительной практики есть упражнения по темам."],
    sayScore: (score, total) => `Верно отвечено на ${score} из ${total} вопросов.`,
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
    listen: "Listen",
    sayTest: (name, grade, count, minutes) => `Hi ${name}! ${count} short questions for grade ${grade}, about ${minutes} minutes. If you are not sure, tap “I do not know”.`,
    sayFree: (name) => [`Hi ${name}! Your lessons are open.`, "Finish daily lessons and tasks to collect coins and points.", "There are extra exercises by topic for more practice."],
    sayScore: (score, total) => `You answered ${score} of ${total} questions correctly.`,
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
const INLINE_ART = {"mascot-waving.png":"data:image/webp;base64,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","mascot-think.png":"data:image/webp;base64,UklGRgQzAABXRUJQVlA4WAoAAAAQAAAA9QAANgEAQUxQSFAGAAARoNtqexUJe8v65DZowaUgqIEciQYmnBqISLYVr+Q32Bls4Lv8lyQiJgD/ZZ7fJPmeIzUXni5ziFJhz/Akdo8Nr8yB4cVRSby6xCTxhhFJvGVAeM85HLxrNPJtSjB431ikG5VQlBsxFPzH4DcD6f0brYTPc4c5ELkNJ+c2BuLdhNNtJUi/TQzEfAmbSyBSy/uaORBoSdekSJQGnC5tCOU5nH4zNvg9gdOF7e9gAL8fZpwu7Ij4JnaNz5td0XP+qbXWn1eKAfumplR5ur78x74FjbmyvSbfvTvhfKrsWz2X2BfnX+w/+419cf6HV1avpS6/OP/itdVppccb5zOvrj5jR7Ty+lcM0Pq6AVME0MxbOiw1oTnf48dfaJnb6j3oPrTzpq+gMT61hqg2VHx8dXi5K52bO6ABX4e26i68z7xxVfqG2kSzZNr2UkiylC3fCvlbRt8zFSeTfbKx+3SX6+s3eCEXXj/dIxeShakX8PqTcd6sjY21x/aH5HAdT3brmU3aeLp+6L4UktyvSTx9n2qOFN59KSR5BRtvw+aqW+bZehty2Uju3dg63yOxPSmWebLw7stG8ia8Q2JPaJ15svKRSyWLAvlV2Vkn4cnCxy4LyYe9eOGs0UYtl52UB/3wUuhLTZeF3B7Da1/aTPxeVCAXcn9G5sXQdafCC7m1lJbcJ/PipIlQ6YWcGtCCvrz4B3oKv1dtuJDSMJ9LfXhxhZqJqi9kA/KJgr75ogotB2q/kA3A74eS0JnX/kDJRP2XhaUFQEL/dE2CjgNNXCo7XPlzxQs6DrRyIe/E/hk6Cu1cFm5PeyVoSVOXygdlaLrR2IW8T26YoWmiucvKg+Qxyg1w7gea8msxhAu/r9fhFBTdaP54Geq3rIfQg8dlQP7wgpo7nXjBzI8zdKUbj16JJ5MiOz9XB/Dok3haD/ry6MJGJSZ6c+xQW14q0KEd2KwBP1dXUL9Mp7YkdXaGjI5tgDL0rOiV6NuG3JKflPixuCWfQ23AgzM/Vvq1AfUUHjzTv7kB+PbCgzd6uAnIlT8JT57pYml7/EwfH9pkelmZRDeLLvTzoQo/VhdRE7pakT1mmb4+1KC3tWDM5qAxZnT4qEHyGDVgzCRo/FyD5u3nbUHj5xo0dz9uc9r6ODpdtCjeghbuflxy2vq4zWl4PP9NQczWoCFmiBliJjGDkt7KiBn+4ZmDBl8dQduDNukx+ErUGOlraLnS17sWmc6elBB6G0rS23vQRInRWweUPLwlWtDZO2KGmE1BQ8wQsyEK5WYTonDzDSHboOvopQ3aOmlEyDJCJlB49c8Gnd0jiFiG2qNnDmjuGOjulPWA9tkpg2gHp6yjaHe4hOs6inLiE67rqBycwnXMyolX1lV0g1O4HqtycAqPY1TucArJrBv8QnLUTDxDKgbfUDH4hooNvqFecA71gnOoF5xDvcQ5FK0wOoeTVhidQ2qF7J1VK8A5zGrh8A1HtQDfUDEAx58VAPxB1U4Xd9AIwB2kEcjuoBGAeINWAJDiCtrxceuR11qLQZMtXWm1bUK7d8toul0DbS9WFVpvVKH5u0mFDrRoogfFHqELd3t2H9CcXGK2xSxtjJjQjcYwZozZ6ojNEqEjYSljRk9uhmRXwE6hJydDVlfATqEnYehhDy6ApTQI3WDpaFAGOsFUGrwCODoMiM6Bv3vDBmNHi/gBkG8F9tIy03PQMASNMcsxy4wZYzbaVOyjzXvQNvPEqMm80SgxjzYXxGwLWjZvMkrMo807YiYx2xEz2J9MGhwwWZThwLdBGzzIG1Z16CSFozYEjf+Fk6BNQStB4z92KWiIGnI1SBwgU8xytWiwL22VBo9i324Sma3LptQzu3WTCuVTuaiw0byiwTOjJtbVqPH2taU+ZXCXltZtZmXb0lasGm2TjSHD/q/apkq91WrcFDQxi8ZBlXIvGlc0uf1oWjaMh2UohpGWDaYdhmG3jGIY1KiPoGXQojxjtEyUeKplEMvEMohhq2nAZBaNAzAGjTETqw7rRqtomojw4dVlItv2tCcbJsO286nb56M+Z7RLZNtrfcogf4ftQTCuPGQS/BXJh78gkvf6jEnwVYa8Ho8QywAZtgdsgvMiw9+ch0FkGO+xwn4ZpnsN6Cpolrz1OjI8KdMtBoQ1731Wwf99AVZQOCCOLAAA0KsAnQEq9gA3AT5hKpJGJCKkISl1+5CADAlmbuFuXivIAbHkXP7nrGsv+Y/un7mezRV/7T/af8T/oP7j7tv9H3gda+Zr5t+2f8L7rfln/sP+t7JP0T/x/8D++v0C/qN/y/8f/kfbD/VX3r/u/6hf2X/ZX3i/+J/0P8Z7qP73/q/YH/rH+Z//XYa/uX7Af7j+mz+5P/i+VT+xf8v9wP/D7zH///5/uAf//23OB9/rX40e7Hw6/I/k/6F/kH1j+q/LvnCPYfkn+R55+CvzW1F/x3+d/6L8zuQ1tx6E3up9m/43+C/I74V/r/On7Q+wF+aflmeFr617AX8z/vf/q9mv+6/+f+v9CX5//oP/b/oPgM/mX9r/7Prle1D9oPZJ/bL/0HtYVH1wk/XAoJntdmzC24c5CQOKHY5/0vatpRm1vvX49Co+uEhQO+Dg1CahEOKmMpi8YKOM0U7AtNFOLeUrzY6o9cJ49CpHl+Fjeic5KWFiSFKxaa5Hl8u3c4O3XH3ZrWfALwMn+X/8eUtWV9+wYGSZv//+g554YJjhIh1Z1g9Y7KfwzuRJ553fj6MAEUUfNSWbXYvWHyrL0C9xmuWj8Ky/8K24A28xCd+X/mAPqLtohBwU8WxMrPid4EPgh/+/Fr+6c//5gueZP6oXvGCykkdSO+z1bGsep5e6SdKEEWwgsbrRmvpQs+0SvLfl45MHlAnkvcFk7q7La+tGyJVF/08XZ2JIj/y4odpdvp/q8c8+Os/FJxvf5+uLzsEpBnN0FIeNKYcN4Md5uLUmEXOOgAjG+gpCdY8pLm538H7SLG3+joZV8w3UKkBtLWhEpadiXSx5Rhcyl96xzZHQnarnrjb28OeUeMn5vQh+BZFHyT+3NX0HNcqZ1IDQPJKqzYpVuqGS2xYwRaBenBfmd4SouqsuFkjYRRZi77C1K8N+shi8m5satqh9CyDTGDzSqKi1J0XVl4nFs/atToqe/5vYKyebwRR3O7ciW1Pg2/aE5YmBmvID7LkUm2x24EG2GGoyxgZ5abm8a43PHATSEu0RYgXHzmqzFcngnWPNeyBChlAqZMg0X2SWBpqKkG8QFSX2Kj2mMPENopTw/Hx00mhKaKZSCZxfFLcp3wIeiTyavrDOHULE0oKuM1g61j7so3cYFP3mof///uw770dmB/FwU1zsl3UkQWfFUGj1a1aqxOSJlBMkGIIUncY+ShTUGRq/VMZbPu2IOKCiHNNpDLe7d2SK+QEncJA7tt/UOi7/VZMccW2ZUbOXAWVjI3z6BVOEnYdKVb/Af+33EF7hUfhHHxQU/rZrLTWECa9aAjzZXqOrVu2TODXuq6C+krvAPT8mc90H8iZ2eCBcN+rcjsboXQ3zNh3uVjnaQpIL9cJ2P1jy+n0wpkkUYqRdF6mwYFZjCS3bRvuoFALpUuk1sRexC6sYHtSJ5YaO9HhCqFOol8EAZhJZj14a5ZLiRGRVJ29AJK7K9Dg4jJXp4mEJ8TKz132jZ5poANwmW5VgCXAvUJmqqxQDIGduMY3MtFMobrqvbJWm7qdtOWHfgYlW+TCiJ6SUlF/r6Ht7Em6dldyS6Ks9pTUfW9cxCkQsc8gt3lnyu214B6vdmF/LniE5kN6+Th/vEP8P69X7uy5gB3XUYeejNO9qmBcdeuE7plFcLQ6s48FGbVUzAEqKWSHfcztnu38FfWM50/SBhaQuEvJyVaQuD4vXRbrydzo0ZEmVQBONEFhiyjZqLo5c0IERlHRBe5WMdCJwfc8sbW8ess6XYhcZr0KtPW9FSDS+py+auDc++Rb1FrhPHUT4k2SCkyiZ6k+Pre6Ubsle9VLI1Nlaf6sGM224yJoAAP7MlNS3ahdN5puAlzRib4jg9OaLDgbPVb5TemdIUGAP3oZiihpgZdvz7zTDlGPTfeB5TNJMpC/stNIlFJzqC2WNYVVo3kKK5e9Ubai9uZVzXrbSCeHQNGQmvS97KvBuUvI93Nag98O6ByBJ3WT4Y2GASb/QhNmg651akTuMBv6ATcKNCE6go56TnfwEF+YVaL/CJ+4m86Mk6d2CbSjxPP2s5Pi4yKXq7ni7r4ejOuT9hnYK8A+QUuKxgVZUegZ9B1gDTEjZKM5Gh1mtpRCyCvYBYv6YMAFM38+5wqAcs2OQgF+eDUGDZbs7hCirRuOuZtidc/OUNvItNggPn87lDDpCVejIPctSyxZ+e3oqFNrwMmiyTsCz8JFjgHXtOdu3XFT7L9Qx/MpZPuOfD78BohCzciZv1LO6XjbmML004I7zbd59YeN+gUN1E7ZOZDFBTgfNDAPl57kTkiXKmZAo8w3FK6s7GZYdzvFVoeNUh2+iaVGgPfmCO3LpchCTf93QxC/34fPEbormAkolhF60orMcY1aWK8y9aysdume1hvEn+RL6qUeafx3gX0d7otQQMqlzHfIWUREyOcAUjEx/xvR3iXNyC13RVdMMHtYZpt6D3hmSGdknWXQLZ1Bq4XWZoGABh2nwI0Tw5Cj/qKKoamp7ZMwLTqPM2T8CtqflQ3r9rbYKo2x3YPNJv237F7+1pZ6GnWDRimJzqjLnmp9EhgqTWJGJnAim/UsELexTR0D1E2rFPbF8V+Y+J0Ldhlu9bCqFxs3qD208XUnzqJ9ELssLv3G9+v7LhwFyfHhpT4CZCHvRWcLWGgBtXCxfmAQZ85LjyFw5Wiyyjm20g2/pID3yF1lFi03gzIT41nTtB80Lvg6oPj6AHekPQ565fklcaTcGYbuSqKZo4hqCym3gTg8yuG9LNfPIOO5+wkzl9sC7GsovmQSfMaZTMs0D7ULKjhBZK4AMphr9Mw6c5T7Lu38fMZF3MulgHrlpLzxOf3RbS6OKIh6PWEy/bwBm4NgmjoEWycyWEru+CoaYOE96VNhhTL4rhyMMWBeYt4dpIqi/zzjwgMsM54sXEOeIu4A4CqA/1ohMHZ/vJjr8zeBZaZGCcfQD7+3REmBQbft1V77pvth+1guLDsMdGnyZAzN4t6cqw9Pvs21+DR1ltZmO3KICDS7s46du9KaEIfJxPPzEXZwZxsjv75WtCI7MNfRjWP7Y7pTaqyEfavhkrMP/UXgcsFl/0e3DaQhJfdz1E5JGjOJ73WtH4Pv1uXTFkZLufslGAXzdyRReDhQ/j0t495Ui67Hp4mupMl9BlAupAPvARalfqpHjPdFttsCMGST1/BKi2SZJzf34867V129r5XPrrbLTyTu1ZtG/zVklC8sPipBmJ8JctozXwOAr8Zr7E4hrsVMM6LA/KwXYWqCClND9s3v+o71CiMjwEACmxRSqI1d+HO7PcfdXfkaHSz0SetbZpgMEb7tbk4hAGQqC+AhldotbR/f1R3nk1l9VjnjgbB23mdvRCO038R2e17G5uWD+k4p5xHhwteZhmaDd2MVVpKKq1XR+Qy57y3vYDIzhLVLDZzXZ7L0XqJTSVg/G5Bjod7H1r7Uno9CHbExK1wXeAd12efCAnEXI22L/Nedus45mfFCNjElUSRtjSa4NcCK695ofwU0Y+doffquoq1G2a9ID7yFq1brKLRyAqK4FFvZSzgMqo7EN0fA0H4EpG9KwcjbhvRgns4ECQ+cL2YMBmjV1E97Ut38Rew5FelfDSM6qE48LUrF7YQQv+0xNojoH0QhH7IYxMCEmtt7jCzWgTQJBg5rpLxWn8WkHE05lnhN5uGybO6rd/NJ4QHLW9ycd0CrQexZptkqihQ1B0puDHbZbGfmXoyg2DoSDjRLuHP3K7G29u+umSGbiUBRuSgG2CDGnjYMnkxXBjot6JUTJd9KXF55KrrDy8fenAjeT/lG0zlAYDGOB5sxTOMJWpCpfD31fZO5OfFL+cW8hr9gPoo5efXD+ycd02Nm4yftU368r1IoihgexM4L/4OPczVhY+IWvaGsnfed9wJ8eaJbEJjyGV04b5oEX1a/kJ9MH0mMMtpt/uPZawL6v8bGcWLjBPzPPN2u5Jhcm8+Lop960M29JSZ+Sa8wV3cVp1ZT0cvYoRqOrg8EAVr0Ciy9EQBO7SRcN0Xe35hmIFGoS9kzJHivUhCxuWcn810ETkA/ZwKiKYrVgpi9ekqD0RWIwDI1mhZB1Q1VsCRhJgb2JEw2CrQPF5nSo546fityFtBqP6lbQEx6ALjQCp83aoMxz5MnDoncPhSyiOyTGGBWKqTubZyEbAK3VQXL5buZD71S2pSpdwsgemEz2R6eTdmDGlmemIiF/6djhHvBZ6NhJTrdMwi3jfOa6+ILdbR5WPkJhQGa5awYRiYPWjNqQ2u7/Wt42SexZ8gaFqRh8dqhZWdC3Z+B+T3LHaD6C2taK0GyKjpp4e4sPJq+lj6v4LbJE0AMcj8EIzqeZLsFU7uOQDJyWBgXkuPqtMyR91GFZgXEaXkQ+4d6JS7OXaB9U1ajUwsahcv7R20rSS8Mxt0veD/dX12ybgJ+h3eEVHg9b1e+4xKGwwQipP2Z1f+vd+U3KgWBIVtPoPpAWqA2d5RZ1SXrDrOfxy5bDSNYKi+HOBiCrvEbs9Ss6PvJtuTTG3iTS4UPoU8qf81wi1WiUwxH6KPU/9gS6AH5XiGE9AJInTo9tDWNOCK8V+V6tOPYu6iNlOkL9+XuPI6poNw3/CFvjosWWgQ6WLEprKIMCudsep0ryts7IFQQCVL+w/NE3obNlAX2hS9DsspCiGEaWk14ubhii6Z9u7Kr8Uo1Uo2latbGddgUaggxWfejQMWoRy/8hneMjODRovM63fsS3vgYAy2oToC1orteOVB+V3TthmUfISkMlDIUWa8bkdekgqYxrq3O+z9yVdeiNlf7Lwkh5r8AT3b1vsjON0F9hYIlNUo9WcXLBJ7iY2/by55s4qRub0ltAoBm8GjZZafJfPzbohAz0AMhKj0wQNkgIb4KE8csiLJrKavNwWfCVtFkqzKqerWU7RyQV0KgX7egW7uZZE7bLp/50iGLwEWtfSJKH/++V7D/YKijdm64GeHyi/lZlQtXarCu1ONPbiADY/QSv830kqfIIHxiAuVgKvGYtKdSi8OCT0Ge0q+EbPIqyOHp9vvQkKnFile/2PIuU4wXbRt9cOoCs8IdLciGQ7GAZmAa2gd5qTB8Me6p6XjQ7FnyRR9bVLQGgVUp1F288FZsCWULN/3DtqZyK2ds22mijBWlXUCiQZ2z95VGfvoocN/U1D9ZoPYcN1yBKVtuip2e5tcgROHBVUT4cha7gkfhfSJgCcgh0mavG6q4myE0E2GwYTUIbpII+C0Ok8/nOdmfjDYY23o6FKqUZL1c9/P2NeHlElAMPpgAQhO+t6S57NcP1aVSFsGgn4OBiE98JFOc25UsGLkgNVZsdkT9RSo/qwZQvx4umHrU8ZlARDBwEGqQFDIuKRXp7I8lOc3daKDx5HXyQj8OshlOL/BFrL4rF0sJ8LtqG7xnEWQV8MwBUOTlTUauAk4vAR7ASZywQQeVo/CW96gyYIV4Hw2x0eyLx1PEbu5TUZRhNOZA5XNLXxkBOYWQrvdwzGnuxiKXmKq03S09QFuCZ2rfU6K3vGiGHvatL55NmyYOTN7srRMIR33+9kqcd0KRvbSkDFwMBeGII7mY4OhZwdeulpRr4iipQEHFpiWpSYSKcFB9/G+sfm5ek7/XwxB7kioEH1HikRvVzec11doHQv2kFmIhoLwmfvZAJy22pnkdKoVDdMX5UQN3G6BD/S9XaFO4cJEdXfomlnerze/+/taqo1SlQ5agsNIUNY26UhVnNGnNJlPqh3yvo90xvwDA3td9mTaVMYMCnh+wQaRdk41q0bxtF10bZo0beWwXpI3t+gdifp5pu7mkIFe35oyvKZyKqgsfiyfbZy27xf9FzaFoiAihDGqEIlf8T84zTF+kJBEzbV3tw830zXWaj7BBCl9wamq/gdtgNux4K6PGuwOvsJLE/EdiO9gJbTTLJnxLgwgAAl2fr7l/XxpZrRlvT4Ay7cP/NMeA3wXspSncj6TR7YzZ4S1QBQL7FDi7NObZPkX32w5YDyeaq1bAXyNHSI0rSb19JEyNBAPq4IhI6h+voOs3F/MovkyCuO8QKEjhng8khJ/S/ctzYpsRclMYKkuhE1K/Q4Gcl4mtatw5iObs15+RQ3PCeO9t5muIHT1cImD103nU1wUc31jTPiYlkBQtehGM1NCXwQVjXg1kZsKpTPZO7Zu+O8ugKbXcW9A4yGOUl6yqZWgljUEKltoZq546jrUs8Qlygxxcwkcx9YnIsj9av4/d4MnHnFI5UnnXHfjW0Alj8r1auF5PZ/4+mhzEMyHeMcRAERPqWkDZfpRT3k/yT1g9ln1Y7jMdf0nB7WaOuLSb2qDfBGUg3ftfjM8/WfxgVf5YQBSqlWKoVWwMTkEI3M+3Z8wMrGnY/ldQSLil/VIKTjBfakxPG5RGsfXjWxfBW3a9xBwR9ZnrB8G4jIGpmYD+ylHEDAiNm8AAO0F59eycB1lqTCfHT7YWi+fjDdDAhMfyNGwx+UOYXqlLCXIdJzSGeCBscGvw92xaE+fUuF56hPjro46S0gGAUDsPeFb+XApx5YTs0DdgK453dJ3FEpiK1naVRMo/bQOxwepEPWjwFASBzxEP6BO9WGtgXQuNfv7CjofQ/4F8xHdQxT3z9HWR/IZ9hJ5crVFuZjADBe/OHaNCrJ63LlDxyf0Au+435zOHTrzAzwEbePKDv6r8R6TXyvy59PFvG2Pv/ZJFLflmR7Qb/4B0xL4+svdnyxql2qXccCoGQFp78wVwk4CeMQteLNDUIrXUHPCttuz+NxFpepPrUbk+fhoanBbrsgsag96sUzEgjKDM7FiJpJX0hL/IECVUPew37vdH8Pfq67LsicEmk+VQ9IFuVIHTGl2DB92FTbKgMbesiLLTpuM+5wJ8Oc89OAg8E6VRN7QqcLClj/bbUfrV4AWHRLSWrWs6vaMGxdI+OjmrSg27O81sAIZ/8iSzZTFkLQiTWZgSRA2dX76QO17oNaDYvH4hGdXAlLWd1b3omC3SXchUojXXQeNkz2bTi20EdMikGihNHl4m8oB0AQb1Tbc0ziM6x/gWxrhFovgWo2aY3dnsRCaZ8hogPQMa5Gwrkw9KHf3XP+1WNQnSCDB2dLk+ek1lkAP2kvuHurQnQGUR7RTbZxZdHJP1dVeL+dBoqR4+kZ7G6nWz1UuxZ36ZHzevEcUAhg7yDFgupz+U6M+xxelsDkAPUWj/Hyvp9OUiuS1vrFAupc77zQnjLslpgB0deiq033XZynnqFp6/VB9tDQhbdTv2/nV345QaltJWAyzm+Hzbylnj5oRB1m3KY7mEVuyrhIL/2Tb1mJPfvmZglVxCMT9Zq975lGgfuUI1kSHqAZrmBClaQvwVPJFw8qeB6oN2AEoAByj2yejyQfjIX1rN5fKa7XXeY6Ms43WuiwZHZ3wxNvhrmsnAaq+B354mhzxNLFsTIOafsmEvtKRlxano21tzMFSZ26UL/ccnIYXjGXTxLXqjZ5dqdQ7NE6rcGG+2OqMSZtE5Et0ckkzs9uf8ftRweevFDr/SKf8YChpFBzdbtmesIfsroih6iizIxWx5nVd9xGkeHJxi9Ear7ORV+4bho4HxGBEZugpT1FfON/5EKVswBBN4YeowjzVusOLGCWBTL+e4JYWnJ0izESYSljtJv31aGvXgV/hwI3AMWX7cnhi66U0X7xqUVXgEum/84Ef3/aaciv8cBHcVbT0fdFGMbLeRwozuX9101oDc0mdGBlb/Y8PN1ghEIhWTF+KC/YrGojeUx7uuyOB/0EMkXlGzi0frxFtINlF8ZAYzeqFRmgL1s8k6j343/rVECk5HBL97C0p//DxVvhFT8se2EJQnKNWauwM2yZ/RfVIknjkp7pdjlKfFORo5afbFdvu7rF8RFxk23009W6GFi6NN2eIm6oL6akB8W3tqKhd3RMEMv4VawEfg+d7icmuhYhN8idFtAqk55RmRFcNy+HlSl/4PMXVpMRYHXDE7q+v76DyS7HW1FCWso2AXdj/hu4fCzQPU6qA1xvpik8J+oaoUlwnLG/LvpPQcednX5nCbXfArt3K/kuXj/8Y6lhLoZtrMwMpydEB9KBAnLfnHZJ3L6PimIAU2YysgUmhcYFm66P2lqvDT5/w1bF315sUqX/hs36liUO0/5dUSrV6V8wEyy4/vz0N+ac1YmXdazZNcmHYn6/TmUXaDoXuPDryghMxVZjr+4OYm3Yjms6lGGvu/nfRgCPqhcw18wV2gYNcqmgZ2tTlsID2Blzv5A3fX2UWWUwacs+i8l+INYPaZuSqjZX7pBUS9mEkEvTeLBYyc2lcS9V8ti+tVQkD1LRIj11yttkQUOilvO0OiG7YG02NNiwWONKaS4MxpRsygI6rx4ACOHnFqorSNv6iN1hrkdFPlE3TJ3S6l9dSaFCb4g8bf3ScGLxpAYkTadRLFO8Nzc0G4MwyrQ4eoKKVQ0QHuX57abpM0Knj2XpXleJhK+EaQChyP3RGhqcJ5QQWAxEbkMjfLZG6XqQ+HZIkTCGErvl39MVMqgZ4JGEb2pCHlgC4xoOLJFE0JxX+eK/v8uEmIn0OI/W7P8072a8fa3k68qwWDNqQO6R+q9NLruwQRq/gHxlVViZV78+4rWoZ9zeiA6okYyo96cdcTx5Qn9O0xhpIQfpH6/evjtd1eJjoihx1/vBulQHFOiU21DNV45AGJI/r2gJx2RuN2W1QF+PaTYk3ZwpMj6Mc/qJMe7AgV3X8hQU26j4CvGms8RXrsl47u6vUqud2pkFjiyZX2HzAOS7o3rNa6X9TtSOtvw3PGE8HWyQrLy32ChdIRxu0FIs/pz6MH7u0SbDmKAPFfaPlGQICQf3mh2yfDW2ieLTOY5PP5EFxloLdZzw3UdRC2gSinAp8SsADZn8RbPlH+bmjiuFzdVJp99eKuQYsC+5QbNGamHn7jedi0x06KErIlmivNQoZD0CrmWzb0UxtDk5413LsjUyWFhsatvBEOQ+hk47x06PqSY3+u4E8oN1UJTbsTTyG4buBSYnZS+9013jV7WZLrhwOc6G84HLn5BslqbVx48IaTuLe757CuWRXTERrJtiXrX0b4RiLLpJ8s85EXJhfZ160vCt+CS23JUPcNQ2oljncckDT9drnn7jqC1S3wV5IMw5GLHUjuV4Q8gUb/ErqWmGB20YVBJEZkhcMSPNlAouNxzG+FODLNZsXxqlxQvgzDGJwQpRbj6z5e+uK1l5G5PqSbopO66J3pghXwdU7LnpcHQ77GY1WRqZa98WBfcSQL1KmzkRZb5ObxTh6/PEvCMtPpcUWPNWZR0fdga+PBoYaKvbp9tg6LmkaBCP+vT93zx4noygOlrZiEryXktoJDFLDx0pMIwReAEYhs+0XA1CCWXYRfzH56V1fdqETaxpSfHhRity0dqOmSqNaAhAVFHuBTRI/704orPck1f3vBBcaQ5X+uARd8bPeuOifu87uEQV6Ml6KhsX4fNQ8O5ttc2DkgCCZn5STr6eNlOF9nExwSZLxFBzaO60pGCmIyWQmSMCJZlenMMtlc0oWIrghLAnahXxmLjFTUvAFvl8ZWTvbWFOF8n8C/T/e9aFc20HvVINgyJyIxEo5NImWn70xLyQlsfzlb1PkAj2BpWXcOxGFwSQLrQjJoVUBjLG6gHQvzlnO+h4+EI9dzSaW7reRrHh1KERWVy9f7rX7iR1b23dg/4k96qkEsOIHh1UidLCaFwZcG7tUGuL4b0wwC6f5J9xv59gx6rZqhm6I0iRgliyd9Jnu1IdNVntYJltuK5z3riuPJ5WIOa5qXTslaZQJPWOj2Cw1jQGWERWvNNMERcweYgBO4Hc97+YMgNIRgfhe0gfPA5hy8Uvtvuiqp7oFC8Ve6ILYWAfRp4TG7HSuwbky5TwYgbpHqV7tLvBEaFgtNnk2z9Db27w0tXL7JpIqXuwfQk8c3JfuaCsWiVqIcmF2Fr+avIwzgehlnFY8IqBiPT8YvMcS7sIiqOpGqwS64x82YPJWSept9ApgVBd77Ma8w3Q43nLcVja3CxY+26VnYRR2B/50dk+qbJafksJr18fvm0sv3vLs85yD2yI8XIVuhjlPdYUM5BozM9xnx7kYO7eDAG2TaCTKdpr7XtgsKD4NQVvbk+5YbdiceTXH5SVCBwk1D1tholnDdcghYq/xQBY5b5w33I8qmLY1+uVK8VvLeNPn2H4AtkSbDrXsDlDDDOw/cvTFqCAVT3+nSmvUkwXFPW1ce+TP3KZPm2QIpBGz++k7h1eJcAt+mUTeHUpISKpErPn+ryF2qXELDapKfTJX0UwhVkxpVFDk+Kgsmxt57EkyVPUzvVnebREiJfYQWq1Ph93UbVg8EmD9QS+9pY75ctAHBLvGg7HGzbBhuQTP6CSlWuyxS3HLVrd7ix0x/B3zAEf5Efauwz2jpWIQVBahwn8cgtFiqN8Nj1U/1p6NWaOC8UHFrgBCCcklii5iY5XH4QJL0ShZb1oy6/JOtTo7ZA3Pn7/+POHHAp0T3xFXksTai8I8yGiROpho4UAPuiylvZzkLK08hCCKAB35zzwpUdDOiLjgEf209gekI5IQDJSkWwVSgf7cfNxfgTZ4/Ksq+i/3xuW/w1TbP4lHYM2qitP+pSRUV6vnJlgE3+ndKCp8BtHbCPclHHqK2Go4OhfVb3aPZryVDEmV/Hr0sW0oZidlDMCnAUb6pAND3f0gyejafauDKI4Y67isjGGNqvGgVgue560B5BsjxmUOt1/jq/PwfHlYYA8h2KFGPVjAZSvX1Prd6G68hdoaFZkb2AyMnpqsk2MZngmCTRNerHi1OSfrWrLIYDFURC2ta6IMqIYsVOs05cIuFPJnOzr0fpdu9DyM0hus5m1QeX2y1wCIElt97zcAVV5antNeM10FyHu3F4/mn0Suxb39tTtdLMy4vyU2iSj5FeOi6UZYHWscEcL0BmCswEDImcseZzoC4iMbDy1fx/iohxcLRBSJuQ3Qbfu8ozqdaGNggTB69N4S3vq2fYcDuV2/ZbsmW9St4+C9mqeFOgenrJesxZdZvBZUxzepe3B77VZITMrAUeWKvqfo/MyHuz/7vUWV6/jkXafo6WsyC8fAoNfX+N3Z7rb494NFVy43Jy/ASF/Xl9jAfDVM+ocIrNihSoRj8blL/aCBjZ7w3ke4DeGtGZt/jfU0DJZy45ahZAazrFVZk5Xj1AU5MDxmQ4eq62tWGOKlTdPb5P1ngDQKLlOmYB09gV5hTdu5ugo91JxGJeLtNePYbB/lqorii3ZHtAQimB24C/8OaVdXDLDuldXuc+p4ywVeJo0Dp9XOO6xc/kSKMH4ZBfHAUBpy1AN9ETZ1OZ4h/JATNXwgwpouEo1Rt0BH3sZJsEp2PG5ypC6N0G9kgU3xM5SPVdQkjQsC/IiaudTOjO/OffyHxZeRFkZN7TR0Afq7LxbZWocLFWP6aAlxrCHEncSG0aW/v3sfbc2MEoQ8YwI52V1IMt+jiHfPgeFr9+w1U+Okzmwq4q476WgZTkEVNZvzjXHHK8uYViWiGBdW0Gj3yCYNh85HSYkuDL7b+PcH7/f6Bdrks+enTl3z+c36HiXtox7RHKAsqXfvt6PS19Lxd+Mgmc3+TxZvyU4RXQPe5A7/7hZNeB7f/GS++TA7G6TENXV0q4S2bWdwoqtLQK0/U+E5dVT7rHc9VXLgTD4ydqjto6hoNtc2EPQjMHmi6Oad2yllJMjuMugGwIrXhGzGW6j7evxvwdLggXTpORcrk7aJlqhnaudjUcWU3T0uCfDeRii93Ntm+AsQEfEIyvGTlDCNC6M0hzeN9xLLp8Qkrrlu/vfuSCLKWdSg1fbB6XufXD/CcLTbI1hAJNV3uncxwFMVbPPYpPd16w+viuhRJlfNkURdUPsM21mPhAFMuFuxY4Bx8CrvMK63R/2l/trVRpR4g2hstcgCKlfqg/2EmL1EATXv3zOxzF/nkSyWbhG0y1r2xYlllkBuCpBkdzxe4uWAAkjAj4QZjupY8sABHehXYOIZBpUX5en8KuLtDU5Z9IR5eENKZXJwiTyAM/oB4kIO4Ae+Oc4god3qBehriZy0ad8iDtEKaJN9Or1LivcaEeFu/KBo2dDBv+Oql9aWHp9ZAAqvYYnUrFqud5c9QD+44iM8jZy6g/lCePsNAZvxhbJso5WOxIolyJQAsPLseOL+fHgiXvY42Ijc0WOaLz9Wwj1OsasYA+5890ylCSysZkG4ttGgpI96r73P5/zmd2ln5RYOQC1kFKDH2+FQro9SBcxXqbv0cSMUIsl/r4vXiFKyxyNm3ilXrLYvjahDZNvCprOlAaztWb2GTTGrNcrzpqCeIN3gEyo5Y7plRxKdc/40yZ0P9M6YHo5VGXocO7lAGrh4qgKu50KVggkNxOunJEeFuGhd96UFjfMttwS5Xlv66m5h1PZsLUUIGCXSQOR/NOBCMxe8kVOZaFm6ey9DPYvyWbrNZ65fnHPgr6NYbl2hrLXA3eZ00TM3nfJ2/4o+fK6LcQxuiIKpEtAbTYZbcBM8jtyH+QGu1NemfNqtY9ftWJo8AlWcEdTzAS+duT2R7W+s1DduxpFj2TGWJ8i1m9iX5SnmtRHx+Da9EExBXyZw66vfYsIpEzJqKmrIxuU2zpuaMs6X+9BL07MXLI8a0lMkxD1eG4CpiYSba6V0UCERakgVzuMTKB0WfW5GdEAvDt1/JG7icg0rYTwApPA6T1iCAn2un1jZR8fqh2Tzvxajei8HLs4EZLkW/kIYDjZ2fyaK+SGp9/YADm71QAf2GRsABNKnzuLdSfgajA49awCl6oFaXUD+2FtBk5+pQSvKpA7U1AEmOOtaYicuk9mA4++rWWnYCsBBEoc9Ri0gIBG8qkraGjXsTWsR6WjCjJuW4Jzt4Pyxhou13C1+XVaJRPf/Eo0clR4ssVyFHyVZVPeIcrZZ/zXFCcfRLT7p7SJ7isrPxLlbQ0jNvs2wRy62LLQlNTrwAS9yOY2kSGRrIHhny2Fq2A7mfvuEcIBb3e9Fi5dV05dkfUc510Bx+wM5m620SFoe9IbKPc0dd2O7voUTn1mqUmTNfbTCZI1c4i+AYtYimFZDyjWmp86DcEZd9hskrwqEwSnN1lGWYNgACjeTQEC5lN1zYGqOa4iAC5qNt7Un4uxBRfHh/8B3Feaf4vu3wo1GmWXB22zS0+lNeRhFh6HEW5GTAWreB5QHGymtePHPPYDPsSwtTVR057kD8IZOS1iy1yqgFzzMlc5gr52s4mJphdNtcjJemKASSMx3RKRy6j5on4Vhxqhm5NW/GtoUAOXcq6XcLrFOlhdlKJobpEoFFLcj91QQIe+1hJiVnnbmN6Pf45k/AXgv623p42jmaNoc4iyXtiH2aQ+zTkQOoAJxDtKD0xxqpmFNsQQL8Q+fTjsgr0za1i0MSpHG56o3oHhU5kS+K+P+6+Wpvud4OgLotV1CQYZMlE1vmG/0UFBngaEMuKICsgM0YZDRa+32GBkvuSxODlAO5SgR3oIav1rSyUBxIPe7qbYuuzuwW4wElmR4cY8ZdggGseizEQouJLMViIKmmN9O31iPwo5X/5+NW2JxZOFaK3Q63L/8HTtSmVBIw1QA79Qsj4wjqBoIPX+DT7n7s6ixgaQP6VP25yqYpQlrEP6tF9gu66urR7P0BXl6fRyL3HZv+JY0W1cUIEOZuG7e+j9gpB5UsbUuhG8FULVSVcemczyw/yNOagWyihpFNTlt1HAVFQP6ZvYRF9o7GF+vyXcjMIa1tL8BeLIJpc+jEO3sPK5d38GCzEFq1fXtn/AkIS86VMD0tjnLc2ldQ7bqLD5BAonJo89KywsbH2/Ww98e6dycPnV+2LECF2TmPjkadH77mAXuGYYKOjBXcRbX1ksfIpXp4iQqYeNgLbAaqun/DurPeHfhujBJ99Bb1CwWEqX/3Ii+guhePSkRw3PgdRYDZ/AWvnNDUJFH9SLGBHn7ugQLO8VTZ2P07Mht1gUuNP9LSo4ChHKq7Ym4rYNIgJWJTaCtaLmuiIhtU3PXrrj9ntiRQu+lsCeLfQ0qcwbwrvMlIseCMUSR/F20Ph0QGamU3DGz0ohoA2E0VF0h+0IUXwufUVyeKVSpHJWJLByVyaR7P38SNJs6MitLNq9DoBmMsAjOeC3bqJkuVdVgNNAS9JXT7ZLz2t79U/rYhVtzUFDpgaw09POsw0kofr6itdP86AXHH16JuJ6nsvMYC93Q+jnBCCbzBq9SVLAFAYj1+Rtr7lEVsbKEzJ+01YkdG2QUTSfrXIUllGSvJ4ZV5MISGqEBIOh9ENbYWkt1YbfOKmUadLJ7T7jkvshujYC+FDaLSkl7SOlKLqN+B1hPN4z3JwHXg+nrNkdwyfUVamLMgd5MqKj/y7wJ/FXB5p/J3wvh/Wi69aQj9wAV4OPirGlhehMDtmYk/HmxGDMdtyFyaAuQE+0A/mukA4xrGlaAnkuTBeOJuewDLTZTJ2zd+dkhp8ZxKauP4UnDohhOh2fmR+1LE0OYu3s3+vxPaYAk+j1oYz0V1uV9Td5iiJ2STYo7pnTyiZfbS6IPjuiyC8e0ZNIU3nDwCXLaXxWjHxzroPCFXAI8fzQC7D0Ql+jzFze6PUZoB/zYH588W+4pB7oqo0rF42M9In29ZlR83AyCxzmKwuIAItr2LKMqthUumR/tE6G5k494f4rf/UcjCb0c7u5D2NUtwUsTguUibGNjoec51ztXh11lDY+eZ/7yZFhvKVf0HpFpiXmoNaVBub5N8bFEFWbNx8sOps9szmM82L8aIo1D5uLlFWJmeoJEhjGvoW8P2s53dDkomyyyiO6XMZCeyS0wLxT5T5uhfy6IgJFOadfCUKe9GLaxnT9vsUTCG4oEO0sD7Vr/8S24jau1t9wlh2FayBrpAAEs9d4yU0uEAV+v2fkC00evi0GXg5ILEhd/trx6jJJ8yRd7VLM21pyEph/by333uoqstdjLlGWe4J4fhUUcN82SpZW4vul+xSITf/0M8PX4o0T1at1S8jAyJXyhpaEYJT/HlNMtKySBBQ1ZMS8l8EgbtHVOyCh9o0Mnwpfxbpq33X+s3MGGGsf0kn2Z3Sl0eucD/95KgQoes/yNr9vLlU4/kDxu3yanLd9v6o1v+qgYUZRmB+1DbqEYXhtBYI6U4DkfyD0Q5CZwAMJi9u6SjRHkQf8d0zIu3Kt71G43PszgA4KD9XD15IVTjG1v+PZkIUAAAA","mascot-celebrate.png":"data:image/webp;base64,UklGRjA4AABXRUJQVlA4WAoAAAAQAAAADgEAIwEAQUxQSMAGAAARkBrbthVbK6idAu54HAk0IVCEgO46kgAw7QihC38CIJAlbvPbnLM39Z6JiAnAf83Vm8eX2msLr32LqyoqXSofLdT9do7wlm+3CG/88gjv/nFGxxwu4gfmU1wgzOoq5uuY3cV2C7P8sRvz/bIZ824wZr821po/srNUxzIuZhKW00gsqhiIpa2tI8UhX6USJSxyXZ7A3wreZSKlMNx5HctdFO6+qi4YWQ4evIjFjiS5WKJl8SNJ1kVojwynNDThQpIlmI/wDNqyfA0NGUmyyp1c1dOWkSQzhyPpSE+TFmU4EGjQSPJdkHCAJo0kmbP+APbTqpFkxnDBYBZGknWBaNhIcrnZQA7aaN878Xc6J501WOdD8jbCnafgLJo3krwLd+uZ7MNI8h48eFHaQQtHkncYjvCEdk+/1ZuIkeQNeDgdwx7ZopFHsrsf5yuwGaz0NwPsFdDU2uQMto6IJJXhFMqB4dhoKH7JLgM8EI7R2jngPpiPunAS9w0bza/WOeEk7sIGftPguoCTuAstyQDDVcpw0rzroMWoDTiF/Vm9i4B0As+iyZcbAOkYHcFbALOK4CkgKRiMVt0FSJclo/E+wA6cS38Bv/rnAIGkwBdyryvFbK+nYckVzManKoQQ5Dlo+jbG2DR7kuvClGJkjG27I/hMQggCzPwZ49hswWXNMMfYSMvNOH/FesutxmmOjDGmLU6ctpLR3ncaE2ceTilswGhyo8BTEyfjUe7TnUOmLRiNvE17FvutyWoMt2je39PSFszGVl89jmk+jbIFs1G0dd80jzw/QUI7jEOD0WxU1pGJl/b9PM0ke0k+4tVpmiN/xmg2UTVe5kKopov/dZCnoVfUfV00qanGNkYPzVrkM8fIB+HDRB9PWuhmLbWfeiWdn8LTAKXV04DHYX0a8DiMTur1wElQ/Hka8DisHgqq4CHo/vonKYN/oP3zNMA7oq92Dm64uibcAa7BfhHRAcdMu9qhn/o+qBC/YGeYpjnGmKZeA8Qr8452TlMkOZONBsAp2O7nFLmZdGD1yLw1THPkTiXoHNJsDNMcqQ/wR/o1TVPk3klP5w7+kTTNE3dDsUt6cp64W6rQNI3XhOTM/THO8zyPkw5xx0wy8cw4pUkFFm9cOJONCny8RHLUgdpPkxLATY0aLE6C4peLGk2Ag2LVVZrw8k+Mo2gCvEPG9NUFeIekKAMeB3gHN5SnAWgd098DaLyScGOXBNzbHxPuPjojDt+7QZyRON0NgCf+yv3+eqLJAxo/dJkAGi+EbADwAfIqTTUar8rMz8pyAZnurIasG0yQeWN1KGCy0xdlpJEblPJlJEExvzZCQWnhHgWtLYSivu0jKOtonA6llY9dFmQxiLaKdkUO+XfQVdsFOeSmqpdZkEPutB/yuId6xCbI5LCr1fOxR41scr+ayhorcnqAJhPk9Qh/SGjaIBZChsOh/e159ZKzLzAqmZHldAmH8745I35KM17SI9u8+Lw1Z+uvn/3UBgmh33oh/1e1pzHn310lviqd9XILLx9KNBaMCuEooUpHUSeK9C4Tb1ZnrSsSlaJMKHGvpLmgyhpLRKW4UD5Z48souPSdN9Ik8zWv3LEqTKsiXSNr7tiVBSp4DT7Z4xvj2JcDKsI1df42U1MINAp4DT6l+BuKAPQ3k5KQXykB0F41XYNXUUjWG5IzoL2GF+FdGHLk7jZTuBVepTmeJ7mmvwrvwpFzhnANL1uLRza2oAmL0piITUFgI7IYclltBuYriDR92mhweWcH5krwW0I/NFD4MQQz0u+B+tUSIR/YAdMxI+FXwg1py3wAf3DL1RZDRu672IIGeBuD5Xs9DZU1WDx5GmAO/uvQl241B0v3ehpgD3kaWLr1aZCnAY/D+jTgeYrOeN2PsroCGSDgik8GCMARyAEBQNyw5gK1F5ADAhCsXlgyAUCcgBy0P4D6dmKCdw64AcjNYMIlLwBG632yILsAGU3XZYEH/o63gBEzBUACRpPV2fqra7IClpxBFeyYg/a82mTIAM9DpweWrHKGTstgCrxyhk4JjNnlDI0KsQZeOUOtYIA965xBroNFJWfAVTBq1nANzLrkDNMFMGydM4SzBLZdMwacA/PWOQOmQzDxO2eApB0CM2fN5v9ZyNOAxyGo670DdfDv44DHYVXVeOijCh6unwZogo+7pwF64OVOy+AmaIGfKx3w9FvD5CqsCuDs6+Duq+Dv9hp4vL0CTj+th9u/58D1J1RwvEgt45Eo4jepx5WHx9FvUo2fEz6jiNcg1etz6DtWAsdLVb+6dWt9v2oReF+kquq/VSX4jxpWUDggSjEAAFC5AJ0BKg8BJAE+YSqRRaQioZWKheBABgS1N3jAGiQDMUgv/QfkB24WsPC/2z9r/zV+Witv2j+0fp/+6clxY/mG83/8T/BflB8v/+J/yPZH+fP9x/hf3/+gL9VP+R/ff9T2T/3a9Qv9Y/yn7Te8l/uv3L93n9+/1P5K/IP/W/8n/6ew2/dj2C/20/9vru/u////lR/s//K/db2pv//7AH//9tP+Af//id/8B6FvEz8P+Xfof+M/XP6n+7fut/g+fC9t+Z/4XoD4G/Lj/W9RH8j/qH+U4aGbj1IPfL61/yPSs+u86PtR7Af5r+WP4ZVAH+i/2r/yezj/e//TzMfo/+n/9n+1+A3+Z/2//pf4v25PZx+8HszfsAhjAyLQYJI1RZE7++Th2Us3y7xRMGMLn7WEsA/YENMItut2ny42TwV0ORXx/u1bG2AldTT8FAQf+PXxkZCrd7b/eTJuXjcrN3QCxQqO+Cvj20uKpmpy2fNDlLp04BWHA9DOSjM69XJDv7b/uv4bRXLXBto+WHN1TlxtH6+TdqB1Y5q5FMSFj9MwB7IPq3y7kdlMnfr58LkJJeF2rRImIqXcHZbqvoV3EE02JDip/eFIT/oj6LZb34NnFCTHNAXRpWXzRYKKohoJLLRFBR/h1sffKyHk1YLLDqeAnMObNpVPB7XZlg10hcmOyuqXqJ7aQ1ypx+jwtMDC1jjO/j3qsfKf2Tpmt9NWaYcd8ip/lmO3jLWYWqYtFk7dvdDvwNwQxduilXTXHC4JkUKIGo+Gd19/Ivv28xJAFjuuvuCBCw9VwpcL7Yu7QzqquGqERdzOe3MA/lwy8akBQ4qIxlTySevO8NLB0li4ckgV666p/ZKMkCe1+0PClpYZONSZCV43OfzsjkMhU/TZHXLubfNrwwdbE580RkQHl6uGo+wwwDIcFaEkswZAkhRoRddrxt26MyK/Db9fgqQDIq0qBa8iDV6o+wNiqpI+GgeXvEYePLgj0oyq2WnqHGIRVb3RhW50K7RhFyCwcYteaoZbG9+UCW6Mq3hUYpoC//gRr8ipKZPxGuGx/lkxqcI1c62JJyAjtzweNiRM2JCBnEdLTUHQPIfIDgC/0eCUPeaknLII/BN3EDH3uwpp0LjWIYvvHZXgMZCTBjzZHZRe5hQnCn14OvbJKvzLpsD7I4pFLsOll0Qrd/ZPL7a/+Kw7yJKxBsk2ljhYX4R67v53ujqzgclPHZs3y9RzXOUkjpuFs1CXJrfMhY91M05NgzEmhA2u3BVIWcJqdCpGBgvxvzedwEBmKsTUnkwNJOHt48dCkp4oXHfhYIKXRXYpWtVGYmTJGV8NBW805O5DwJK1+KxBJxEx41WfJtrTVXr0WNqdYoMS6rG8P68rmPwvwKsm5ueai4GgEBVxbXg56P1o6vSurgnoNauzVbJA5qIP4rvP25x+f7PHQkHqN/5F7pFCf5MEQ/Z3JMoxmUFXoLPfMp7YYlt1pReeyw1hIhztfPozk/wb/XiNHodXV5WAsHJ4+qxW77DOKqf/AtTC0+y054/oLPxFuxz0SkiACT1uTVmvd2MDNhV03ovDUb3QT1Qm4+Gm9RZX20pauWuvkzW6ij6A30EG/IZ4szUGR7cPmgidVYPUPtVfY/n4OAfXiAWDXQrWHHPQvq7JYnGHS2umY81hyiiFfx99JpRsMYIQax0+YtYM2gVJ2Bf/rDvwE+E6YrHSBvYEA4fM1B6Tf6nZSekvSvrk16Lb3xrE02iJfv/18mhotoHh8s+C8bGRvoqh6KGJ1zOdVaN062gWv0KCURIvlxAKUiyFY46SNYSzo1qFJHqsMMafOOLOzuCM8wKFXvOtYP9EwP6+oqVk/2iSStNU/ldboU5EnFbIrPZo4NTUeiK8P2h5CwIbEYcFoJgpvHC0i2WlwEZU3/s89pC5R1koGeD+eOF7hkw07/IsvSv1Gt/+De+yyh8wJW0chuvc/9pHGl3hmehsnkWaFmi8cS7vgAD+Nj5diRf+5XC85m0AYnV8rFQdBm1h7Y6HWTem+sPnT+d+EG6A9yeTIaKfvI9z8ARcs6jGs9YeeKP3JmO53iLBAIPAU0nSAcWws3SmwfwaWzZv8/+m/dUWcrAg1gxX0x+ShuUXVflk0IFzealoEJECzeg0qNuSl/oXCrGyExn0CYB0B8MUfsNQqjCyIdFNL33BBkl2fB5HkPd4gC1xjzrd2ZR11ynietHBo5lgAcmyXDp2Y1/4o8I+TWIewCarHRwPxDPQm8Kd/60zbsq2OrOfBZH0G9mVmnhHG1UcE7dv3OK2lRaO6am/i3XZA2c/ZGEHqmY0CvQrrxozT6ol1Dj9z3F4QFow9Y/zIyVubLhMe6+ElcHD1yGctwCD5QRP0/QqrLZ5qAp3lFVnINe9OnCCyj7fazOLeNuGcTUECAaIWOO1ixl9L07ttbKOUFVcW+LlINP7JEVB0TrTrpC8jyQYU6TdPDs1j+YupKp83qwHw5LKGGpGF71jvlaWxz2RizDctquF5GMZWkM//+4Af/uF///uAsf5SkiDH9SeH+HABHeCEwybWlHIKPvOXTSTohzTrrxzpg6aw62778bpl6t/h43LLBKUbV7hrfm1RYAbB9EBKhdLOokpq5ug84A+5eTKjfFCwrvym2TyDHM1zimP+2IFlG0B2+1P5GSTLPg+iC2GsirQVlqJoliLV1QNZYqTxRhGGjMl1gTBs4oUvXuzAloFegu7DjqCFWVvUJJlGBNLVoxatQ5lO1MUMZIb6Uga86ZdcJ/0JYK7KVgX/6itUF3n7laaRsgGrozLCTztIzcsO3wRQScDmpoTdGryezaVgZHde04LiFWic3PbtUZKbW6BDlHw564OBl8d8iM1f+JaV1YCjJ1DkNDa0PPF3aY//leX/A7LI9CZXwqoGuyREJnKd8mPgCksg9BL8ge7rPpfTsUCleH7/Iu0foJErlxmadvCMirwOxwJP4eIfQ/Pj+j5f5GCo5y8E4LHnjTbHU/CfVXu/dmbh+NRTJY3hZSQojA5astIf1Uudv4fjGBlTH1L3YNyb94z06hWio36gIftknlTSf4OtvYYd+s44g3dBk9Wzo1LBljAZyqD5SIRNRs6R58kjjJdWt7spxcPpSEn/IxL1QVku7qy1rdDURnAc9PMac9f+H9f16MCRK+5MhvePvMfy2oSnDOIxBoeD4v6lcAXhfgzkYRrY029JSOj1hAQlGOsi6wEE1vNmCLAZ5NbJmS800PDlctug3CxBZXwbMpI6EkicwgxXiqi6WaM5qGfT+/51ZKC+suxGARu5DVEwqWe+BMsN7AUz5Jdj3r0MkBOYhbBOi6wUUKWQOfmnGCoHufDFyBNkGt7VHB1SWURJ6fnyYA2skvUZHxsDslizLz682c6ud3d8SOl+7yC3rYY5AMGuKVCIqJei7zaQ1tvMJ3WM+hwJ+A/XQ0B0t8H0nWgb5DvCbHNU8rbsYFmpaj2kRoi9QAAGJoiw6GL/JdpXjTIRjydnabmhOoLs5keiJ3f3z5IwDqz2e+K+267vdxWl+H/ggOaa/RLYE1WeM1yAX76gFhneI+j1TNy8F0mChQgKfBh2ZriTVPjBExRToBJmJD6ooPPMpD3J47Rfd5xWAwKDOHNyKv6e3mlqv/Vz0IngG6qj/hoT2Ts6NI2c6LHrqFPrzewCV6UAbr/fd4/0iml1EK3h5QIWZGsTViZTPT4P2bH8loKWrpqIMa2zW/wrW839zIH/4pd4w4SkhWqkKvfzjpjNCAKfT5CQ+/i6zPSl4+qLvXOAEpW00yBqI+xX2Ess4r6nPuRCm4mDMQxbgT3F89ANbllIW8JEopuN4kBvqzdSxbM97dvioYFLzNHdJlPWuocM98FeMvizNqSJH4uLAwQ+iFrZnQAkdkdPCnXvc0oEHNb4Lp7z1tnGeXUYs4ZtYpYDin0OHugiAOkf3mKBlJ5F4TztBW22swb6JE0UAXO1fo9uhEK9xe6tN56GU9fF0/mALG4aKxaEdaQJbm4PmAchJM6M+sLCnC9al2TKIjyTnBSxOxiu4Qwe2pgAhO09OsLiXF549i27Jwm2NNtmsj4oov9r7qpgMriBWsyCd4zFkWV8Gq05bGGsWeUIPHJTb7kT2MFPzR5V+Lxkh1KtkL7lITKSinJJpilOWX/RAdpympLQdOb8XTBH3+VdokynwFoq91vAi18+tUqn0fBN4XeFIqCQz6JGC6y0811qBgButp9RO3DZIi9ktFSQDv2cz3hvh8Q0oSbVYpx7/XPP4h6DZiLPnQxSZxup7TIIMlO/+6QGZgRZCpDEdLUe4tEntv604mw2cTdZcHHWbXUOYcDHou3+ngeHE/1RKDbD4evOPA3TMM+4e1z5Y/0TLO61s5kSFvO8y8YoZwOq9S41oWBBxKz17BenCBV7fdouiWkmsGeDH/ly84toNPzgeF9PJ+GzvA+t40wNpU/36meevji+vqjmkFA2p7r5gkF64RbZT6o9lO6PC/8ExR89CcseiTo43fufWnWB7QR0yB+KeFeMzO80jkFugBn8MM9Imgh+wkwHosnqiaQkhuqlRgnkZVku8HA3pdWS+xbY6wsLNUskXoqWK7ZtBGOub8S1ez0X/+x3utqBBo1j7qLX5MtA5v+Q6nLERECjhFsqAc95jXD7XuzAuSIM9KgafJR1n0njO+SCGqFmkYztiyljocQkWTXwJd/Rsc7R3BCosjBtgcRXDC3VyiN3XC2iB47E0s4RB1wMZJk5Rz9vqzJtwbmB4X1TBIwgDzNujxHCCI4hI9TOVncXpZVyb/tskG76nPQ/A7a9Tv2fDU2ovnBCLBvkhykRwOQlsVovoemaQlO2LUAXRKAwJpSnuljKISfoLXvouvBC0xMlDxfV2fbCRRmwmsmndLfR4tLz+0vja8dXO8VZCbTQFihnupnu+MqpJcfpscZeV9VfJsiT/EHckvXBAbBbiF0yfcst6k6FOZK6Pmj+7Q+gzxJTsML+u7N0u2QCAzLrRM3wctjJ7GOWqVsxagrS4rxzUEfuGAvz79eZd4yb2eGC/GFp0SDpvF9j+V0pGoocroylzOuWarffnYqC6/n4uTll48z8ref8M8N8djR3grqOFFXZ2nXRwfWxb+LY/sWiJr6/fwpftHnFOjbgREGFOe2WAgdq8zfucjt4OL8nFnAdkcRVG4rDdwLEeCg/pfNpyj/keAVQhsdW/O2NtG7cT+wPDuqwTBXxQ3FvOQp/wYZ83uxdIoNzWzU9zwNkehjXKfVOQY2Av3gSKLZHyE3E3Ye0P210kUMCqksCpGYN++IDjVeof+EUqaG+iQu1UIITlNOzsAdgZIIAoumiVp6OxK3UpTL9TrzcBpldDHBR810cX2J6ODKN5WYh44ZQ7I82gnAY0WsCTQtEfG/rRtUq4IzCkG1vLTQ7xfvW6d5Sl2E+fANzDvZGHOWbi/dluMTn3WU0F55V4YVlT09EN5JxWCu+zNLJwlDiSF7FhyELK5jB9KIQ3UG+9MRcY83DIQ6XVCGAbMENDp5NAK9z4TdSNkr4s9+l+bdkhMC7xY79dSv/w1+6yD3RZ6+XicQuH4h6H5tj4FsLa7H4+sksQDWe0M6GeB5jdxTB1tbHC95FlhscOkuuaFTkZ2BZeMfGSaM6FH2SBOQPGbbblKFLIMtAETeVSZwh/zUTEcr4aw8//xzHaQKKX55Fp9+WsAvjJhp6+eRrSVO6ovQou5ItHtkGcET3ZBDrzX9xrRE5NCZz/XwNmDK3b/CxNDzL3Kg57muMQ5ixI5C1YFlIyxQXbB/T5yTaDKOERK5ikg3qgPJ2CrE70LPzL0yLj7F5KWbvkA82j44Ldkkd428sSPYCf5+n+Zp3y2rB6lZ+n/ItX3RT9rV//SXbfsBUxRbKKyJzaB6funP5PPL0Lvwkq/BAf0mgXnda333gfYZpy4Fe8GS/WGI9awxuXmoNIATjIX+IW6Cy55O90CLa6hy42Nc/78DWdtDFShvu7xHMG/6VkXsa08KiVJjLujGxqCT4t3TnyXr/gbwUAooZsb5nMNEsH8Bl+ARklT5SjbWo6I7ZM2MhNyd5IQv407Ig5K6x2DsPkFdDCXiJkmQ7Suho5AJtxuphg6Rlu77B92D1fD3LUUmaDkrQrjS4w297vbnDOfibuT5U67c1MqlirGSpIKeA2rOZ+RSdJUIuMXj/w4ezZsOg/1DfTF6n1/tCzhN5jTo+Y3iyHARpjNZ46WSOKAzUgINwmfguIVutDzLM5m37SOgmiyn2mk+cfs08W1zP00N3bE//iFhPePoDtOhMGxOfiGpMa+BCUNcit+LQO+VOak/F+wlcRVFPn/ybVN6N5MYgpH9UhnJkOaH+7UWbSzG9Z+yHKuk/hvMaCraP8MTGvJ0u1OcH6xx5NCzxz3hyzhGJ3kSkdJ42KOCX0y9m3fKipTslUipTY7Qw6Q0ageosX280ER/3KnCizzxaY8vmqn1EhEcJHuslUIuR8nsXPYttSmuOx5WYWJX8NALQo2Oi2YszWpgOqWIY02aF3ji/hJksuyr4/bn6uiafOwkM8JUGjYavb5GJgj1WOXaHPPRr0QiSDLgk4dGPEuLn4CshoX1SHr4ZZshoKxcWY1xJ9g2eN/docbNtkTZs5+7QHjVwpQizqvN17prG3w8dlFUGe7N7YaAIX23eAB1UM32wflNurRzCH/4UZUqDVHZhu6DD+G3uNsu/3erMsBTwGL3O9AGxhu+LoEabF/Kt6D4g7d6VhQR4JpbfAYXLNEQJnCpRoHYlzOibpCXm6ZPhP978PnGbO/NWy2S2hbCVkwGc1CnkFC6t2RdfT5y4pL6c/U9NJCzSPys4ACIVImkluKlQ5MPJLCP/+EkQEO3Y1joDmbMSs3UGnrKxdfkK9NWOmyxKRvL9R7ZZIYI41PYdVMgMAIWaI4LG3t4wzjN3Zt3pMPL/G1+ow3l6mn29Y7l7613LmkbLC5vm3O2jTklcF0UNa1towyzBI+HSHjuVFcf5boMNwSPMa8Hjv/zUed5PBRMainejU4abLLgz6C9+B02tbyZxNSh28VtLBHSIuB6jRYsIA1i6wjgJ3ALzYOhYphgFYINacZXMfr7saZga3/lX7CxNs9Rt6D5y9F6VxNXXWJuESSaNgmJmUIMHqhrbVJfE2FKWkcIUa5z+4hxkPGT6IJ98n98BDw7wAvGGyiUKrLEwTJRH8gWwFuvpiqk/YUgo66Zjo+Rd//wDPooTlx6R8AeAuuOEmxr6aLe40y8HeO1Lr1otZsOy2Rq5qvH0rGQhga9+PXCOKs5RKc5z4rRw5qT9vq4n5098yzr28OJ5OTq74b2iJAeS9H6VmCohjj4R3Q/rL2yT0gVeuNfBGbj2fnRUs01AH+usROvsFCkKYxcAI2SrQsBwO+czEe3xxD0IBLfWhwxOusncJEn6K7OL3NZMQrLZtM3bk49do3L8XKWMIpxYxk2IJSBEX9ahLovY3fOAVkcW/WnVDaF/IswhdVEHDNCmEZCpmPr7KrvVjFG0ZYsH0urNJrsqTO815oJpCC5Xv6poq/K1OT7UM7hMxDMBlDWDCzwqZYR+HQlyhbPiPSdtAeEn0KDE4qDp2SSll0mhvXQwyMGOgmStzC8Pt7D1ZEA9VNiD0E10qobn2RGU/tOhp/NLf4I9VEb0ZgjvPtbMyXfhsUbph/duFcR3V1oGHfKpLKihEKXx5w9RpMNlBUfsCMSxGsGLvKtNM9Bd3zMJ80BzXrgI1Ylwovn2zuXA4O34TM296S+7P4//k2IT2p9gqq9Kzm2M4bu1td93YAQ64oGcdq5ZcAqpANCuTa8d4GAkASKytotcsQqxGO0ebb1v9cIwO6+yfonZice4jcMz20zlnprO/w0c8faMw8IrbIoJxxOZ8jXYC8ufYW6fgEyJYL4z6Nx4m0kTghLosYreMHs7onc/1wb18+dwvgGFXujOqN0nTdSM8KvNzRSroaGMVbxNgQ753Kngm0Z/2vfR24BTKZ3jiHAmBBLOd00Nea8VsZLVh6Z9CKz00aqFIdrtDJyXd8c6KcMMcga9UslcqPGH8trzkABSbKaYZr39dGs2iZt98NmQnQ3ywjlETrKwUWko1TbeS/ReVfn3VTUy9Zu1bO3GV63FcbkyXZaI06IiltkP92tH6QzKVDU3tlYFvjzQdOQQBkxejrQqiNmPd0c1Tzm1wc1wxj6lsB2dLdcV8VzfFesAEgqEaUx9QKgBo1IRvpw1d7Z1a9MxeUitNEtNjbSYK5ZE9546jff4sp08ALnQmo42hMUm9d0NP0eDSjwHyZ3hftsZgbfMwLkuGP1r0Ps0ZhmraQYp4ktBmVpyQdYRm5ZS2cXQpep6ht7d02TRbZbbyPNy6ODNVh1BgpNXntuO6t1BgxWRWuwyfoPvQAcejDw+3o8BKdoNShZROek0WWc0eVkJPn6TjDSJrfK5cOioPKaWMks+z8hA9GaA8YMdARABVZBvT2jXbZJ+2vnE/YGDT2Td9Fix9IBgQWA0gEopOUNasiomXThDaYLERHD3F7R/blMk/nwrGZc+pGWW8LUtyzTVwDzYmL42TXiFJho7awl8oBeiUbezqt5U5z/p8IUQzVUx019OIrm4xjGvQd5G7VF21YUVTYvEfal3dYQ5qdvnaVUe2lVK7TxU0zgVmCqraBI7tQ8wREz7BY3KofadbL7TFVYbjKwbxxQqZ97GVBc3n/9Gpo8N1B9uRLXCc6NMJqJQkPivw/mTe1WiyHz25oXgvZCPLJbnlYcBv5gollSOKLEBKZe9CmtbEZ5f/pbpxeLhcG+gLU2lqRlBu9Hr+DtSn/9Vt6wegWoDCkfaaDjJYNhOZ1plARKKk/va6a3KDlQ9c64Kp357z+VPwjl1V7VqlDpAKV35AigbLV2cOOp60/A20H9NiHA4qRGSoKE7DTx2qDij6MQG+eAWrfxWXPFGqHOuf9k0rpoRsLZgPP3J5RdvZCu6jc5dGYd7GlLQfzJh9CsIE7m0j2iTNjJFnTTxaMDWsLHFijv9RZ8Y7pxQRPTJW42hswKniI1fZtqlTu5OBCANfWbQJvVfc4YnrqdtHfhvmbgYd6KAHbDjQGkXBXPMQodz4u0s+mScODJJ6ikajcFwGJADFexSnBP//KzdDihVL0VPxPW1TkmpPHDzFrdjvczZ8bqBHeqkOwYu/FShxwkJKB/182S9uGQKjubjHFQO1uPMB0gxTqhVJWSrCnk5HLcJP7Mr5sqjm4muE3OIOQYLjxOUvrfI8Ou/M103YewSjHAnNBUW95lPjcSwYsEm+MqU7m/DwZRj38OYC9YbTPzVwFeLTXqQZTdFcTSBV0LlYexHn7IfENVwSSc/9Z9qiJ0YV0QO7sOp+KLVTP5EvvBAxhllxJgDVZtIxxQaZ4UHxhsSxRiTJW9ECo7C78bFBfeHQnB8MIrumqkSrnqrI+fVr0ln7adMkWoVAzDKz5MbRfk0jUp60xaDtQBNjxneLnRX9lczhJdkL516V/sqvkXHCjIFqy2kk2WLF+m4/Rxy+o+fyXOUCBCSyPiB12UNeSIuI1KcAvLJ330yRN3y2TdrnXf/KkkJBCT92x7Epi9K41JcvSUWqQP9Yn33J/pRBbHogGzq6JswDcgZpIKIau07UgGaoA5Ce/5YaNWObB1o5C6OERprTH6O6QguUVoqyAh1e04gzgK9d8wY66CWwGl4flHy686mzXAxx5w0HC8ca2sdYSiiVhzKFGWB6MGlDxzzl7vD4478lLB0qNlNgOCVvvimCIMiEPROuFsAKuKKwrop+Gy85x11SgsFQx+mScPGkRO38V+mjvOLn726zT9fXZ8zlE5stlQC73n9RrqAeUr2UqDMENln0tkc6tU+IgzJcZ7ex/87sVONwUas/0x+OFnuabeO5kAC2ER1DhbxrOHyonLfud/w8pkEJfZTOYU4c8sm/LSmxn+okwELPHefrvvCdtRWy20C0N7fIX8C/abbpv2jBrx94BcXkV96uTls2GLe+TEHvKDuATCHufJqEPsdBqpJZ8mnPiTMjnOk+AjvYogwAPnvej2M53iTXNwLIGhhr4sX0pthMzC/wVXCySuf+S9dgt0Y7kJ6jK9uhF9zNmCr7uCnbvOalOwFHjAWdhjxxxGd8dQktpNugl8Z3kcgcu65CONr18XdbdilXvJIvfAFk+0ZNNG4P2+s4LsG/of4mm5Qm2mOfLkrHIDR1KF3Ni1cDsiu87eudZh/yE0uAceQ1AeB4YP3NBrRAh/iHydYSqKVctNdX+UJ/DRINCapmDRohtgXD6vW42aFWAv+OZhtRwG6SXm/6Ah33qO8thMf+8b97kbkyu2csgXWiQJ5vvjBNTAlDbyL5XWwsMPbuh7xDiuaHftoVhVAM2oh82/wzcYbMa+lw4ZIjTkSOwD3tNVUr9L3iD+xPfkPF0T8MGZG3bjuv7C3JLWRtbiT2eCE7h0vSFLc5jgwaVZYU8Wq6Xup7sgtLQfutV1B8ryOWaZIcdcT8jG178YhQAMQTWemfrTUcnp5fWVVi+bM92/ze5ddU9B1L2c8vKwxIkvOzZR+Zt3x//+R5qTK42/zjksfHHH3aacQDZx7xaJu5Dtxwkx922S4UGE3eGiZGIH6IEDpCjR6uRLbXcuZy1Q3bjhSSlMG0nsITglfEdzZ/Tp3TAvFJ2vOLqwgO11xTV0WDEBXshAsvVI5V1vQqPy5+NolqZM09+yU2Nppuvl9BgsLGkOgJu2jkuADglY3k1v09MkHZCUyp0cyIVSuPJVlySWvaHRRHNVUAgbruagPenpytwQPJ4tXs4JeAs4XkQKsaUDDObJGwJsiBTH8FQIRzSNPCWNVnDYrM+qSaaT3buu3KzU/w0S1mXggSobwCHiZMltD1V54R+oCzDxobGZy0CNv+j1T47HbAoCpFWr7NmNbxT12sy2pUERNDiEFfXT6fTwsiBLdBBf9P4U435LoyiMFkZZxWMooFX9HrOSFd3cxcZ9mqzICaDHygmMjDY5QijC/kRdWVkU5zoPGS6OkrCFZTgvzL1RWE99UAsKclnweuzeMDwwgZKHZDsXh1GXgMHW+XpeRun+k5GDcRKvXj6tkjVThssIX851YbvM5eYDVRTVot878F6NWy809glGKLNwU+wDJt7bLQqZmF5jtoDE7yG6tYtdGQx90FR61Q19lffoAtrQC5inL5DC1lwbYur87ZfvtZ/6ATwQAPUZCWIH3yqppwRdkw5FepBYMsD6lkg39IswgcEPSGUb8vadT9KlJXXV1AuHFoB+ljUywn1uXUYgXQaggMP38N7eSSixNzGtXPyAfb2dN+zQiiBHPpF1hPQNdHKF8/+bCbgSBGonsxGt5y2KZVw7FRH3zbhqPUn7BzDgZ1Nh2NBfRevPyQE2YZW5Ft2IUWMokkyU7tW1rI1owioJSl/M3N+PskgHZkT1JpU4K8hsSGvfMVuG+Aa9ARQHcZhd68G97JN//La2HIEvDLqvmVrhWXi5ijsbv1EeXj/wS2ZGUyhnHQEpM5ntKPmagWZGlAwSQah1wSls8zm0EZ3S/vQ4C8IaE1JFx+7BzHY5f+9DhkoaQ9mGqqHj1zK/uuwM/93BpkbD9zMl2grNfNfV4T/ByKXIsXEAx4rAw6SyZTTYVFAzvOMsXmpVFahw9hcUi1BBWxqTgCJ7L5AgnttwmFnel26FFEPqRKsu5uAzhtCCV++t40N6+C87N+iM79N1q3nXP6kyW3jLlILLX0CLegoW5wxc0XxPa+t3N+IwFt5PvE5CM9lKxyqk6UQSS/xHDZBTcGDnWIOPnxS5sV5ka0t1QE+7a+QdHa3bQ+eqafMr9CLfn9HFcFAEUKkRHk/SOjWaLIgtaMTlDxkwMH4HuZMqRjPTZvxgPgyimVziGDqLAUkvYYysz9/g6g/73G9nsno4/iTTtJqs/K5nXPb7MBjRtZl6/ksDlbkzzH9LQ9Y8Yfrg/z3snrYX1qeyhITeobfZAGlImBqrzHqSDfvdT1mzqlYH8EIfQN/JVpeDAacr9xts1LZwAsKaxKOG3yUIwMe6fTzEu0b3geUKguo/2ObiUTxjnNniVaERZ0M9ZvpPiHMq+qTTHU54zgFiKsy/tUBM+ZGIGGB1uTs/Y1T3WSN3oRL5iLqK1kdDrTauBpwjydQgupkulcGKzySVCfQZljgiCFTrH/hhmnWDELTA6QCNFbGM9/zIzA01rbAKHRtQudLgGxgWpcYIDhcUhJipLj6Kceb44h4ReR2/P0NFXuoiJg7YTsDWrL4f2hN3PVdh8RIkMJ4juPSzDNcSFFL6C2zKHy7xEido3Ok1LZ0lidMfMEyqN3r7Bw6Dp3ZYC3z3Qhij12dJ9u4EUC1HMBteSQlyvEolyYJHRt3GZpZhYkhBMY02CcWPhTJdgwcKMgxzRIIU2SUKoYsdHy20yvnnHN7OrBKYwTl90zyU9+5Y5L8CRqhGG8tFzdRQtts6D0Nl9x/IWQ2CBoSO72q6NW9Xty2PZkEmGNIiXsNtKhE274Hnsz8kOOMBfBLHUIDTY4lhikVecp4orlFUW5708g9bngT9mSI2OMrS7uS8qxZh3nWLhLSR0JcF78GLTquuPxKq5lGqcs5oxH79GDRK4bS/9aBGNgOEDnftvi/SzoTi5PDAWyaJY43nSUHvQdObFwh/sJHdSTkELdSxh58vH0ki5yWtyEPXIbmSVjZv5qZw8tep+lzjmkmkDoOB28r3B3aD+agqMQ1vrZtkRs51VrYZg2nzsSpN/4qoYvXQrQFoTb83V/jvH1fNyWwzIm03qCHzwwMjVYZ/dtyXc4ix8L8HnuSUY2tTtnooH0fq4GgUszce9LZKFuS1FdP9EDIxk5pBxOWXuKASqG44Q3xYFnLUKUyCOANovnaWiyf46HikC4Kw78ioGXPZUWFuiqKT2d60rDFnJEJ5mxc+0jqli9JfzflbfFEg4h3K8vPb7gt+KzpdOCpuEb4gpx0k9YrxtcBoSvJ52I2IAU4aIEByrcTkGUDm4/IeyUNlLLvlHTwuL/6o+16jKiCttcyHhagUFbmQ6VQdsepaKO88ZdzercdMIULwgNGHZOGPg0Qo54iRODvR8iU9jvWAKDO9r+HrPHyD51q14wvEmAPlNz4kuyQWWJvgz0ga5QHsvNJx6G1DteZ2QUiVFIoD6UZLooImq8OJ25Ai/QJ3XQZNTEUmy8GcF2au0zJYG2kaPCUBmHC5QKsoUTyXIht6/qkvUADSipEVV3DAhy4PeFv54ocPXaA5pr2Yntz3pATrSTiBvVZ8rOFGtsRrjcDjTKFpXXDdX8dOLgf4cuiUWZxrpFmvP0BzgWXg7yk2qspc0tOzPYFrc1V+nwk+dX1jTJtsbKB5xvt8qYnTGa7bX/IhRMDZpNK72EJxUcFjfQXgONHYaJz8AhUF/C9lPw3RjV/gBe1Of5J+L9YbhCUdPV7BZRlrWqsXxTAzEU/DYelyueGaXyBByy/09Sth4BHdYsrIYNLZFOgpAIbDuURTf68ghBJgjaSBN+onhDuOPE/dUQnPskL43EhK6o0U+XfoVsD3qyGTdJACjdbxLlrQNMuXPWxwwsVatY+zpJNfm6FERTqudPA1NwFmuJnX+kGfvrJGLQ2uDzSiObWf0R0M163lIAsiTWDCLmW5qeSoDQmC+337Cij7AhGMGYvERJ6Mmn41Ds8RSXRoYlwRMalKV0aVHuuo3VEgEvqTnezf58/FdHVtkSr/0DVjHxbgfVVgZCw4Szd2VcHr8SNDrO5Bq89glI9+q59IJAn6FWL7AKI6dJyEDIRz0IuEFmZqDm4QzRMHfG1SsUt9v64RHJ1WjFYyl1hEyKQ+CuvnVe7w/Xb2DGCHmY6I6ovnFCpXOttTjkU17chGBZV9LtA8B+nhUwFSjB29WXKd+RLqUgXU4MGsS/HBE7lmKl5Mh65eN5UCejx6IVM4D4dHQ+haf/2aOSdgQ3C+ARTjcVT0zU8gnWV22ebCmgP7WX0NjO/P18z7jM9nGwIIfF/8Zaoc+sL2c956sOS5O4adYte0euv5PQH3eVceC0F/B98W0JpBTEp4k/bX6eDvFqXFzQYhQAYAHJnRDPgtNWtZIQwHHKAA8FmAe27792GCPgR8pyY4nPwDToRQja86/sOIhjZruMtppc8hMsirfgIDgnDe9n2u3j003lCpJG2sfYtHldDbIW93dJo0V1pVRpGv3SsXi9KdFt6/KV1P+BDaOEAPJho8l/HjUqvQT9ZpAnQTyEME8HdJeQi/AhSY/zaE7xATWXQAAB4m4dubFpP3/qHbNStq7hNSx+O8wV/CU/HH/1UG1jOowZ/25AS/5bITy39SDytVQVJrzhMpzZGB6XNhcBa4CFeYKWfmEpo1bQJ2zj93d6IbQzT9tQqYsVoygsLTKIh6et0uSWO7vc9hiw4dmc6F7w34nRoXlWZ0H2jV/LKePREOPgy0YWGPDIPe9Cn8F2h46aRnlLEqqJKLfFOL5cs8NykTKAcwAkel5TMssG2YEbdhQWxNFnAy9470tDJzI2a7cnzTS0pNYRCj0hvoVfgeykYTkziHw0wIlKWNXVONdkV+IKKbbZ6vvZM96TYYotEgFtzOGootbWqIlHn1r/zMVDi41zuwZIeNeO7hLYKmDkzayZXdlxtaf4iRSFfyvyEwd5+KvEJQH6em1cRl0jn/ZWQcnPWDlK3iXafmFbG1plmwgPgy5wqFaa/4cLOkpKiTicr9WwrsmwqFHED7Qu+DlxMJhMX8Q9SXUihfmmOTO5n1owlm7KdPV/pLvkC1Mk7S2+XOKIAqERSa6RxCSSD5jue3TOwSRbCkz5TzXcmemPrYVVodJYdtwBdisF/dL2PUSfyGYio01Wo+b2DOapz1i+h64H0Bjt8VSO6q0RYAP1ESQPrzkXiiLyMAHAqv6iUkokgfc/V5oAQACEKIwIyRCaYqfO0b9BJvX2tC/8eQY+mdA1mIO7OzVAwja/9tQR8/ON0bXGDXAosPfc/9cyY4Uhto6MKnjMMwLhvL8a9nLRqGuJ0lFiXVQDO4EoMVvrxPVyT/ymemJD5bsoK92gdnqOS0c3mVZ5sr7Xek0vgUiB0tmu3RiKnRPoONETzgSCDe08xzuxs1UTdWovyXOZjGbNo+9jEGaIkEtcKACzlZVTiyn5Ytz18UtqItyD3n68b8OJ2lNwxWjH3KRZldXV25qK6llPW0eVfkEwRqhdi74bYM8NIlxU/wLL1J1Fo9uVDzNl4eeNlvUxljayNDxh4wSH/Zn6hWnVqLQSpvQj1DbK04G88gboki1jCi8E/hmtGLoDFDE8a4mIGLmfkOOiExQbRQ4qV7YEFs5doi7FU9hiUidnFFpq/2f7EKmNHwAJldPjWZ+wGIJnytuqxwjmsUDWvdI/vA8ms3ZJKQmtFwvjbnaJpSdaIeUckOc4+3DJFv78ReovA4LsfoJVObZbhbmf8ym9knwyp3eFSKXD1nur5DupNM05oNbacIX3b2kvqkDLhSZzRaiecmQHwiF2qiAUYZAOxLOD33ofaSub7RtLJjyNYEo5zOgvcaVVjsXR+IM77sdtv29U9X3lPQtpyCnaykamH+dqes5IFb4Nv06v4Q4wvmr1/R9WMUPbOCSvwgQOwYzN4ACOUaMmAAkhckp0zt3Isl5YqjcoRLa4rU8DXNHxTILnBNkduY9Mnxh53NSkjKWZqwNpCl7+mpLgnKs3UElZMdBlk2dahU3bwErRGwyRsHHlYmciqgXgbNALNWiKUteJF6UoHsz/TVuNtoGeeQgBUrHU3AEY2EydkIZUY0752iFPOI4m4YbOlEmr3QKBQu6Vp5hKQdMB25tM+8efaaic0SiaVPP0S991D+7wrKM5mjDrq6jz3JgnEpVQjLNdWRIqjvZAkgoy24jRZ0wWVpEXUVKvw3FQe6ATPBk7XoslbtTo74ld2wPy8nSCNs3uLYD3Y7klM94jyHbAowQX/Mqqov+OBggSMYJnZ9us6eYYFmziYI8LqqEHQHeWwgONTI3p8ExSX6smidx5SBYCrRMYWIoBNIXMPmsU+5woLxFCItcqJ9+v9NI9WhUz4Wgd8FbzmOY9baqU3GUFxDZ/2GBKftMDbtsOjWos35MFECxKm1rmRAKpiGKbTxvEOPiC/M/VgHEztEKvXA1Ehyg1EX9+Vm0um7GwPHKBBS0nE8pY7cI1Mo0LzUggNNM4kAJ4I7439ACwjMbJFShFJiv4qv9WypoAAgcn6gRt8nnvW3en5NFg+0LOLspwiq4CAHROcuxWVjvRlfO1mXHIANGmD/CYz6ZnUEzQLfWnIdF0nkSOLY9b+n30z7N0iOSAdELWI1EQyEYDvmXL12yZXGHTwX7nj237+uNyPuMsBDgghHlwFumVbIZPPaTPYIEu1kjEMF5MRKpyOnpNKn0Vnl0iek7hgpn9wV5LsDPXJKeixcOyRSLINpErFCymrA3u8WUkcDsChp9DqsyFqo55RXOo7+eRItdWpinHKinZuiGDe4UXdEiwVQSu8la8GqtNRmKuM6FwstQELWNA/wf2AADeNFmOPaY68QxP9OL+J/yUZvXbBAYCJaZqYq20rCCjKCo0UgFzM50X1330gwIeAUUmgMNEZDxk5VWZGFVt/sSrZZqGU9p5RKP+WQz+1V+lpms1+P57jjzkrG1YZMhb9zEx2lwKYit+CtQG6coLU5CtVY4dumN2t1Ih2o+3x8pT5OO1JRugmeO1QeW7aeiLWaj63KT628AABVl4Z25zaz6N62LB/+oY6YbPEBxFeiUaht9CuFaE4XpkJsXvf9jyfhUNNX4eUSCmfeAAAEFRcd7Pi89UyqpjIp1t/8w///0oWUqzpeotUTNLhwAAAAAA==","mascot-trophy.png":"data:image/webp;base64,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","mascot-checklist.png":"data:image/webp;base64,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","mascot-books.png":"data:image/webp;base64,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","mascot-laptop.png":"data:image/webp;base64,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","mascot-pencil.png":"data:image/webp;base64,UklGRgw6AABXRUJQVlA4WAoAAAAQAAAABAEAKwEAQUxQSDwHAAARoFvbdt1IulG9MBAFkkAQsuDRYwq0ZdBWDlQo7xpFkfi9B/aMExETgP+ah101zp7yXKeOVyeO16dNb+is8e6kxWdAb6U54+38DMRnAP8d0DmTW3HO0i2Uz0eemL2RnedhVvSOFuJFnSMpw8vqDIkf5e/vS7rhXRQ9rnH3gqwsHvvTIsK7HojKm6p/9AdJ7UyK8LYaF5W1ladrTyi536Nhomz0w786FLohsG3l3072EnRC5G9thfyQ5KcLFEwuiOx6DLRP2P27ub0Ai+6mfNj7SpKt4X4uAzsDe9Q7572xaDLjy3Nt7K/eY7VQR8vAxsDaWqdorXwJtyOLwsQvR6g3WOmoISwKCznoOlpDi2D8wnMto12xlXyLJTH8yJrK3rXGcQV3tQRGv3LwoQLKBRbE4N8cs15hE7jLghj7myZWCD9wNxfA0N80cj94Gu8h/VHc5n0Z2ZsGh1uABNzXexj4i0bfK8rbGLfQ7gZ4G+NWWh5rhVsY9puF1QrmSryLUQvt36vsdzBqujDX4E0M+sO/ah5DKxiz0I/l8jWMma4stl+SIUX6ci8lVwQ1o5LU2AHdWQoXBBUzf2prLzq0lPxAxcCr2hZdWgpQkhsqKq/nhiKdWqzyztvtKL2aOsgs2Awd2x6LHm1EelYaU5bVJr4kqW5hU5mlm6B3W2L53AD928zCiqgeOQ3Kjj708N4Gq6K20sdNaBXUVjo5tMCKGbWVbm5Aih2C6sqJiGUOQYNKR8d6KJDQ5oeubg7NvjgZ4cKGhgNnA+kkoW16WxoAIGid/r4lp7eap/ckyLIsiwTp6u29kJZlIZdlyaEnOi+kZeHpsm8d0Xt5WfjzOKSbj/dSXng1dENSHSa/ZD/2EdDp8dfGm9JJ8Fr4IbyLTul1/NzHELwnvLt3Qu9tt+Kc8Tb6fHsvD4Juz2e8vYtMFU7jPR4xBGlu/aFUnx0F9mVZJEhjPFcqnZ3PWHZZlhClPaWqu3AaC5HLsqTQ3l9nSYg555iLkcu+hXbCCf217Ad5HMe+l+PBQ5pZz0hvtbo1oyT1D6eE0govzkl8BlKU5nRC9mXPMn/ksmdpi3PCZc9PAJecmlLOyp6lJSdrB9yP/ATwOEI19Vafyq3a649ODkmpJZMUa+HPuc5MakJPpraNCY7VPnMk1cIcofr2CGROcarFSUblY5K2SpmTjLrCSd4qHbOEypzkPBXaDyoHZ/WbanGS8QiEZwCPAB6B+AjseATwCKDJzUXaFdqMLuoajcrcJDQ7NWh4ZtDy9gzIM4B/XNKWzIqi8VlB63lO0P6UhEdgRY+O0W4wF92iT5kN9DoZ6DbYpqOJ/cC20b7R8zwout5nQdH5JAi6nwIMME0Ahug/GQO8Jxil7zBQz2GoyWs7RuszDDg7DGO+tDnowLjTmQBY3QMjxTmwc0w6ClgqIxqkwtjoki8sdgfsVk/AgRJiSjGIyEK1SeDKRJs3+JJGw5dfmrzBl4EW7wJnfmiwwJ20N8ChNFbhU1oLlwqthUuF1sKnX3OSSzaauztkp8X+oM3BGZFGJ1/Q7M0VtHt3RKDhh7iBtkcv0PiXE2j95gPaJx5Q+zR4gA6IDkjDUlclOlCTeUIXvsyjD1fr6AWxTbxwGEcvqm3yDPARED9spn0dAcv5CLwcsVqmjnhZRkcmw4IngmFfT8BwOnJzko4uGBabGj4M/zoiWcZW1QI4yEKxLPghwfL3mToApuuJ0oOmvU9a1oHRMvHExzCQS1tjt+wdP35QwxAPP1Dskhe1CbWBdsWvqrZAUi0Qq+TFVpQmqllvbcVKq8KHVFU/vI2KX2fQqBdJukKeAbVpdQdtep/pv4aXXVR60jLVZ4D6APgyPAMvi14OUYviiQ7lfefzEgBNfS2S8bxQtqUlJ7EHJ0NFdyR3sWftRMvFUtoWsz3SSUWUXhujPRiMFAutRXviWFC+tWQPhoJhbAbFgXw9h4GgfGTru0VhGLECmz8swncUKJ/ao0kYhFRgh2KSDEExlGAS0ggwlmQT4qXcxzGYbBSw/QL6YKogPWxmARCcd7JVCD3slv2MneQKqYfDAVsnscLLZewVFdceaF3mgN7+Ysc1vt4SdnzUoLMie06jYTArsWupIJ2QRkX2jYqhG9rEYb36oUUc17sj2pMGxp6jOex9qxC7ojV7d6nC2tdhDLuPFT590ZbcX67w7WwzhQOswN4ngY5KIwiFZADJkH0ELCF/+zsM4ZBEZFnXtT/akQYh10RkWVYO0Q6OQkQuLQsHeTgrLIuI/IDIsg6CvpITXBRZV+psHesqIrgssn78JDIMEdyVsB5+CmEQQXBfwjaCaMS66Qg0CkpKeA0ARoQP+9c9CAqHpD6CxN6OHIIIikvcDlXtSKyApG832yKnqCoSQt72Q1W1vQ9Mlbh+m8tBABFBkyIiIcQYlyUvm7ayCQyWENP6bWML6FZ+AoCEtBU6coTxAgAi8fUpsUbB/8oBVlA4IKoyAADQugCdASoFASwBPmEqkUYkIr+hKnPcA/AMCWhu/EK7AP6MM/qAX9D1H2+PLfkl+Xfy71v+0f2r9K/2r9uOcXrnzMPM/2//f/4f/Kftx8s/9x/yfZd+pf+V+f/0C/qV/uP7n/luyb+6HqH/rX+Z/bT3nf9d+1Xu0/xX+4/Zz4BP7B/iP/v2GHoDfuh6bX7tf/b5Tf7L/xP3O/9XyPftT/+fYA//Xtj/wD//8Tp/Vfx69zPj5+h/v/7cehP479q/pfzH5pHYHi2/KX8L0E/6fi38tdQv8d/oX+j/MP81ud3Ab+m/1v/m/m17rn2PnX4gXfmeFr6n7AP8//v//l/xnu3/4X/x/3PoS/P/9V/7v9L8BX8w/uH/R/xn5O/PN7Lv3X9lf9h//Mh2MYxjGMYlwX2GQR1+wQ+xmxjGMYo9SfQ8bPoQ9el9x9bNokO4ngun7uvq3wSHiaBR3WbPTsA1vr8Jttf2lONJupSuQs0OTmngfw4b5fT/uV00Dhj+b/4Lo//vgbcGmKnqzn6yMQSWbyfndFmNQHoqZZgLUQ2k49BRGBNt+Hp9JH3OrJlJv5lwWJNzVjgImq1R7vqB8NYLl9tBhp8iaqP3WMupzNn4x9r6BxhVWYyFC44weBpnXXrR99VnXEJ1ENIPCnku/1NNKqw/Awx8JpuvQXpjb15l0k71rLuSG08gAcVer6qCkZJ4H2VjzdY3Vh1ZAWsRdHIreujzVkGmzYOUrWktDKUQLCaCMnTwRuxxUh9oPXMAqBuuA3kd574r+9jW9vYpYdjgw69G3uFn4nW/pOb/ZwknzxK+p5mrfDLTg+6I/lTaRmuaeST7cGB+Wf5AzgCNHY9SMFIxtBpeXV39nKi1EqDgNi1QvB7+gXic0I3ylMPNkhiFu9ETiva78w2KfWMFq+cfWXEM/lFV0SLIOiUzoVqjKHyP0FgJBSf8hP5BmGWQC5Bx2et3a7uBAISV22o4ADHOJv2c+M1JMpK+9zdgDeeFXgU1DfvFwV8/wQhGy6nejkeB5CgH0N3D0d4veaucHY3jdHm85v28/B+6L4U2/5BDQCRdai87e/JXJJv3JabSxZLZ8wdlW7+kjnC9FF6C5phvXRD+QuJEUu/uEwxYuE0B/9tA9n/3lf1uf//PHD/AHhLcNjG/RaruxK9ihX4BPvar7dnMLR3Kb29yvSlxk5vAsUVXqrWqq8KOqDuYqSwK+OM1k1kk17NFKj0p9sv/7cGXm58YUgVRWGl//o3NBf7wwgdDcjPMBb48fm+GyOJrqrbdoRXF9QTIv+pa+fTUOAL1QlbvXV6eg4zHVjEN08lEnvwVfT2WD3vy8qk2Uf+mL2oYQBwkErev2gP8HQjRvgL4p20Fsgc5yEMaHVo9dkgj0rdW/y0Si+DnOc47nt6nWw4YOZifiAUFBLBW9oDCgkM6XXo8E4/ZT8Iumh7J0S0RA4DugwfIupcsdK4VN97ypKFxMrLcQjIufTDIZU8wxjAPrdxTbZOw+I74ADgeRn07odzakMQ2N6hVotArYT+OxWFssZahCEGwJ65Z4wMUnB77HTDh9UFYF9EZu+dJZdvFup9ukropzUs7BLta9y+2QiugfwYQtd8NAnn6MjRBa1rVwCi9w/2sI2iD1p4Z2x/cRTOWfYKKJmRfXgk5npvSXyrovM77fDEqGM150T8f13QMOWYa9PlvflL3ve9gV2oxV2FxWcLuVVWTmz01lLSkqKAhiVnb3o5a0OWMWeY6XXcWm1iRN/4tPROJmbr9hC9v68zQX73ve1RyWOVCBX/kFNb2lFkYUlEaxzx4qfJ0CalPyyzoTYvUXiluoDYs1sEzCnW8ltwqsyBR3QhCEICL8e3lAIDrucA4pnW9R219fTy4INz1kJgKPZgQ7FoQ1BuG69LWr9nfiB7uu7t20zvwXri/AuOgTUsIQIpyc5rGQaU+gBO+Km2FN4yLwHqP/UReWOfvoRHPOj24p7nCra9Y1k/5KGkK7/mzerjx8DfpBBa1QAAA+heBqZDtGhhEkSgIAACHywpiHGQGnzipAvbqhUg8lGoltz2hUtoLPMvkWwdVUbHd+Xd8G8xReCnqNOD4d2kmKP/nf4EpdbwCfU3VrD9/CG1B2l2q0TSj/ryDFcGmtad8Ouzjx7SxSsmRihSyH9q76T86AAUyakcpTtYqXs0q2VjbHcMkuIpl026i3bQMHiv2KSJ98jEGDz14wWQax1cBLGsV8Rufpi6xZuc3xDNsFS5134NIWFlMl4P9iitWD+X1Ck+4m1I8/fR1AJLlS1K/VQ3VrOROKbbAP7RubhYjCwF0Y+11bAYlG0axFfuQH3Hr4eUpu3+a8yka+D/+w/0JPqz5YdU0f4C7e1wuHHWoonB9yXJZ6MByS8VqAdBtQxsgKRjNVBEYVG7fDVUMzPDAg2/Mu63/1Csmy2zsYZq+baInN3p0xQjJoMg6WMwL2EiBoQ26bchtSXyEgFeoNWwOBbH8OoywjxCHPXXLLTiXnRV/oiOuuaetRjLsRrixYNddjUMsQtTqMZ/j2AuWp1wW+/J4QHs4sAn6hg7Y/QDiaxGBvTBK9zBbsguDMSNvhlOLghZc/QqnUHSJ9xUDovAI9ileKuddW0kfAveWfUhs9dQy+ZcYGP9pVfxJcsMAiNoHV8UMFX6Vdvp2jvJu04jiAyE7dAKSV/r8SVtoojeQGwl2aSd4li1Tom8zT+WJAppqWdtgKD5ZjgJlRYH7hrgn0kEWweTGKcCJAeIsDJJ+Bno70Po6ZoAKUZeqjNio+2V8QxC5cUl5cfu7kKWc1BJAR99D30GmGo/POSglbdMSZz+Leyfml2J/rlR4duh3bJ9LBMfH3qbWuY15GOZgOfVEy+HJttMPJoe2FklCPlrPNqddRFNnABZ/IA46Qbp62kg41JZ9MGQkVEPt4sc3VUrr/Zbffh7NE6H6gg0LRmSDV+Iu/0tT3LNfSwc7oCiNOX74hWAMnrvg5v7FKy+AURKWfT2mt7sdBKF3Upz2FAZErsOVDThMWGv0UArfEQw9fKILr6gr6MZ+2COBx71meMzc9/vWU0muzfhzJtc1IPddY8sLuLoSo/BWdbVRYaF4L87qOPbmFAHryTP6g0uXRLXs01Q2QH4svKdDCxeobVQnxvR3TERP4lmbaeRz5cerD1YfeXi2S720xYy8xzG5T3ckixcDvYWydvf3Ots47d1kdP0Q5uW1oEWOudBozRrrBIWmT6+rU0iKiuGL8seRhdp6Wj4RTg54cmGkLrUpQreYuLdSf+9QBiuihd8euK3tDdfnL1+ukaWiyRsNi+UCPuwiHPaNt37dbDbMmiU9FkVhi/X/VYx9fTKa4Mvm/2+hjYFukjkYLmmCtsBg0/stM8HWoZtrjbIvBb6m9TFCVuzXNoKz9IJmWvNk/ApVn8epCs5s9uaiP0iuhypmRHSr+DadelEMmnEMKlG8UJ6ywX3W/zA6Qr6nD6LEE1M5d2aBc0fSlaYzTFfcK/uKKwBo5u1pA2fWWN+slnwPAKUzMIUqif3H+NIe1s5JSru+Ow7Mc72c/A+y9LKMvXetF1B95caa+68inn3QiF26ORHGXy2zK16XkHfrmpbodqxfF/TZGORefSoahQ/t2JecvQlVcYe9DvxAO4ILE1JGmKSDnRvj9zx5tcmaIzmzMhTdtm3xKCQwUqbbeii+5Z4hy43eA6Ulf1zEGOwK0Poy69euKDqH+GDFEyxHqtGfzjkJWx79lGGRS/gze8hXym7+D6F+KB4yJG0wTC59PbxqTNc2AcPXBb+eTFTy+shlGOHi0/sh2+Qf96jbwcqwsiFNNsNRn+BU3G79GvLhCyAuG1iTDyC9B1AbIYtMI9/Knl2QqMT9xPCy5DLxK+j02Vl6gQlKnPCSSXgnoMhwWK2gd06NyH/dG+pynpsECSdpp2COzjgaTFMwKAFB0Y01rogcvwN2AtRXc0W7SkSRWVWQQcYr38fajP9nFKoxXo3SGCL1PaSNu/kWCzZ5v1KMMU95b6NW9NDSX4zKQWZLW+lNqpBMLs8Ssdhy6vYaP1v9bFytLaTX2rer0ZGRGk6cGNmf114wmirMb3aBz4PO4ZWzaURwuUjshyhgQZXv/8IZJOLaSexpLUHBM5iGJpAlD1m3q+A8GMH1z6ALznUJ5ow74RDMsdWeqpA35Cp4eK515WrRnADB4N8gFJTJIkr8DmBkrNaBhvTqP8CgGIUSlM0ZbwjoUsoAXZmDTLLiwRzRsa3bnMiFvTYpRY2a3CDlTuwIs6lLCf7a+DCkZpDk1y02fy3xJslZyPtwUOp3KSVQV33am5eiaQ0OqWiqZrbcKFOchWMn/uebRyO1Yttz/1txy1PiI5ISWR6kF4DLUqmovNFw0ChZK87wRNe0XrbYZMZdax7kAaN0cb0tr3FdbXmooY6WlFErdbLotBM+qkZ///h8/DvAzQelwxrKeeBlWbck+aYSr1KPFYWmbY2vygMieCT19NixTEFkmCpWaG286aqHj1vXRzfeX9UjEjUrksYzVuiRPvQaS5GQGbMUgV8IeB/XMZdjucXeKg2rV+HHY30VbkLBQef1b2LTQ99D3QjdvxOx3rh6cvQqKQdKjawBTPaOWsWfKEXG3S0T0CH3KL1CuaQZC63r7BVHIq+wm39EOnRVa+shsTh88SGPndf+Su1wK3AU4ewf7se7S0leuBxLnJjAuXroUNZubw6ks5KeJPTD3lkoJiZrNKUKAgD/qh9oxum8MBVsIHBDeC9tFTjCMd7GKTvcrHI8knzjvnt6q1M+jlJW968AcdOVgWWpoocGFoMFy6i/IkjjCMJMIETxRoqA6e/2Wjoy8WfFjSeV9CBlN8K4HwgZyB2/N25hOUm2JEUOH/VhsauLf5OaFz84CFnAtnYHVHM5zNWwGfcBTWdFgTtK5z92kYXTF9t/9nIv/OIDT92gxBAg6BNdRth4XQS6f6KXxa+TK1X0jg65kuH9oYe8GR7S3oNVxnXOO3ivmjE/WoUYc8pY7W/LWs/X3z6dAaHsKwr4MSy+5klo4D8cvcgLP8dHp1AZleiN0P4jh0HnaTkZj9O2gkz0s7ioDYxIG1kLRb2yiU4WjU19y9Jmm+Vz6hh5C6d0b4zlfKnoSJZAGj+KALwn44tHoFnQw4AN/2uHYqynMRV1ZGx9TlsDEU63gxRZHFpoNDW6tHny2ouvJS+p8Q7rdik6dLdD3d4Q6lu2+nTkmDMPqbkyuYS5JTP39gUjrJwCnGkWAZOb/7tyVGPGGkj8WsXBJfHOhRfjVBrHLNXpaPOmd80wrNEoR5hTNaFxu5ute7v2cxCLzIwi482JwEsDyX/7gIi0sWoQTD5Y4frk/UaJ3sZJRQbUkfUpuSjzobQvIoUKyTsui4gOoOkd/I/gcGOBUJDUXDiAcMmze6cen1bYvvCNm3bHl1sL4OvlY/GnunPjW4SqTw3ddK2XbwhPPPsyGINaTsQ/oQmuQ3+K2AW2NdeoAOtY0ti27j/YiGZxIGNs3IXHns/JzdfUlx0fYN9qF/8AdubjF/KB/kH3TkgJsoy8RItWoce5u9VOLeqLwytUMLuSdCvvBHjAOPUh+xwYETaActBuUhBnjkwDnqLiYzEuHHAONO9XSz6FK+ODk+z9PUee8n0D6kiFKn4zepOVTq9M1TnlhW+09hBfiISoup1Zyf7R4VqIkSeG8EWZ+5euAwKdzvBcwmAvyJ7FdXdqbXh2G2IFmws6Y4DOdnIabdQXgr6B6b+JEsQMYQaD9s1OFtBMrT6J0xRo2aq8fujcaXlQ7lmSVJFeuMDVZ7Goy467DNqdbfEhVucLh9GclypvyJ3Bfb1ojIBPt2MH6H1e3Fqf7ii05lX80IyVyhovdD63pb1Rrwlmqgz5JuJFGLoWqaw0KX3cx1Skzu91s3aziojWGMOAgeMuRycHulX7zQJo7E6e6i4Vin6UmOuyce/6TAVpUUv/wjTxM1LGqjkWPMfHhDbaU16GXg97T3z+s3n0rR5Em4/14biqK2vIadP//G/UDakcgpDBIj+9D98rybltkJf3O/8waA0DG90q3z+UJAWiECcoiA/+BtnFM0fp0e57a28fwWG//ofc33TnSf8vOB556AI5HKVAnGmXQfCPaNHTLuLOx9GRwgfmkOMqm/iC3aBHgH4SswmdERol4XxWq3KmhaF3TUKH/94UsS14cSz8AhCMllrEQQF7BmsB3ODwS4b+wZjqKfOUc+J/CpLJMYz3OipZohmszdm0a9HwYrOBQM+17KpfJEeeB5sU3Ammxxse2n8gxftuBUk5u4xwbrLd01hobJrx2VdGi5QZ+2uDpVJ+oVfNN519RMG/lttJnbcKUU5zl3Sk5qgf1Y2+Xtk3InwbmjiKc6rMya1VlJiaJ7coXA24WzE5sf/zmT321eo2SbohMPHstlD36boXPbtNuD3W5S88HGtzKMt0cf9198kKiSWkbzCntl991acJBluJLOOg8SvC+SyQnGb+EGOmjjjVQWrGRfGyyzqz1xyKlp/266XxivazBfT8DXbrwkkUw6+IRrVcRVI9VDgb6a5HJIK5lsvDc4VJLasgGZ6rZRUIaurf1sWzbXRvPsranRZRhOrcRpI8nfmSaFRm84WfaKMAbbGrRYkNxhPYRFwur9810e3Md01ETsNnk/QhIqsQYiamZofYJJvIBpWCXSb3nr+o4aeTLN+EoBR9LcWzs393chXOmyGv0tVKYu66vaSa4786DwAD0kcGUcyPW0PloZF+yIMub069/XjGvjk56qhFb1YuIgALRT2+mqBbxsg3OZna2V1TutKsWfy4eFDOnsl5auh/DOm1ZnplH0BMBUgziZttRO3hSGOBBhB+f+tMUgzU6b6RK1IF4Ius2FjD3/wOfe/R1EMUN3ndgz+f7TDpQACE8nI0naSjQMOhkAKHELsBg65+ZvVm2ZIiVJ68Lv3nTvMRWuf2ycGVlXYqVHhAks9//9fbQ6jjxcCSytlZEJ1/AHuMdZOGkxtlM6lvu+Fo7NR36iKAlHaBZxv34ZCfUeNTzXYTNogm+xHFu3G3cHhJwIE2sjD7RmMSJ2pp9yGTx5aWqOTTrOkgqAI0o/5dcOTOySWN+szta5d8BzWoAyxz8Ucydrqp8SHN9gy9C8Fzx8CCDtJ2JEkum/vTzISIq99PbqaRcbey6xS+6m1RP7M8gdv01Hc2mS0pj+uu9Dl724iYSZ8sPKHbPLjdLsQZX7LnNk6H0ItmY2Ad+dPWMqSx3dp3vlS/RoIqQPQOJmj1ng3wA5HbMTuOFG4UtZzGRjCj+0k1Ez8yaLWhx/HP8PIAk2IHa/E7Z5XOwnGdfiNOt4P3EkDdlGbpoBV4I1c5sga0MzcNjelE+cyjSHX/HjJAAQDTXGRN3YNOJs5I7SdfvRcMP4nG+X0oCP3o2YxQCvVz3v6w9xSUDBVD5Aj8jvYQCI6myNLfzEjkfWSQ4cMYmLXVcUpoLSZEuQClZL+lMl9NKqDRo1ubjMMmdM7Q/I4/Vx18/xzpLbDoCfG8zK+Ckrl+6zbyPyWfpLunWqe8Hek64jnSzwIXq640VnziKnhndWmzliYDPhySWGgkXu0ZR5goDMpv9IuA0cUIW/dqh+a9LntXfcTLIj8zZpWkxxbM9cdiXVj1mkWUEkqig9Qz0jOgJnXW02z86ufb97m+4eH/wPcCRNA3/H/LnqdMWJjcBXljsLR7p4hzwIClRo+Zu8ZNgsyv//6Xhu8USO2GnoW7YLWuEmC8IAAgDGJOI2Os4vqwSp0iXRsJu/44XDlynD1odIn7oDtmeLzs2IqRZzzU5Ws/T0w0c/gfeR/vgB5n1BZ9PfwH7gE7KzPP/EfAH34mk/aSvuSpbx4vcZ/y/nHa48f8HbzQlsGw+CHpIFz15+mzbFr4gXJpwG9+3oFKJuT1qLd6KCyqQTnE9TJ/kq+NU2hplhN+lR98QsBHwx2BVWJb2ijSwPiliAct8z1SrEfEgAWDWSVlim3boiQ05PLeEiRrzQvYPcDayXbrPJ0FRvbDeeqAkAljsGV/MQoVw2ba1b/7DP0WsA2PZvsYoL2ZaspG7KessSNrGG1XTdp2ge72F7MyRjrfN6zTj1JMeqj2MIeuLKDexVlNFd7vtWFvTn0LURsSDjuxfE1bjFNOPVcoXxG7UCfQpd6cb+cXvzOVFQMQkXMsQzv/yE4/phgFzH5glpypJm3mY8iMOxpTlPdgdHbvWCnZklUaNWykKBR5SoWZ0vaIBKfLv2cX1To9HtC1oEg6G1VenjINKoQlhbeVX2zMLToQTQ65AqGwzJ8VVPbLMrC8/+MjGF5geNMRNvocOCtgKuV4nT+rKkDtG+rB/e4rvnFiJCCbwCC34MZtlQeKUH/qonfoJth6GZyYL3Gt+5S59GDGjGa7TwRitrWiXYCF2nS06kKFohUvDiBjK1S1y4YeKcknl5TvnS/Ck8ZJIVpwKiuzqLwhIzZ6R4NkMG3YbAr3mRz0PlZ/ZTXT5z46zzkMbsV1wY3E+FGDuvUpqJZemWrtVbybafhCeI2KIyuk06ox9kx55T1nP1pemTfq0wq677AkiEBtW7ZVWyzcGR/3OVSPCBY+OKJcoRPUwHAzzvsjGGsKM7Kble09fx7iysCnjyzUleP+HA2vJzTBhKLPpZVqmgsJ9x6wc6kjJX5jQsyz6obShmTxEPQe8JoXEzPJulHJtf/wZ6Vdd2p+NkVmHPKuVM60Yegrq+qWIjmbY7vOFrE8XTmpLHDPfKcckMzE7d1JXSvg7AphpClnc+jrCIqmDMSfyq7ggGQRCGlzSj7/6sr2Ia5rolQb67FFLUXxdKBXyuaKnVOzJwkWqaa4VOB3uks2kdsz8bZdPq1MVXrWQ4oEHUG1vjplh6G+T5XghDPeY51C0ckpL2ASQdLbHDLkbCKae0fpAfA7zaYVwNac08FhR/AY1txSxsR9I91kvuwgODeUQ/5qZKyMJ6FBnmAIs9pKEmiTdw2Si2zW33wdqcsYLNrGSpXaWL7ZfGq0oksyaIcXZWL7spt6GKageZ6fE70Kho9HGCU3mcyZ2LzCN24Fzoi3031bF8cOWYyeUKyB/FtdUATG29z3jn+MdFllJ/V88GUBJ7POuhnCFKahUQWhVP+fOWTOtv1f/KINJo9oxPuPUVhL9F9Tpkmg7jqD43J94+uCJoj0Lvevc491A8iwWjQdhjIXRIKvurWYZbkTj5WPvlZXbEk96/gULh1GCAGdNEVSLa5PG1X4hBA1trnRDepphBTXQl5aGSivIPKwmAYlrIG7G4jBNkfRD5NSyIKiB8uYgciD8X74xx6QBy4zrZnJlQ/Ju0azpuMpqnLXlxSFIC9V/iNzUGfXCayDd9Z5P0swYSbt/RnoynvfIJoTiBOphv/jGTHMIltSuWkp++2UyPbpnl4QxaEMDsxeaVRScRUfTqLres7Qr9QWlrrx550DB88dqVaJ4mMhSAu3JhqloMRL/x4BSmrr9M9JpJZXm4lt/6YG5MRSsjjZd7KKK+ArA3+xmTksOgnMXIfliLyvQFJodhw5Jor/O7b4uSWtoKe+rtRGTdQwFxDr0ZNHHumKvK7FU3gytbLpjlLwoYxHQWD55guQRU3+qTvLs744QqV9YToxjfyospZzsx0ukukuJ3j9cGdpYQiVmZyrWJw9Jl7AxCDO/KM5BS4o7SsqcIYkkOT5uPeqOpXcBFxPeBmQBaZaQov6ao6dDzXJgFmXjMguNKmeqxq/iSFIbzVVOpLB25kFOaUTkMc4+Mv9NZm7P0CZs7POh478k/rrZvi1ykQ9tcl0a8n1RB18P109mpWs30Vb6v+1gUX1rmnviT2NljfqLTE3c4MmLzUJMoa2XP5pE+DXhKRV2BAWa+NrydYt/Xr4ilqGq0gdTtbYlGUSsgfeYRgb2N+lQkDCMbJCKyeZP+VU+1YpnoTGWxyq+C4PW+W+H/v/Crz6WVbB/MASE2fdkQxVpC2+KfPZb9l+hjklDFqxT1HE9/7abSlkFhsyMrCZ1I2z0uLlnAwYjRD4IVi2ZxUXS6gSXIShoYCn4NTtjKKD/+OZNFw2bGFqnuhQkzF+gQtDw81hTeWZVAhUCcDDc9yy6yHaAZl3kI2zzdMIyCB29T2Brr+CQM3WVT3CaNbqaeonFZiv7Al2Luqehdlzg6+IsDt8AegbsLJ3CSht85hxVNflHwPLcy5wl4nZEZGVwD7WMNDzpvfI50VwH2+FSVz+gy1xNXoDAVsTIZgLrBK91KPnLYiqs4jylXhyAXMJbG7bmdcV/tvhuNfP5Tsa49Q10PTnacXM1u2bHKcTY5YIRZ/YVwIIZLsqPSe5DpO1loELmADXSmo0Fkciv8pbRWyOKnHkjhg1cE3THb+eXFg9MbwEsHmU41IE7IaxiuF8PncRr3dNoQDQ6xIJ71Pchau+hdo1zfDEs3heiPoOTw/0eJXPKfE43Lc6WTXNi175xsFikKgir5VpkFGft4PlHgAI7w6wJ5ETA+/SV1UuJ4S80DVh7NCe+6Ft73MKDkzKmfntVtYBmWqkeEvHhKSSP18UpEEYb3VSvULtyaSfi1ZjHxU4a0RRy2E7bzvZxf1fCBopeeIsP+Tg+fIVlsYwoM5q2v3JMy9F84nBaVB7r5r6LhJL352M+ZrnljnGfnnwV1D0A2mMCOF26oL9G4J1kxiVR1ia6FpLMedCfRZf3jnie/ruxMWES8+tcvBHXNfl6eCA0t+CQTlk7/VISH5PQZHCt2xBDsqwP+poNjoRY/YendGgUcu4PS32w72nDLUrM2ENUDiWRI42H0YN4arqCQYgZjqCRbFh/5g5PyOi+UfEVks2nJ59S4E+Ilr8i5xuEHwl8Y2+NgJn8WkYkDeslnsNxv8tRz4pvGv4RCScUx/OqUp5M5DABuEO/9puLyk2Clppzv8wGlZ4h2uzcrCJrplHGH80pz97WQe1qerdJeb7nCXs5NckjZfHaK9152NfAePKV/Tf9n1Hj8Htj7jELHEtBtAOKW9cjk2rFwusChqwmml5IXJ0HsfjjbLZpWVrPfZzXS+xij9Hv/jg755wC81HkzrG6caxbOB0oKazwlkilf7WN+w3DY1zCYWZA9YBz40wB0bUOWTUn2ydvVnWFaXvQ8otcqMY8KleISwxMZCi2E7Cl7/CMtkq5WRvT8+zehJIZWpyms3kWwitpYZvfF49/aqbtH4ApmT+0SJTTyYPV31trSQef57iBA3lE1Ozkw+R1y7O629lFhk7HQWNFbzFcOJO0SuyZ+1JU/rj3BqoTthgueewNcpUhvQpQrFAHwioJ7zAImpT/+Cvby6nreT54opFgBM5JSlY+N5TOa0T+TU8jsbJnvgR1KLjVN/9Qgp8aRFzytw8lAHMRlOgaFPo38prV9F/kwSLm14Qv++OUWVcCT5UE32nXiY9WYG+zgTp1KqMCOqsHzbofAU9KuqLXyzYvB/UziePb43Q4prASJbyQoC9d2kBcYei2oi7PcHN8RkQ1/XL/75ONo47PKNaCBKMa3eyinL0IlKatDjcVr+CEibKDHvoXc7ZtHedh8U7XiN7ieq1rtEx6cPvlyUNXurv2LHutmCFaMhb0v8NgacJ6wbDQsUntLeLSkApM+ARZrSyHNADl3xPB/4lk0hF96jlK09+D8rBHqMZ/xm2oX+EiZTlWpZCtpUVee7RksHAOx9+wMb2TrgTX1v+bPdwJnWt8vGQJ77w/7DTAKeVWf9UAWXYzZwVxBsJxxtUllCQnleu2o72/GD8zudSyFNETMH7fKeKDDXUiyHUdok9gWfgwBuUuuFpZ+3+xwrXq7YRl2pc8QIHScWM9skX8ZYNSoLLzFHYC5/4NWPHL1zaUftxj+FpON25Uq5+hYwpwo8DWL0vcIA4asvG06YH6u40e6oaFKYCsRQChOgJs9aH8fWFRZIqYMkzjWoKYf4ma/z7xKORnXGeOMOgm3yW6Hy9I4tLanR+ZIUQk3R3LGKcto9Z6lbfiNeQuSIQ8FDggLuf+PBXMBtUIdnnEsJLoKPj8B8iC9VUUBvn90B70HyoMHaS8JVheQa6oTna/+JUKL+QoMyq7t0WH2tnMFO5U/v30wGaeTZ+RLH5infybON1CJggmjFT/HFdXGDdKybEpviFhadqz/p8Lr1LS1CPKMtEAmkMlghxc6r1ko34PC7t2RPzjFD3rdbBvjTi6zU1oK9jF2NF1ACErRMqeX7Bl0TEqhFvHjKda8M0M5YSs4kCngkfdYX7x8hBVKlTcRDzI+80Q0yMxuSo//tBoKbAAAGU4XwjwCuB5yhZSgQvskyTznZn7vP5/zdW1xXnX9Jy1wmcKLhVUUZcCJP0rVA5XJcZWDdSMrxeF9wHgrOYbnFqmPxKdTQ6N4J1ZWRefoIj8lMoul9ZBEDwMZ3lUqIveRA4C7BbBIrvjtXqd5akixnRJMRIclcvpygobVfmtpXWr3Zx9Y9ZNl3ocjP3xiN3qeIMk9XAUZj1iQ1StvbfpEZJ9hZ/No1VyudYk+LgNqu8YeKi0J0uUwuHaE0GKTefsSrdUqHL8B39sAdB2spIozGTD2qPWbpBk0EOdDZjeg5UuOfv/SGwqJMPiKmdjr9vba8jM6D/hqXlEgEzIscwfrOYrDcKMuHehHyBuuZcyrnSD+AbvD0VKrbsT+S88tEvhjHyhcYmOBR/UAndY52PaeyuIfLyECOKIYlbf/90N9NEf3P+W4RMJJyIHgxNgkP6nfA9DGx7qEhfP46Kaevs9XXf3tlW0V1KEITKsgcSgz/Pmset6y/T4ZH79pm2ksr3urwFVJOBz6y6kgLX1MJyvl+NV4ECwJ5LvmJAWLamFnOk99mAr+GMhh1hTkDwbgjsqxjlqiDQChRbvKFQYZTiD//UyyhxDBKmptDJmC3l/vquP/r99ZmmlZxVweat4dwdL0tq1UxFRVVkp3a/wTi4AAADEyUQX7aspoDxCma/3KnZrpdUWy1oPBw1PnWvV+8iagTMzWQBsgVisNqeaOM21R8miEF03f83QDd7hl5XE+W7yTWNY1GWuwv/EAoKVBiQSGUu/6/vf8Fi/8k52FOYBIWzQ59gF7AMDqZ22HbPw8guwuWqt3/a7NMvK+GgSyN9Yt+UbUrCRIE+gcK7n/rqR3hA4oBzc0OP/EQcWhXx+ZMeHYlbpVnKyvljWl4r99VQt/LtQIy5bcbjcs4nDW/YaMltBOSkA5ZwCkkd21IFtWiLmrs7/U3/LaTTmcXNup5zIvZMn/I7uqPf5uYHKumQlJNSuryVB6FjCfQzPnyZnqCHDzWA1ByDAuDCfQ+glHj5wXWVJzbUaC5f23szF20Em6dsygx0S7k0WWVIGhihCC5TAENl71ChVa4If5Spud59s4nxwWlb6YT5lvDzzciD4njUz9FvC7s69EHKK6nG05UflZREH7T8HNVZ2m5z4ZbBx3/7RBIdqdhYtMYXC1+OIXV0G7o/6GPTPybOof7aZN5iFuPNdiQFS9Bpp7O8ZEmWN4DaRcbENmQSZotcIH3/wlZgM390/YrYHU/8kBjDX73W7PQTpc0CoO4r6U4E/jkf+9snTS15+ThSsF2Pirk37v3Clqtv2CXbCEX0zPdIdUBJbM5ho+kUPFwTctxyHJrDPFzME2zX4AvSadABXEwdNjpge3fdwyqmmneOn6s2Fbc0wchR3HLudpcHPEATjpXP4K0RvTVxgUa1JsgNHMY0u/szVQmQYI3nTudR5u/ayOh28jDKwyftzYrW6yrQzTxdOPkU1ypPXpgY2YjZ6071FqZ0c2QNhvQHngOet3ldrJTJdliuMxdn+H2Zs3/I+0FIV/eqU7TmKsgICtkFOQNvohkgqM7KfSznXpM/k5VSddLGPjXQj2UX0recFMKDHkGHZf9X7I6SOUKnIH+9tBuJuNhgjXu/FvRZpmcW+WJ4SGrEOOAQPnfYt3sBEf0Rr73R+NGP5JGCfB5gA0leHcj2zEbiCDHDQfhiRMRAknYMdCZAH9KI/v90jM6hU5iHOkOx6lUFrdVAZdoswDlh7ypxr6SP2XlpYvHwXtzb+wkcbo4AK+SK450BQy9GSJpioCHQYdfC4hTPSfM3rPw7pHKzRiurP38PdLhM8AMUynXbSyCBO8lTZFEJ/cfxPI27aki/UT9bGBbfnZyZdgDy0opdPylTrHT0D9cNyyVTcFZC0Z93JCWlkHFLxvgmQYY3CANHOXHMg3P9sI3jSckazLodlF9Qwd0j3tWINLRC6WHBZ+shDyXJAAJ34RN4reGIzEvepZzQwn9pHauKt3DjNj73x11b1fnX7487adnBFU9seF/d37BDPUGA9aXRJEbSuYfSiwOOhINRtptO9XNht3YBCU71Jb6T5sx1LtdE7cYQwicNknjLVU9Xyv9oUTk8PVmSfLMN9sGUk39Mo35dCA1y9uHo+av1bFRz+N4C9rAlsUj0yQNiWB/BLj/Im6O9BnIyKV9tmo5A5vdoA7ukGB2t/2qErXC3wFzHRdLURRG2uxIqoXeVycKDtHX8VyWB8lP8emF0aRGHUe1UroCDMgHWhu6/OhEE8CY7WX0pnpxbh9FrNvulR+h2bj6xD07QPsm/OvgD9X4+N7gIRGdnJ8ZSiJAJr43ZRfCLK1DD2EYb6OX9Q6zgP95wEdzhPDe9EnYsqPVNOubQo3uM69s6hxk3G+/G5sbF1skU0n0VmsX7Kmf9ATEHtD24s5h4PzUGiSOWwJ/lSLIYxmU8BEWLRt3PItytAnPv9FT3I8b4EonnwV/IkOBWiOt0W1+1F8QKRK892OMehfnHCfFImNL3IciDRCtzf+AA9McSaXMRNoDzI02LFcTyO1uMFpxSKnJ+bSTX9wW0w1R8UmnaWKyG5mRkbx5NQoKbsfVhRJnIfCeuz40KE8Ia3c9/8JErc5xijpyRRho2fzhL83KUj8QQLBt06YB6MWWy9Twy4C/WHug0uVF47hn0j/bmKUq3JU4AcMPhxePUGHtp8y8cqRVfHo+j3TSvQVIiFYrIP646UbIsWNA3bpW5A64rw8tdFsnJkFZWmURZvVn6Ca7ZhEDDSrtInhEwS5RNff1lhywekz82NHa1HZ2+N9XmXG2w6KFI7TH0xxoyTtJW725Y+VInMLxKEDo+pCzylkL789X2TTgTU3HeMX7HR5s7vyTloDhHiDhqKYfP9B3Z0MyusoniUX84Lxvt0+w+v/JFstJN/88p9/Q4BUvsNumUl9GvJIL9UgYn32guvyYPdqyw0W53fz2HloTvwcA2dwevI+ah2O+iQ7Xp4WMPvF63h/dBq/J/h3jR56kNzdAGCe3+CZ6cHN23zC4qQ31BBSLCmjM1J6FJPPNeT/MmD8C2i3diTD7kDRmZQMdwcaewpbH/JZ4UGa5auP475DSG1Sz3w7B66Ny5v9vHe2/KPPaGB9ML767mghzigYkDyoLbdh6Kaej+xZv6goC+qJntn7kI9XjaTZJwbQMG6MzQ8JCjiyNFOXoojnEJvBTA1qlwYq8D2C9zVgebv//dC5xHvH6F87tEBZ7gaAYAE99BvPN+D1K0fMo2slt3NTIwTg0EZMCkqIwOKQIso+raqwSCD3iSx4gKNbWd9Pber9wTJneP4i1YraTMv+jxn1WOoJ+Rmzv0HKF4kL+uL6BTSTCfcEeLeQObawshlihDwtqY4x8cIUfYGEAly/8JmgaHMndojWZDyAgSkqR+0RPS/dtpcZ7po8V5WkEs15A27oN5+jSU5tYwFdVA5FXXSAe5cVgtIWS4FdAclQHF9SFQOMPnHTObEvw2dwsB2HQKTvTjr8r5u2B+t7Vhk0suWArVS2Gc/4ujsuD2wumxxW3lWrZuU+IM/N0HrnUNy9ciRB388Y//+t/8UqxDnGg0/cAi4Ll2Vr6NI0eC3W1NyAK4VxDdAb8dslJQeYksBuZ7Zv+dsztIhbozpA6XM2/jMR9NdLZcaqFw2RkDywbwo2cyCZkqs277/cMtSWC0YHabriG35M6uoG/wGJrgJ1xg6YaJ6ffR3PFpfR+9g0khSfA/XOqOYhcCKX+iRxv4p1oQEPTN8nn7Sk1fOJgB9eV9rx4MWMm8DAogAlFCjWT18BOeYEdAdCoHFAvaVWe44VC1KRyLFtUG6RBgS1BE1oc4fxQ27lgPlCh5J3xDBM5dfbiXMMVwLsPmJAnAizZtVimpV51xERlraq6CBXFhpYGlG0ZjmhqfBxbu5tJ04ZlbTVoq1WggAV8aNwGjhMsd+hRSC1PF7AzD2rG13BuXNEmkw0tPyjphvCF3KGP4Whx+DSauDcJ2iENq5+xRUVybZTwvg5+SRjoHKy9bNHYuImxL03+hcDH9T4Iwte4JKezllOAlddIx1G+ds/4GeioklDtlOR9yvWefjwW5wqo9d4kDMI0NKZDzDDRtn2m9GGI+21I0So8ayM4EYXJtT7w/vR1txKK9VRQqf6RPvYj3khOZqwqlh+sINgW/NpSw7Wip0FpDZKYN1rZvF7ZK9TBRDAVeLcmETkCV/+1CxfxRUoFL7HYi4g2ljm8C5uymfFSwdhU1nsqSrVKZa4EN5BSZLPXJgkj2JgtSyRPFHK3ENk2n5mgE/B7jdt5xCvbrIYmXthO/4ac5hSffFvKFLJeXnjuGBlV+mKsdJIA3e8QatPMXW1eAxOWICoKuEFjxVCqm+cRlnL31mbP+NgPfuUPEalFupK7L4Xrem0A7vSyKmWccTG+oNKvTjuzs7Qn46S6rfNPUAE+9e4V2+tYYICjm5Ef/9W62rQAB/voH0sCM5fHqAdspWrsQxc2dSpjvsqy/ZTwLt8xYmaZynCt8Yi9fpcZ+USBSAM6BW/q2/kzHoCYrgCaBhr7u4m3hRQeKdCN0nBSmVCphT72XQS9DUuyXAOOEnOa3vXIo6baec/76k/6vjiqs/Enl3m7+DePVkZTithVxcG3FJwNjLuz099tQGFI1mg+IYIx0pVo+FwPZCj7pV6CCnphnGiUS3a9QL/jzaIbP82SJv5qlkJ/o8/3pmS5ECSEGFwBSjhzIF5hIG/8Zyuz4Qeo44xg3ohJ3ZF/giBL4HUIOHhRJRVS4R3GDMH5FXdR7jofRfJaqW/zc9sH959QFGYIb56g9RbHbf1UN5g2Uw2NY2ZNGlidNp/QBoe/wOeDjKL5S5wYSvE/IXEDrQsxagh/ET8D5X/BcO7vQK9BTkjbr1xZ5BL5zZ6ugZ7blxnrpeKlQrWWD/6h6SCUXKstdYdLbwu7Z1tEaqW1Fu0fpOmNgG+jlgkqPHx3QprXbOnNEw88s/oHoFERt6V6DKqJSghPn+pg/BU/JwBUCVl4V/OrQj2744cOl2O+cbRRL5ggAAAAA","sparkles.png":"data:image/webp;base64,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","crown.png":"data:image/webp;base64,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","icons/daily-reset.svg":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGNpcmNsZSBjeD0iMzIiIGN5PSIzNCIgcj0iMjMiIGZpbGw9IiNEQ0VCRkYiIHN0cm9rZT0iIzM0N0ZGMCIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHBhdGggZD0iTTMyIDE4djE2bDExIDciIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzI0NTlCNyIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMjIgNWgyME0zMiA1djYiIHN0cm9rZT0iIzM0N0ZGMCIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=","icons/random-questions.svg":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iNSIgeT0iNSIgd2lkdGg9IjU0IiBoZWlnaHQ9IjU0IiByeD0iMTMiIGZpbGw9IiNFOERGRkYiLz48cGF0aCBkPSJNMjEgMjJoMjJNMjEgMzJoMjJNMjEgNDJoMTIiIHN0cm9rZT0iIzgwNTVFOCIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48Y2lyY2xlIGN4PSI0NSIgY3k9IjQ0IiByPSI4IiBmaWxsPSIjRkY1NzJCIi8+PHBhdGggZD0iTTQ1IDQwdjVtMCAzaC4xIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=","icons/lesson.svg":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iOSIgeT0iOCIgd2lkdGg9IjQ2IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0RDRUJGRiIvPjxwYXRoIGQ9Ik0xOCAxOGgyOE0xOCAyN2gyOE0xOCAzNmgyME0xOCA0NWgxNSIgc3Ryb2tlPSIjMjg3OEYwIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==","icons/test-complete.svg":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiNEREY4RTYiLz48cGF0aCBkPSJtMTggMzMgOSA5IDIwLTIyIiBmaWxsPSJub25lIiBzdHJva2U9IiMxNkI5NUEiIHN0cm9rZS13aWR0aD0iNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+","icons/coin.svg":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjciIGZpbGw9IiNGRkI5MUYiLz48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRTk4QTAwIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJtMzIgMTcgNC43IDkuNSAxMC41IDEuNS03LjYgNy40IDEuOCAxMC40LTkuNC01LTkuNCA1IDEuOC0xMC40LTcuNi03LjQgMTAuNS0xLjV6IiBmaWxsPSIjRkZGMEE2Ii8+PC9zdmc+","icons/trainer.svg":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iNSIgeT0iMTUiIHdpZHRoPSI1NCIgaGVpZ2h0PSIzNCIgcng9IjEwIiBmaWxsPSIjRkY1NzJCIi8+PHBhdGggZD0iTTE4IDI1djE0TTExIDMyaDE0TTQyIDI3aDFNNDkgMzZoMSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxjaXJjbGUgY3g9IjQzIiBjeT0iMzYiIHI9IjIuNSIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMjciIHI9IjIuNSIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==","cube.png":"data:image/webp;base64,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","pyramid.png":"data:image/webp;base64,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","books.png":"data:image/webp;base64,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","orb.png":"data:image/webp;base64,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","chart.png":"data:image/webp;base64,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","shuffle.png":"data:image/webp;base64,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"};
const ART = {
  waving: "mascot-waving.png", think: "mascot-think.png", celebrate: "mascot-celebrate.png",
  trophy: "mascot-trophy.png", checklist: "mascot-checklist.png",
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
// Ustuvorlik: `katex` prop → window.katex → `katexBase` (ixtiyoriy: KaTeX dist papkasi manzili). Standart holatda hech qanday tashqi
// manzil yuklanmaydi; KaTeX bo‘lmasa ifodalar oddiy Unicode matn ko‘rinishida chiqadi (3/4, x², √18), test to‘xtamaydi.
const KATEX_SRI = {
  js: "sha384-a1WQdjRj162i159OYq041X6I4K8NenkrI09LlPmiHg0YOb7CR+wJOraXwK9abpnE",
  css: "sha384-WwGtaC6ywCHxA5cstpj/3+xIZvTez8dq2IcBQaXRkenHZ7FVVq1ZROtURwfbtTlG",
};
const KATEX_PINNED_SUFFIX = "katex@0.19.1/dist";
const KatexContext = createContext(null);
const katexLoads = new Map();
function loadKatex(base) {
  if (typeof window === "undefined" || !base) return Promise.resolve(null);
  if (window.katex) return Promise.resolve(window.katex);
  const root = base.replace(/\/$/, "");
  if (!katexLoads.has(root)) {
    katexLoads.set(root, new Promise((resolve) => {
      // SRI faqat aynan shu versiya (0.19.1) uchun qo‘yiladi.
      const pinned = root.endsWith(KATEX_PINNED_SUFFIX);
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
  const needed = !katexProp && !loaded && Boolean(base);
  useEffect(() => {
    if (!needed) return undefined;
    let alive = true;
    loadKatex(base).then((lib) => { if (alive && lib) setLoaded(lib); });
    return () => { alive = false; };
  }, [needed, base]);
  return katexProp ?? loaded;
}

const CSS = `
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
.mp-qleft{display:flex;align-items:center;gap:10px;min-width:0}
.mp-listen{flex:none;display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px 0 11px;border:1px solid #eadfd9;border-radius:999px;background:#fff;color:#665752;font-size:13px;font-weight:800;cursor:pointer;transition:background .2s,border-color .2s,color .2s,transform .15s}
.mp-listen:hover{border-color:var(--accent);background:#fff5ef;color:var(--accent-dark)}
.mp-listen:active{transform:scale(.95)}
.mp-listen.is-on{border-color:var(--glow);color:var(--glow);background:color-mix(in srgb,var(--glow) 9%,#fff)}
.mp-listen.is-on svg path:nth-child(2){animation:mp-wave 1s ease-in-out infinite}
.mp-listen.is-on svg path:nth-child(3){animation:mp-wave 1s .25s ease-in-out infinite}
@keyframes mp-wave{0%,100%{opacity:.25}50%{opacity:1}}
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
@media (max-width:420px){.mp-listen{width:36px;padding:0;justify-content:center}.mp-listen span{display:none}}
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

// To‘g‘ri/xato/“Bilmayman” xabari: savol kartasi ham, ovoz ham aynan shu matnni ishlatadi.
function feedbackMessage(ui, state, seed, itemId) {
  const index = hashString(`${seed}:${itemId}`);
  return state === "ok" ? ui.correct[index % ui.correct.length] : state === "bad" ? ui.wrong[index % ui.wrong.length] : ui.skipped;
}

// Javobdan keyingi gaplar: to‘g‘ri — faqat xabar; xato/“Bilmayman” — xabar va to‘g‘ri javob.
function reactionSpeech(ui, lang, seed, reaction) {
  const { response, item } = reaction;
  const state = response.skipped ? "skip" : response.correct ? "ok" : "bad";
  const message = toSpeech(feedbackMessage(ui, state, seed, item.id), lang);
  return state === "ok" ? [message] : [message, `${toSpeech(ui.rightAnswer, lang)}: ${answerSpeech(item, lang)}`];
}

// ── Ovozli o‘qish ──
// Dars fayllaridagi kabi: `ttsApiBase` berilsa serverdan (GET /api/tts), bo‘lmasa brauzer speechSynthesis. Bir vaqtda faqat bitta
// navbat o‘ynaydi: yangi gap eskisini to‘xtatadi. Brauzer birinchi bosishgacha ovozni bloklasa, birinchi bosish/tugmada davom etadi.
const VOICE_GAP_MS = 220;
function pickPreviewVoice(synth, lang) {
  const voices = synth.getVoices?.() || [];
  const prefixes = lang === "uz" ? ["uz", "tr", "az", "en"] : lang === "en" ? ["en"] : ["ru"];
  for (const prefix of prefixes) {
    const voice = voices.find((item) => String(item.lang || "").toLowerCase().startsWith(prefix));
    if (voice) return voice;
  }
  return null;
}
// Navbat mantiqi React’dan tashqarida (oddiy sinf): rekursiv o‘ynash va taymerlar renderga bog‘liq emas.
class VoiceEngine {
  constructor(notify) {
    this.token = 0;
    this.lines = [];
    this.index = 0;
    this.audio = null;
    this.timer = null;
    this.watchdog = null;
    this.blocked = false;
    this.enabled = true;
    this.lang = "uz";
    this.base = undefined;
    this.notify = notify;
  }

  configure({ enabled, lang, base }) {
    this.enabled = enabled;
    this.lang = lang;
    this.base = base;
  }

  halt() {
    this.token += 1;
    clearTimeout(this.timer);
    clearTimeout(this.watchdog);
    if (this.audio) {
      try { this.audio.onended = null; this.audio.onerror = null; this.audio.pause(); } catch { /* audio yo‘q */ }
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch { /* sintez yo‘q */ }
    }
    this.notify(false);
  }

  speak(lines, force = false) {
    const list = (Array.isArray(lines) ? lines : [lines]).map((line) => String(line ?? "").trim()).filter(Boolean);
    this.halt();
    this.lines = list;
    this.blocked = false;
    if ((!this.enabled && !force) || !list.length) return;
    this.run(0, this.token);
  }

  // Brauzer ovozni bloklagan bo‘lsa, birinchi bosish/tugma bosilganda to‘xtagan joydan davom etadi.
  resume() {
    if (!this.blocked || !this.enabled || !this.lines.length) return;
    this.blocked = false;
    this.run(this.index, this.token);
  }

  run(index, token) {
    if (token !== this.token) return;
    if (index >= this.lines.length) { this.notify(false); return; }
    this.index = index;
    const text = this.lines[index];
    let settled = false;
    const settle = (blocked) => {
      if (settled || token !== this.token) return;
      settled = true;
      clearTimeout(this.watchdog);
      if (blocked) { this.blocked = true; this.notify(false); return; }
      this.timer = setTimeout(() => this.run(index + 1, token), VOICE_GAP_MS);
    };
    const words = text.split(/\s+/).length;
    this.watchdog = setTimeout(() => settle(false), Math.max(8000, Math.min(45000, words * 900 + 5000)));
    this.notify(true);
    if (this.base) {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.audio.preload = "auto";
      }
      const element = this.audio;
      element.onended = () => settle(false);
      element.onerror = () => settle(false);
      element.src = buildTtsUrl(this.base, text, this.lang);
      const started = element.play();
      if (started && started.catch) started.catch((error) => settle(Boolean(error) && error.name === "NotAllowedError"));
    } else if (typeof window !== "undefined" && window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined") {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.lang === "uz" ? "uz-UZ" : this.lang === "en" ? "en-GB" : "ru-RU";
      const voice = pickPreviewVoice(synth, this.lang);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.onend = () => settle(false);
      utterance.onerror = (event) => settle(event.error === "not-allowed");
      // cancel() dan keyin darhol speak() qilish Chrome’da jim qoladi — qisqa kutamiz.
      this.timer = setTimeout(() => { try { synth.speak(utterance); } catch { settle(false); } }, 60);
    } else {
      settle(false);
    }
  }
}

function useVoice({ enabled, lang, ttsApiBase }) {
  const [speaking, setSpeaking] = useState(false);
  const [engine] = useState(() => new VoiceEngine(setSpeaking));
  // Sozlamalar effektda yangilanadi (bu kanca ota-komponentning speak chaqiruvlaridan oldin e’lon qilingan, shuning uchun ular doim yangi qiymatni ko‘radi).
  useEffect(() => { engine.configure({ enabled, lang, base: ttsApiBase }); }, [engine, enabled, lang, ttsApiBase]);
  useEffect(() => {
    const resume = () => engine.resume();
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, [engine]);
  useEffect(() => { if (!enabled) engine.halt(); }, [engine, enabled]);
  useEffect(() => () => engine.halt(), [engine]);
  const speak = useCallback((lines, options) => engine.speak(lines, Boolean(options?.force)), [engine]);
  return useMemo(() => ({ speak, speaking }), [speak, speaking]);
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

function QuestionCard({ item, ui, lang, seed, index, total, reaction, senior, speaking, onListen, onAnswer, onNext }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const answered = reaction?.response ?? null;
  const state = answered ? (answered.skipped ? "skip" : answered.correct ? "ok" : "bad") : "idle";
  const order = useMemo(() => (item.type === "choice" ? seededShuffle(item.options.map((_, i) => i), seed, `opts-${item.id}`) : []), [item, seed]);
  const messageIndex = hashString(`${seed}:${item.id}`);
  const message = feedbackMessage(ui, state, seed, item.id);
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
          <div className="mp-qleft">
            <span className="mp-topic"><b>{DOMAIN_GLYPH[item.domain]}</b>{ui.domains[item.domain]}</span>
            <button type="button" className={`mp-listen ${speaking ? "is-on" : ""}`} onClick={onListen} aria-label={ui.listen} title={ui.listen}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" />
                <path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
              </svg>
              <span>{ui.listen}</span>
            </button>
          </div>
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

function QuizScreen({ item, ui, lang, seed, index, total, responses, reaction, senior, soundOn, speaking, onToggleSound, onListen, onAnswer, onNext, onExit }) {
  return (
    <div className="mp-stage">
      <div className="mp-focus">
        <header className="mp-top">
          <Progress total={total} responses={responses} activeIndex={index} />
          <span className="mp-counter">{index + 1} / {total}</span>
          <SoundToggle on={soundOn} onToggle={onToggleSound} ui={ui} />
          <button type="button" className="mp-icon-btn" onClick={onExit} aria-label={ui.exit} title={ui.exit}>✕</button>
        </header>
        <QuestionCard key={item.id} item={item} ui={ui} lang={lang} seed={seed} index={index} total={total} reaction={reaction} senior={senior} speaking={speaking} onListen={onListen} onAnswer={onAnswer} onNext={onNext} />
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
 *   ttsApiBase?: string,
 *   onHome?: () => void,
 *   onProgress?: (event: { status: "in_progress" | "complete" | "incomplete", answeredCount: number, responses: object[], phase: string, response?: object, reasonCode?: string }) => void,
 *   onComplete?: (result: ReturnType<typeof buildResult>) => void,
 *   onFinished?: (payload: { lessonId: string, lessonTitle: string, durationSec: number | null, completionType: string }) => void,
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
  katexBase,
  ttsApiBase,
  onHome = () => {},
  onProgress,
  onComplete,
  onFinished,
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
  const finishedRef = useRef(false);
  const sfx = useSfx(soundOn);
  const voice = useVoice({ enabled: soundOn, lang: activeLang, ttsApiBase });
  const { speak } = voice;
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

  // ── Ovoz: qisqa va aniq. Ochilish ekrani → savol → javob xabari → natija. Har yangi gap eskisini to‘xtatadi. ──
  const phase = session.phase;
  const introKind = phase === "intro" && countdown === null ? (grade ? (requiresTest(grade) ? (propGrade !== null ? "test" : null) : "free") : "pick") : null;
  useEffect(() => {
    if (!introKind) return;
    if (introKind === "pick") speak([toSpeech(`${ui.hello(name)} ${ui.introTitle}.`, activeLang), toSpeech(ui.pickGrade, activeLang)]);
    else if (introKind === "free") speak(ui.sayFree(name).map((line) => toSpeech(line, activeLang)));
    else {
      const count = planTotal(getPlan(grade));
      speak(toSpeech(ui.sayTest(name, grade, count, estimateMinutes(count)), activeLang));
    }
  }, [introKind, grade, activeLang, name, ui, speak]);

  const questionId = phase === "quiz" && currentItem && !reaction ? currentItem.id : null;
  useEffect(() => {
    if (!questionId) return undefined;
    const timer = setTimeout(() => speak(questionSpeech(currentItem, activeLang)), 350);
    return () => clearTimeout(timer);
  }, [questionId, currentItem, activeLang, speak]);

  useEffect(() => {
    if (reaction) speak(reactionSpeech(ui, activeLang, session.seed, reaction));
  }, [reaction, ui, activeLang, session.seed, speak]);

  const closing = phase === "result" || phase === "notest" || phase === "incomplete" ? phase : null;
  useEffect(() => {
    if (!closing) return;
    const result = session.result;
    let lines = [];
    if (closing === "result" && result) {
      const atOwn = result.ownGradeUnlocked && result.openGrade === result.studentGrade;
      lines = [ui.sayScore(result.score, result.totalQuestions), `${ui.openTitle}: ${ui.openGrade(result.openGrade)}.`, atOwn ? ui.openNotePerfect : ui.openNoteBelow(result.openGrade)];
    } else if (closing === "notest") lines = [ui.noTestTitle, ui.noTestText];
    else if (closing === "incomplete") lines = [ui.incompleteTitle, ui.incompleteText];
    speak(lines.map((line) => toSpeech(line, activeLang)));
  }, [closing, session.result, ui, activeLang, speak]);

  const listen = useCallback(() => {
    speak(reaction ? reactionSpeech(ui, activeLang, session.seed, reaction) : questionSpeech(currentItem, activeLang), { force: true });
  }, [reaction, ui, activeLang, session.seed, currentItem, speak]);

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
    finishedRef.current = false;
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

  // “Yakunlash” / “Darslarni boshlash”: LMS ga onFinished yuki bir marta yuboriladi, so‘ng onHome chaqiriladi.
  const finish = useCallback(() => {
    if (!finishedRef.current) {
      finishedRef.current = true;
      let payload = null;
      if (session.result) payload = session.result;
      else if (session.incomplete) {
        const endedAt = session.incomplete.endedAt;
        payload = {
          completionType: "INCOMPLETE",
          placementLevel: null,
          recommendedCourse: null,
          confidence: "unknown",
          studentGrade: session.studentGrade,
          totalQuestions: session.incomplete.totalQuestions,
          answeredCount: session.incomplete.answeredCount,
          reasonCode: session.incomplete.reasonCode,
          responses: session.responses,
          lang: activeLang,
          startedAt: session.startedAt,
          completedAt: endedAt,
          durationSec: session.startedAt && endedAt ? Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(session.startedAt)) / 1000)) : null,
          engineVersion: ENGINE_VERSION,
        };
      }
      if (payload) onFinished?.({ lessonId: LESSON_ID, lessonTitle: LESSON_TITLES[activeLang], durationSec: payload.durationSec ?? null, ...payload });
    }
    onHome();
  }, [activeLang, onFinished, onHome, session]);

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
        responses={session.responses} reaction={reaction} senior={senior} soundOn={soundOn} speaking={voice.speaking} onToggleSound={toggleSound} onListen={listen}
        onAnswer={answerCurrent} onNext={advance} onExit={() => setExitOpen(true)} />
    );
  } else if (session.phase === "result" && session.result) {
    screen = <ResultScreen ui={ui} name={name} result={session.result} senior={senior} onHome={finish} />;
  } else if (session.phase === "notest" && session.result) {
    screen = <NoTestScreen ui={ui} name={name} onHome={finish} />;
  } else if (session.phase === "incomplete" && session.incomplete) {
    screen = <IncompleteScreen ui={ui} incomplete={session.incomplete} onRetake={resetTest} onHome={finish} />;
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
