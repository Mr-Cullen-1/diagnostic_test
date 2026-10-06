"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Check, X, Award, Sparkles,
  Lightbulb, LogOut, AlertTriangle,
} from 'lucide-react';
import { useSfx } from './math-sfx';
const mathTestItems14 = [
  {
    id: 'g1-compound', grade: 1, domain: 'operations', type: 'number',
    uz: {
      skill: "Noma'lum qismli masala",
      question: "Do'konda 40 ta o'yinchoq bor edi. Yana 30 ta keltirildi. Bir nechtasi sotilgach, 20 ta qoldi. Nechta o'yinchoq sotildi?",
      answer: '50',
      correctText: "Sotishdan oldin 40 + 30 = 70 ta edi. Sotilgani 70 − 20 = 50 ta.",
      wrongText: "Avval sotishdan oldin nechta bo'lganini toping. So'ng undan qolganini ayiring.",
    },
    ru: {
      skill: 'Задача с неизвестной частью',
      question: 'В магазине было 40 игрушек. Привезли ещё 30. После продажи осталось 20. Сколько игрушек продали?',
      answer: '50',
      correctText: 'До продажи было 40 + 30 = 70. Продали 70 − 20 = 50.',
      wrongText: 'Сначала найди, сколько стало до продажи. Затем вычти из этого числа остаток.',
    },
    en: {
      skill: 'Problem with an unknown part',
      question: 'A shop had 40 toys. Another 30 were brought in. After some were sold, 20 were left. How many toys were sold?',
      answer: '50',
      correctText: 'Before the sale there were 40 + 30 = 70. Sold: 70 − 20 = 50.',
      wrongText: 'First find how many there were before the sale. Then subtract what was left.',
    },
  },
  {
    id: 'g1-order', grade: 1, domain: 'reasoning', type: 'sequence',
    uz: {
      skill: 'Xonalar tarkibi',
      question: "Sonlarni o'sish tartibida joylashtiring.",
      tokens: ['60', '16', '61'], expected: ['16', '60', '61'],
      correctText: "16 da bitta o'nlik, 60 va 61 da oltita o'nlik. 60 dan 61 kattaroq: 16, 60, 61.",
      wrongText: "Avval o'nliklarni taqqoslang. O'nliklari teng bo'lsa, birliklarga qarang.",
    },
    ru: {
      skill: 'Разрядный состав',
      question: 'Расположи числа в порядке возрастания.',
      tokens: ['60', '16', '61'], expected: ['16', '60', '61'],
      correctText: 'В 16 один десяток, в 60 и 61 — шесть десятков. Из них 61 больше: 16, 60, 61.',
      wrongText: 'Сначала сравни десятки. Если десятки одинаковые, посмотри на единицы.',
    },
    en: {
      skill: 'Place value',
      question: 'Put the numbers in increasing order.',
      tokens: ['60', '16', '61'], expected: ['16', '60', '61'],
      correctText: '16 has one ten, while 60 and 61 have six tens. Of those two, 61 is larger: 16, 60, 61.',
      wrongText: 'Compare the tens first. If the tens are equal, look at the ones.',
    },
  },
  {
    id: 'g1-build', grade: 1, domain: 'operations', type: 'equation',
    uz: {
      skill: "Yuzlik ichida qo'shish",
      question: "Qo'shishga doir to'g'ri tenglikni tuzing.",
      tokens: ['57', '=', '26', '+', '31'], expected: ['26', '+', '31', '=', '57'],
      correctText: "O'nliklarni o'nlikka, birliklarni birlikka qo'shamiz: 20 + 30 = 50, 6 + 1 = 7, jami 57.",
      wrongText: "Yig'indi teng belgisidan keyin turadi. Avval ikki qo'shiluvchini qo'ying, so'ng natijani.",
    },
    ru: {
      skill: 'Сложение в пределах 100',
      question: 'Собери верное равенство на сложение.',
      tokens: ['57', '=', '26', '+', '31'], expected: ['26', '+', '31', '=', '57'],
      correctText: 'Десятки складываем с десятками, единицы с единицами: 20 + 30 = 50, 6 + 1 = 7, всего 57.',
      wrongText: 'Сумма стоит после знака равно. Сначала поставь два слагаемых, потом результат.',
    },
    en: {
      skill: 'Addition within 100',
      question: 'Build a correct addition equality.',
      tokens: ['57', '=', '26', '+', '31'], expected: ['26', '+', '31', '=', '57'],
      correctText: 'Add tens to tens and ones to ones: 20 + 30 = 50, 6 + 1 = 7, which is 57 in total.',
      wrongText: 'The sum goes after the equals sign. Put the two addends first, then the result.',
    },
  },
  {
    id: 'g1-length', grade: 1, domain: 'measurement', type: 'match',
    uz: {
      skill: "Uzunlik birliklari",
      question: "Har bir uzunlikni santimetrdagi qiymati bilan bog'lang.",
      pairs: [{ id: 'a', left: '3 dm', right: '30' }, { id: 'b', left: '1 m', right: '100' }, { id: 'c', left: '4 dm 5 sm', right: '45' }],
      answers: ['100', '45', '30'],
      correctText: "Bir detsimetrda 10 sm bor: 3 dm = 30 sm. Bir metrda 100 sm: 1 m = 100 sm. 4 dm 5 sm = 40 + 5 = 45 sm.",
      wrongText: "Bir detsimetr o'nta santimetr, bir metr yuzta santimetr. Avval detsimetrlarni santimetrga aylantiring.",
    },
    ru: {
      skill: 'Единицы длины',
      question: 'Соедини каждую длину с её значением в сантиметрах.',
      pairs: [{ id: 'a', left: '3 дм', right: '30' }, { id: 'b', left: '1 м', right: '100' }, { id: 'c', left: '4 дм 5 см', right: '45' }],
      answers: ['100', '45', '30'],
      correctText: 'В одном дециметре 10 см: 3 дм = 30 см. В одном метре 100 см: 1 м = 100 см. 4 дм 5 см = 40 + 5 = 45 см.',
      wrongText: 'Один дециметр — это десять сантиметров, один метр — сто. Сначала переведи дециметры в сантиметры.',
    },
    en: {
      skill: 'Units of length',
      question: 'Match each length with its value in centimetres.',
      pairs: [{ id: 'a', left: '3 dm', right: '30' }, { id: 'b', left: '1 m', right: '100' }, { id: 'c', left: '4 dm 5 cm', right: '45' }],
      answers: ['100', '45', '30'],
      correctText: 'One decimetre is 10 cm: 3 dm = 30 cm. One metre is 100 cm: 1 m = 100 cm. 4 dm 5 cm = 40 + 5 = 45 cm.',
      wrongText: 'One decimetre is ten centimetres and one metre is a hundred. Convert the decimetres first.',
    },
  },
  {
    id: 'g1-chain', grade: 1, domain: 'operations', type: 'number',
    uz: {
      skill: "Ketma-ket ikki amal",
      question: "Hisoblang: 17 + 22 − 30",
      answer: '9',
      correctText: "Amallar chapdan o'ngga ketma-ket bajariladi: 17 + 22 = 39, so'ng 39 − 30 = 9.",
      wrongText: "Bu yerda ikki amal bor va ular chapdan o'ngga bajariladi. Avval qo'shing, keyin ayiring.",
    },
    ru: {
      skill: 'Два действия подряд',
      question: 'Вычисли: 17 + 22 − 30',
      answer: '9',
      correctText: 'Действия выполняются по порядку слева направо: 17 + 22 = 39, затем 39 − 30 = 9.',
      wrongText: 'Здесь два действия, и они идут слева направо. Сначала сложи, потом вычти.',
    },
    en: {
      skill: 'Two operations in a row',
      question: 'Work out: 17 + 22 − 30',
      answer: '9',
      correctText: 'The operations are done in order from left to right: 17 + 22 = 39, then 39 − 30 = 9.',
      wrongText: 'There are two operations here and they go from left to right. Add first, then subtract.',
    },
  },
  {
    id: 'g2-table', grade: 2, domain: 'operations', type: 'match',
    uz: {
      skill: "Ko'paytirish va bo'lish jadvali",
      question: "Misolni javobi bilan bog'lang.",
      pairs: [{ id: 'a', left: '7 × 8', right: '56' }, { id: 'b', left: '54 : 6', right: '9' }, { id: 'c', left: '4 × 9', right: '36' }],
      answers: ['9', '36', '56'],
      correctText: "Yetti karra sakkiz ellik olti, ellik to'rtni oltiga bo'lsak to'qqiz, to'rt karra to'qqiz o'ttiz olti.",
      wrongText: "Ko'paytirish natijasi ko'paytuvchilardan katta, bo'lish natijasi esa bo'linuvchidan kichik bo'ladi.",
    },
    ru: {
      skill: 'Таблица умножения и деления',
      question: 'Соедини пример с ответом.',
      pairs: [{ id: 'a', left: '7 × 8', right: '56' }, { id: 'b', left: '54 : 6', right: '9' }, { id: 'c', left: '4 × 9', right: '36' }],
      answers: ['9', '36', '56'],
      correctText: 'Семью восемь — пятьдесят шесть, пятьдесят четыре разделить на шесть — девять, четырежды девять — тридцать шесть.',
      wrongText: 'При умножении результат больше множителей, а при делении меньше делимого.',
    },
    en: {
      skill: 'Multiplication and division facts',
      question: 'Match each calculation with its answer.',
      pairs: [{ id: 'a', left: '7 × 8', right: '56' }, { id: 'b', left: '54 : 6', right: '9' }, { id: 'c', left: '4 × 9', right: '36' }],
      answers: ['9', '36', '56'],
      correctText: 'Seven eights are fifty six, fifty four divided by six is nine, four nines are thirty six.',
      wrongText: 'Multiplying makes the result larger than the factors; dividing makes it smaller than the dividend.',
    },
  },
  {
    id: 'g2-build', grade: 2, domain: 'operations', type: 'equation',
    uz: {
      skill: "O'nlikdan o'tib ayirish",
      question: "Ayirishga doir to'g'ri tenglikni tuzing.",
      tokens: ['63', '=', '100', '−', '37'], expected: ['100', '−', '37', '=', '63'],
      correctText: "Yuzdan o'ttiz yettini ayiramiz: 100 − 30 = 70, 70 − 7 = 63.",
      wrongText: "Kamayuvchi birinchi turadi, natija esa teng belgisidan keyin. Yuz sonidan boshlang.",
    },
    ru: {
      skill: 'Вычитание с переходом',
      question: 'Собери верное равенство на вычитание.',
      tokens: ['63', '=', '100', '−', '37'], expected: ['100', '−', '37', '=', '63'],
      correctText: 'Из ста вычитаем тридцать семь: 100 − 30 = 70, 70 − 7 = 63.',
      wrongText: 'Уменьшаемое стоит первым, а результат после знака равно. Начни со ста.',
    },
    en: {
      skill: 'Subtraction with regrouping',
      question: 'Build a correct subtraction equality.',
      tokens: ['63', '=', '100', '−', '37'], expected: ['100', '−', '37', '=', '63'],
      correctText: 'Subtract thirty seven from one hundred: 100 − 30 = 70, then 70 − 7 = 63.',
      wrongText: 'The larger number comes first and the result after the equals sign. Start from one hundred.',
    },
  },
  {
    id: 'g2-equation', grade: 2, domain: 'reasoning', type: 'number',
    uz: {
      skill: "Tenglama",
      question: "45 − x = 28 tenglamada x ni toping.",
      answer: '17',
      correctText: "Noma'lum ayiriluvchini topish uchun kamayuvchidan ayirmani ayiramiz: 45 − 28 = 17.",
      wrongText: "Iks ayiriladigan son. Uni topish uchun katta sondan natijani ayiring.",
    },
    ru: {
      skill: 'Уравнение',
      question: 'Найди x в уравнении 45 − x = 28.',
      answer: '17',
      correctText: 'Чтобы найти неизвестное вычитаемое, вычитаем разность из уменьшаемого: 45 − 28 = 17.',
      wrongText: 'Икс — это то, что вычитают. Чтобы его найти, вычти результат из большего числа.',
    },
    en: {
      skill: 'Equation',
      question: 'Find x in the equation 45 − x = 28.',
      answer: '17',
      correctText: 'To find what was taken away, subtract the result from the first number: 45 − 28 = 17.',
      wrongText: 'x is what gets taken away. To find it, subtract the result from the larger number.',
    },
  },
  {
    id: 'g2-share', grade: 2, domain: 'number', type: 'sequence',
    uz: {
      skill: "Butunning bo'laklari",
      question: "Qiymatlarni o'sish tartibida joylashtiring.",
      tokens: ['20 ning yarmi', '21 ning uchdan biri', '20 ning choragi'],
      expected: ['20 ning choragi', '21 ning uchdan biri', '20 ning yarmi'],
      correctText: "20 ning choragi 5, 21 ning uchdan biri 7, 20 ning yarmi 10. Demak 5, 7, 10.",
      wrongText: "Har bir bo'lakni alohida hisoblang: yarmi ikkiga, uchdan biri uchga, choragi to'rtga bo'linadi.",
    },
    ru: {
      skill: 'Доли целого',
      question: 'Расположи значения в порядке возрастания.',
      tokens: ['половина от 20', 'треть от 21', 'четверть от 20'],
      expected: ['четверть от 20', 'треть от 21', 'половина от 20'],
      correctText: 'Четверть от 20 это 5, треть от 21 это 7, половина от 20 это 10. Значит 5, 7, 10.',
      wrongText: 'Посчитай каждую долю отдельно: половину делят на два, треть на три, четверть на четыре.',
    },
    en: {
      skill: 'Fractions of a whole',
      question: 'Put the values in increasing order.',
      tokens: ['half of 20', 'a third of 21', 'a quarter of 20'],
      expected: ['a quarter of 20', 'a third of 21', 'half of 20'],
      correctText: 'A quarter of 20 is 5, a third of 21 is 7, half of 20 is 10. So 5, 7, 10.',
      wrongText: 'Work out each share separately: halves divide by two, thirds by three, quarters by four.',
    },
  },
  {
    id: 'g2-time', grade: 2, domain: 'measurement', type: 'number',
    uz: {
      skill: "Soat va minut",
      question: "Dars 9:15 da boshlandi va 10:00 da tugadi. Dars necha minut davom etdi?",
      answer: '45',
      correctText: "9:15 dan 10:00 gacha 45 minut bor: soat 10 gacha 45 minut qoladi.",
      wrongText: "Bir soatda 60 minut bor. 9:15 dan 10:00 gacha nechta minut qolganini sanang.",
    },
    ru: {
      skill: 'Час и минута',
      question: 'Урок начался в 9:15 и закончился в 10:00. Сколько минут длился урок?',
      answer: '45',
      correctText: 'От 9:15 до 10:00 проходит 45 минут: до целого часа остаётся 45 минут.',
      wrongText: 'В одном часе 60 минут. Посчитай, сколько минут остаётся от 9:15 до 10:00.',
    },
    en: {
      skill: 'Hours and minutes',
      question: 'A lesson started at 9:15 and ended at 10:00. How many minutes did it last?',
      answer: '45',
      correctText: 'From 9:15 to 10:00 there are 45 minutes: that is what is left until the full hour.',
      wrongText: 'There are 60 minutes in an hour. Count how many minutes are left from 9:15 to 10:00.',
    },
  },
  {
    id: 'g3-remainder', grade: 3, domain: 'operations', type: 'number',
    uz: {
      skill: "Qoldiqli bo'lish",
      question: "47 ta konfetni 5 tadan qilib paketlarga solishdi. Nechta konfet ortib qoldi?",
      answer: '2',
      correctText: "47 : 5 = 9 ta paket va 2 ta qoldiq, chunki 9 · 5 = 45, 47 − 45 = 2.",
      wrongText: "Beshga bo'linadigan eng katta sonni toping, so'ng uni 47 dan ayiring.",
    },
    ru: {
      skill: 'Деление с остатком',
      question: '47 конфет разложили в пакеты по 5 штук. Сколько конфет осталось?',
      answer: '2',
      correctText: '47 : 5 = 9 пакетов и 2 в остатке, потому что 9 · 5 = 45, а 47 − 45 = 2.',
      wrongText: 'Найди самое большое число, которое делится на 5, и вычти его из 47.',
    },
    en: {
      skill: 'Division with a remainder',
      question: '47 sweets were packed into bags of 5. How many sweets were left over?',
      answer: '2',
      correctText: '47 : 5 = 9 bags with 2 left over, because 9 · 5 = 45 and 47 − 45 = 2.',
      wrongText: 'Find the largest number that divides by 5 and subtract it from 47.',
    },
  },
  {
    id: 'g3-multiply', grade: 3, domain: 'operations', type: 'number',
    uz: {
      skill: "Yumaloq songa ko'paytirish",
      question: "Hisoblang: 320 · 3",
      answer: '960',
      correctText: "32 · 3 = 96, oxiriga nolni qo'yamiz: 960.",
      wrongText: "Nolni vaqtincha yopib qo'ying va 32 ni 3 ga ko'paytiring. So'ng natijaga nolni qaytaring.",
    },
    ru: {
      skill: 'Умножение круглого числа',
      question: 'Вычисли: 320 · 3',
      answer: '960',
      correctText: '32 · 3 = 96, приписываем ноль: 960.',
      wrongText: 'Закрой ноль и умножь 32 на 3. Потом верни ноль к результату.',
    },
    en: {
      skill: 'Multiplying a round number',
      question: 'Work out: 320 · 3',
      answer: '960',
      correctText: '32 · 3 = 96, then put the zero back: 960.',
      wrongText: 'Cover the zero and multiply 32 by 3. Then put the zero back on the result.',
    },
  },
  {
    id: 'g3-fractions', grade: 3, domain: 'number', type: 'sequence',
    uz: {
      skill: "Kasrlarni taqqoslash",
      question: "Kasrlarni o'sish tartibida joylashtiring.",
      tokens: ['7/8', '3/8', '1/2'], expected: ['3/8', '1/2', '7/8'],
      correctText: "1/2 ni sakkizdan to'rt deb yozamiz. Shunda 3/8 < 4/8 < 7/8 bo'ladi.",
      wrongText: "Yarim ulushni sakkizinchi ulushlarda ifodalang: 1/2 = 4/8. So'ng suratlarni taqqoslang.",
    },
    ru: {
      skill: 'Сравнение дробей',
      question: 'Расположи дроби в порядке возрастания.',
      tokens: ['7/8', '3/8', '1/2'], expected: ['3/8', '1/2', '7/8'],
      correctText: 'Запишем 1/2 как 4/8. Тогда 3/8 < 4/8 < 7/8.',
      wrongText: 'Вырази половину в восьмых долях: 1/2 = 4/8. Потом сравни числители.',
    },
    en: {
      skill: 'Comparing fractions',
      question: 'Put the fractions in increasing order.',
      tokens: ['7/8', '3/8', '1/2'], expected: ['3/8', '1/2', '7/8'],
      correctText: 'Write 1/2 as 4/8. Then 3/8 < 4/8 < 7/8.',
      wrongText: 'Express the half in eighths: 1/2 = 4/8. Then compare the numerators.',
    },
  },
  {
    id: 'g3-build', grade: 3, domain: 'operations', type: 'equation',
    uz: {
      skill: "Yozma bo'lish",
      question: "Bo'lishga doir to'g'ri tenglikni tuzing.",
      tokens: ['623', '=', '1246', ':', '2'], expected: ['1246', ':', '2', '=', '623'],
      correctText: "1246 ni ikkiga bo'lamiz: 12 yuzlik ikkiga bo'linadi, keyin 4 o'nlik va 6 birlik. Natija 623.",
      wrongText: "Bo'linuvchi birinchi turadi, bo'linma esa teng belgisidan keyin. Katta sondan boshlang.",
    },
    ru: {
      skill: 'Письменное деление',
      question: 'Собери верное равенство на деление.',
      tokens: ['623', '=', '1246', ':', '2'], expected: ['1246', ':', '2', '=', '623'],
      correctText: 'Делим 1246 на 2: сначала 12 сотен, потом 4 десятка и 6 единиц. Получается 623.',
      wrongText: 'Делимое стоит первым, а частное после знака равно. Начни с большего числа.',
    },
    en: {
      skill: 'Written division',
      question: 'Build a correct division equality.',
      tokens: ['623', '=', '1246', ':', '2'], expected: ['1246', ':', '2', '=', '623'],
      correctText: 'Divide 1246 by 2: first the 12 hundreds, then the 4 tens and 6 ones. The result is 623.',
      wrongText: 'The dividend comes first and the quotient after the equals sign. Start with the larger number.',
    },
  },
  {
    id: 'g3-area', grade: 3, domain: 'measurement', type: 'match',
    uz: {
      skill: "Yuza va perimetr",
      question: "Har bir o'lchovni natijasi bilan bog'lang.",
      pairs: [
        { id: 'a', left: "tomonlari 7 va 4 bo'lgan to'g'ri to'rtburchak yuzasi", right: '28' },
        { id: 'b', left: "tomonlari 7 va 4 bo'lgan to'g'ri to'rtburchak perimetri", right: '22' },
        { id: 'c', left: "tomoni 5 bo'lgan kvadrat yuzasi", right: '25' },
      ],
      answers: ['25', '28', '22'],
      correctText: "Yuza tomonlar ko'paytmasi: 7 · 4 = 28. Perimetr barcha tomonlar yig'indisi: (7 + 4) · 2 = 22. Kvadrat yuzasi 5 · 5 = 25.",
      wrongText: "Yuzani topish uchun tomonlar ko'paytiriladi, perimetr uchun esa qo'shiladi. Ikkalasini aralashtirmang.",
    },
    ru: {
      skill: 'Площадь и периметр',
      question: 'Соедини каждую величину с её значением.',
      pairs: [
        { id: 'a', left: 'площадь прямоугольника со сторонами 7 и 4', right: '28' },
        { id: 'b', left: 'периметр прямоугольника со сторонами 7 и 4', right: '22' },
        { id: 'c', left: 'площадь квадрата со стороной 5', right: '25' },
      ],
      answers: ['25', '28', '22'],
      correctText: 'Площадь — произведение сторон: 7 · 4 = 28. Периметр — сумма всех сторон: (7 + 4) · 2 = 22. Площадь квадрата 5 · 5 = 25.',
      wrongText: 'Для площади стороны умножают, для периметра складывают. Не путай эти две величины.',
    },
    en: {
      skill: 'Area and perimeter',
      question: 'Match each quantity with its value.',
      pairs: [
        { id: 'a', left: 'area of a rectangle with sides 7 and 4', right: '28' },
        { id: 'b', left: 'perimeter of a rectangle with sides 7 and 4', right: '22' },
        { id: 'c', left: 'area of a square with side 5', right: '25' },
      ],
      answers: ['25', '28', '22'],
      correctText: 'Area is the product of the sides: 7 · 4 = 28. Perimeter is the sum of all sides: (7 + 4) · 2 = 22. The square has area 5 · 5 = 25.',
      wrongText: 'For area the sides are multiplied, for perimeter they are added. Do not mix the two.',
    },
  },
  {
    id: 'g4-build', grade: 4, domain: 'operations', type: 'equation',
    uz: {
      skill: "Ko'p xonali sonni bo'lish",
      question: "Ko'p xonali sonlar bilan to'g'ri tenglikni tuzing.",
      tokens: ['9768', '=', '39072', ':', '4'], expected: ['39072', ':', '4', '=', '9768'],
      correctText: "39072 ni 4 ga bo'lamiz: 39 mingdan boshlab har bir xonani ketma-ket bo'lamiz va 9768 hosil bo'ladi.",
      wrongText: "Bo'linuvchi birinchi, bo'luvchi ikkinchi, natija esa teng belgisidan keyin turadi.",
    },
    ru: {
      skill: 'Деление многозначного числа',
      question: 'Собери верное равенство с многозначными числами.',
      tokens: ['9768', '=', '39072', ':', '4'], expected: ['39072', ':', '4', '=', '9768'],
      correctText: 'Делим 39072 на 4: идём по разрядам, начиная с 39 тысяч, и получаем 9768.',
      wrongText: 'Делимое стоит первым, делитель вторым, а результат после знака равно.',
    },
    en: {
      skill: 'Dividing a multi-digit number',
      question: 'Build a correct equality with multi-digit numbers.',
      tokens: ['9768', '=', '39072', ':', '4'], expected: ['39072', ':', '4', '=', '9768'],
      correctText: 'Divide 39072 by 4 place by place, starting with the 39 thousands, and you get 9768.',
      wrongText: 'The dividend comes first, the divisor second, and the result after the equals sign.',
    },
  },
  {
    id: 'g4-motion', grade: 4, domain: 'reasoning', type: 'number',
    uz: {
      skill: "Harakatga doir masala",
      question: "Mototsikl soatiga 54 km tezlik bilan 3 soat yurdi. Butun yo'l 200 km bo'lsa, yana necha kilometr qoldi?",
      answer: '38',
      correctText: "Bosib o'tilgan yo'l 54 · 3 = 162 km. Qolgani 200 − 162 = 38 km.",
      wrongText: "Avval bosib o'tilgan masofani toping: tezlikni vaqtga ko'paytiring. So'ng uni butun yo'ldan ayiring.",
    },
    ru: {
      skill: 'Задача на движение',
      question: 'Мотоциклист ехал 3 часа со скоростью 54 км/ч. Весь путь 200 км. Сколько километров осталось проехать?',
      answer: '38',
      correctText: 'Пройденный путь 54 · 3 = 162 км. Осталось 200 − 162 = 38 км.',
      wrongText: 'Сначала найди пройденное расстояние: умножь скорость на время. Затем вычти его из всего пути.',
    },
    en: {
      skill: 'Distance and speed problem',
      question: 'A motorcyclist rode for 3 hours at 54 km/h. The whole route is 200 km. How many kilometres are left?',
      answer: '38',
      correctText: 'The distance covered is 54 · 3 = 162 km. What is left is 200 − 162 = 38 km.',
      wrongText: 'First find the distance covered by multiplying speed by time. Then subtract it from the whole route.',
    },
  },
  {
    id: 'g4-average', grade: 4, domain: 'reasoning', type: 'number',
    uz: {
      skill: "O'rtacha arifmetik qiymat",
      question: "Ikkita sonning o'rtacha arifmetik qiymati 20 ga teng. Ulardan biri 14. Ikkinchisini toping.",
      answer: '26',
      correctText: "Ikki sonning yig'indisi 20 · 2 = 40. Ikkinchisi 40 − 14 = 26.",
      wrongText: "O'rtacha qiymatni ikkiga ko'paytirib, yig'indini tiklang. So'ng ma'lum sonni ayiring.",
    },
    ru: {
      skill: 'Среднее арифметическое',
      question: 'Среднее арифметическое двух чисел равно 20. Одно из них 14. Найди второе.',
      answer: '26',
      correctText: 'Сумма двух чисел равна 20 · 2 = 40. Второе число 40 − 14 = 26.',
      wrongText: 'Умножь среднее на два и восстанови сумму. Затем вычти известное число.',
    },
    en: {
      skill: 'Arithmetic mean',
      question: 'The mean of two numbers is 20. One of them is 14. Find the other one.',
      answer: '26',
      correctText: 'The sum of the two numbers is 20 · 2 = 40. The other one is 40 − 14 = 26.',
      wrongText: 'Multiply the mean by two to rebuild the sum. Then subtract the number you know.',
    },
  },
  {
    id: 'g4-units', grade: 4, domain: 'measurement', type: 'match',
    uz: {
      skill: "Uzunlik birliklarini almashtirish",
      question: "Har bir uzunlikni santimetrlar soni bilan bog'lang.",
      pairs: [{ id: 'a', left: '9 m 82 sm', right: '982' }, { id: 'b', left: '4 m 5 sm', right: '405' }, { id: 'c', left: '12 m', right: '1200' }],
      answers: ['405', '1200', '982'],
      correctText: "Bir metrda 100 sm bor: 9 m 82 sm = 900 + 82 = 982 sm, 4 m 5 sm = 400 + 5 = 405 sm, 12 m = 1200 sm.",
      wrongText: "Metrlarni yuzga ko'paytiring va qolgan santimetrlarni qo'shing. To'rt metr besh santimetr bu 450 emas.",
    },
    ru: {
      skill: 'Перевод единиц длины',
      question: 'Соедини каждую длину с числом сантиметров.',
      pairs: [{ id: 'a', left: '9 м 82 см', right: '982' }, { id: 'b', left: '4 м 5 см', right: '405' }, { id: 'c', left: '12 м', right: '1200' }],
      answers: ['405', '1200', '982'],
      correctText: 'В одном метре 100 см: 9 м 82 см = 900 + 82 = 982 см, 4 м 5 см = 400 + 5 = 405 см, 12 м = 1200 см.',
      wrongText: 'Умножь метры на сто и прибавь оставшиеся сантиметры. Четыре метра пять сантиметров — это не 450.',
    },
    en: {
      skill: 'Converting units of length',
      question: 'Match each length with its number of centimetres.',
      pairs: [{ id: 'a', left: '9 m 82 cm', right: '982' }, { id: 'b', left: '4 m 5 cm', right: '405' }, { id: 'c', left: '12 m', right: '1200' }],
      answers: ['405', '1200', '982'],
      correctText: 'One metre is 100 cm: 9 m 82 cm = 900 + 82 = 982 cm, 4 m 5 cm = 400 + 5 = 405 cm, 12 m = 1200 cm.',
      wrongText: 'Multiply the metres by a hundred and add the remaining centimetres. Four metres five centimetres is not 450.',
    },
  },
  {
    id: 'g4-decimal', grade: 4, domain: 'number', type: 'sequence',
    uz: {
      skill: "O'nli kasrlarni taqqoslash",
      question: "O'nli kasrlarni o'sish tartibida joylashtiring.",
      tokens: ['2,5', '2,05', '2,45'], expected: ['2,05', '2,45', '2,5'],
      correctText: "Butun qismlari teng. O'ndan xonasiga qaraymiz: 0 < 4 < 5. Demak 2,05 < 2,45 < 2,5.",
      wrongText: "Vergul ortidagi raqamlar sonini emas, xonalarni taqqoslang. 2,5 ni 2,50 deb yozib ko'ring.",
    },
    ru: {
      skill: 'Сравнение десятичных дробей',
      question: 'Расположи десятичные дроби в порядке возрастания.',
      tokens: ['2,5', '2,05', '2,45'], expected: ['2,05', '2,45', '2,5'],
      correctText: 'Целые части равны. Смотрим на десятые: 0 < 4 < 5. Значит 2,05 < 2,45 < 2,5.',
      wrongText: 'Сравнивай не количество цифр после запятой, а разряды. Запиши 2,5 как 2,50.',
    },
    en: {
      skill: 'Comparing decimals',
      question: 'Put the decimals in increasing order.',
      tokens: ['2.5', '2.05', '2.45'], expected: ['2.05', '2.45', '2.5'],
      correctText: 'The whole parts are equal. Look at the tenths: 0 < 4 < 5. So 2.05 < 2.45 < 2.5.',
      wrongText: 'Compare place values, not how many digits follow the point. Write 2.5 as 2.50.',
    },
  },
];

const mathTestItems58 = [
  {
    id: 'g5-fracmult', grade: 5, domain: 'number', type: 'choice',
    uz: {
      skill: "Kasrlarni ko'paytirish",
      question: "Hisoblang va qisqartiring: 2/3 · 3/5",
      options: ['2/5', '6/15', '5/8', '10/9'], answer: '2/5',
      correctText: "Surat suratga, maxraj maxrajga: 6/15. Uchga qisqartirsak 2/5 bo'ladi.",
      wrong: [
        "Bu to'g'ri javob.",
        "Ko'paytma to'g'ri topilgan, ammo kasr qisqartirilmagan. Surat va maxrajni uchga bo'ling.",
        "Bu yerda suratlar ham, maxrajlar ham qo'shilgan. Ko'paytirishda ular ko'paytiriladi.",
        "Bu yerda ikkinchi kasr teskari olingan. Teskari qilish bo'lishda bo'ladi, ko'paytirishda emas.",
      ],
    },
    ru: {
      skill: 'Умножение дробей',
      question: 'Вычисли и сократи: 2/3 · 3/5',
      options: ['2/5', '6/15', '5/8', '10/9'], answer: '2/5',
      correctText: 'Числитель на числитель, знаменатель на знаменатель: 6/15. После сокращения на три получаем 2/5.',
      wrong: [
        'Это правильный ответ.',
        'Произведение найдено верно, но дробь не сокращена. Раздели числитель и знаменатель на три.',
        'Здесь сложены и числители, и знаменатели. При умножении их перемножают.',
        'Здесь вторая дробь перевёрнута. Переворачивают при делении, а не при умножении.',
      ],
    },
    en: {
      skill: 'Multiplying fractions',
      question: 'Work out and simplify: 2/3 · 3/5',
      options: ['2/5', '6/15', '5/8', '10/9'], answer: '2/5',
      correctText: 'Numerator times numerator, denominator times denominator: 6/15. Cancelling by three gives 2/5.',
      wrong: [
        'This is the correct answer.',
        'The product is right but the fraction was not simplified. Divide numerator and denominator by three.',
        'Here both numerators and denominators were added. In multiplication they are multiplied.',
        'Here the second fraction was flipped. Flipping belongs to division, not multiplication.',
      ],
    },
  },
  {
    id: 'g5-decimal', grade: 5, domain: 'number', type: 'text',
    uz: {
      skill: "O'nli kasrlarni ko'paytirish",
      question: "Hisoblang: 2,4 · 1,5", answer: '3,6',
      correctText: "Vergulsiz ko'paytiramiz: 24 · 15 = 360. Ikkala songa jami ikkita raqam vergul ortida, demak 3,60 = 3,6.",
      wrongText: "Avval vergullarni e'tiborsiz qoldirib ko'paytiring. So'ng ikkala ko'paytuvchidagi vergul ortidagi raqamlarni sanang.",
    },
    ru: {
      skill: 'Умножение десятичных дробей',
      question: 'Вычисли: 2,4 · 1,5', answer: '3,6',
      correctText: 'Умножаем без запятых: 24 · 15 = 360. После запятой в двух числах всего две цифры, значит 3,60 = 3,6.',
      wrongText: 'Сначала умножь, не глядя на запятые. Потом сосчитай, сколько цифр после запятой у обоих множителей.',
    },
    en: {
      skill: 'Multiplying decimals',
      question: 'Work out: 2.4 · 1.5', answer: '3.6',
      correctText: 'Multiply without the points: 24 · 15 = 360. The two factors have two decimal digits in total, so 3.60 = 3.6.',
      wrongText: 'First multiply ignoring the decimal points. Then count how many decimal digits the two factors have together.',
    },
  },
  {
    id: 'g5-percent', grade: 5, domain: 'number', type: 'text',
    uz: {
      skill: 'Foizlar', question: "250 ning 10% ini toping.", answer: '25',
      correctText: "10% — bu sonning o'ndan bir qismi: 250 : 10 = 25.",
      wrongText: "O'n foiz sonning o'ndan bir qismiga teng. Sonni o'nga bo'ling.",
    },
    ru: {
      skill: 'Проценты', question: 'Найди 10% от 250.', answer: '25',
      correctText: '10% — это десятая часть числа: 250 : 10 = 25.',
      wrongText: 'Десять процентов — это десятая часть числа. Раздели число на десять.',
    },
    en: {
      skill: 'Percentages', question: 'Find 10% of 250.', answer: '25',
      correctText: '10% is a tenth of the number: 250 : 10 = 25.',
      wrongText: 'Ten percent is a tenth of the number. Divide the number by ten.',
    },
  },
  {
    id: 'g5-area', grade: 5, domain: 'geometry', type: 'choice',
    uz: {
      skill: 'Uchburchak yuzasi',
      question: "Uchburchakning yuzasi 24 sm², asosi 8 sm. Shu asosga tushirilgan balandlikni toping.",
      options: ['6 sm', '3 sm', '48 sm', '4 sm'], answer: '6 sm',
      correctText: "Yuza formulasidan: balandlik = 2 · 24 : 8 = 6 sm.",
      wrong: [
        "Bu to'g'ri javob.",
        "Bu yerda yuza to'g'ridan to'g'ri asosga bo'lingan. Formulada ikkiga bo'lish bor, shuning uchun avval yuzani ikkilantirish kerak.",
        "48 — bu ikkilangan yuza. Uni yana asosga bo'lish qolgan.",
        "Hisobni yana tekshiring: balandlikni topish uchun 2 · 24 ni 8 ga bo'lish kerak.",
      ],
    },
    ru: {
      skill: 'Площадь треугольника',
      question: 'Площадь треугольника 24 см², основание 8 см. Найди высоту, проведённую к этому основанию.',
      options: ['6 см', '3 см', '48 см', '4 см'], answer: '6 см',
      correctText: 'Из формулы площади: высота = 2 · 24 : 8 = 6 см.',
      wrong: [
        'Это правильный ответ.',
        'Здесь площадь просто разделена на основание. В формуле есть деление на два, поэтому площадь сначала удваивают.',
        '48 — это удвоенная площадь. Её осталось разделить на основание.',
        'Проверь вычисление по формуле: высота равна 2 · 24 : 8.',
      ],
    },
    en: {
      skill: 'Area of a triangle',
      question: 'The area of a triangle is 24 cm² and its base is 8 cm. Find the height drawn to that base.',
      options: ['6 cm', '3 cm', '48 cm', '4 cm'], answer: '6 cm',
      correctText: 'From the area formula: height = 2 · 24 : 8 = 6 cm.',
      wrong: [
        'This is the correct answer.',
        'Here the area was simply divided by the base. The formula has a division by two, so the area is doubled first.',
        '48 is the doubled area. It still has to be divided by the base.',
        'Check the calculation from the formula: the height is 2 · 24 : 8.',
      ],
    },
  },
  {
    id: 'g5-volume', grade: 5, domain: 'geometry', type: 'text',
    uz: {
      skill: "Parallelepiped hajmi",
      question: "To'g'ri burchakli parallelepipedning hajmi 120 sm³, asos tomonlari 6 sm va 4 sm. Balandligini toping.",
      answer: '5',
      correctText: "Asos yuzasi 6 · 4 = 24 sm². Balandlik 120 : 24 = 5 sm.",
      wrongText: "Hajm asos yuzasi va balandlik ko'paytmasi. Avval asos yuzasini toping, keyin hajmni unga bo'ling.",
    },
    ru: {
      skill: 'Объём параллелепипеда',
      question: 'Объём прямоугольного параллелепипеда 120 см³, стороны основания 6 см и 4 см. Найди высоту.',
      answer: '5',
      correctText: 'Площадь основания 6 · 4 = 24 см². Высота равна 120 : 24 = 5 см.',
      wrongText: 'Объём — это произведение площади основания и высоты. Сначала найди площадь основания, потом раздели объём на неё.',
    },
    en: {
      skill: 'Volume of a cuboid',
      question: 'A cuboid has volume 120 cm³ and base sides 6 cm and 4 cm. Find its height.',
      answer: '5',
      correctText: 'The base area is 6 · 4 = 24 cm². The height is 120 : 24 = 5 cm.',
      wrongText: 'Volume is base area times height. Find the base area first, then divide the volume by it.',
    },
  },
  {
    id: 'g6-equation', grade: 6, domain: 'algebra', type: 'choice',
    uz: {
      skill: "Noma'lum ikkala tomonda",
      question: "Tenglamani yeching: 7x − 4 = 5x + 8",
      options: ['6', '2', '12', '−6'], answer: '6',
      correctText: "Noma'lumlarni chapga, sonlarni o'ngga yig'amiz: 7x − 5x = 8 + 4, ya'ni 2x = 12, x = 6.",
      wrong: [
        "Bu to'g'ri javob.",
        "2 soni 12 ni oltiga bo'lishdan chiqqan. Chap tomonda 2x qoladi, shuning uchun 12 ni ikkiga bo'lish kerak.",
        "12 — bu 2x ning qiymati, iksning o'zi emas. Uni yana ikkiga bo'ling.",
        "Ishoralar almashib ketgan: o'tkazishda minus to'rt o'ng tomonda plyus to'rtga aylanadi.",
      ],
    },
    ru: {
      skill: 'Неизвестное в обеих частях',
      question: 'Реши уравнение: 7x − 4 = 5x + 8',
      options: ['6', '2', '12', '−6'], answer: '6',
      correctText: 'Собираем неизвестные слева, числа справа: 7x − 5x = 8 + 4, то есть 2x = 12, x = 6.',
      wrong: [
        'Это правильный ответ.',
        '2 получается, если разделить 12 на шесть. Слева остаётся 2x, поэтому 12 нужно делить на два.',
        '12 — это значение 2x, а не самого x. Его остаётся разделить на два.',
        'Перепутаны знаки: при переносе минус четыре справа становится плюс четыре.',
      ],
    },
    en: {
      skill: 'Unknown on both sides',
      question: 'Solve the equation: 7x − 4 = 5x + 8',
      options: ['6', '2', '12', '−6'], answer: '6',
      correctText: 'Collect the unknowns on the left and numbers on the right: 7x − 5x = 8 + 4, so 2x = 12 and x = 6.',
      wrong: [
        'This is the correct answer.',
        '2 comes from dividing 12 by six. The left side leaves 2x, so 12 must be divided by two.',
        '12 is the value of 2x, not of x itself. It still has to be halved.',
        'The signs are mixed up: moving minus four across makes it plus four on the right.',
      ],
    },
  },
  {
    id: 'g6-fracdiv', grade: 6, domain: 'number', type: 'choice',
    uz: {
      skill: "Kasrlarni bo'lish",
      question: "Hisoblang: 3/4 : 2/3",
      options: ['9/8', '6/12', '8/9', '9/12'], answer: '9/8',
      correctText: "Bo'lishni ko'paytirishga almashtiramiz: 3/4 · 3/2 = 9/8.",
      wrong: [
        "Bu to'g'ri javob.",
        "Bu yerda kasrlar shunchaki ko'paytirilgan. Bo'lishda ikkinchi kasr teskari olinadi.",
        "Teskari qilib olingan kasr xato tanlangan: birinchisi emas, ikkinchisi ag'dariladi.",
        "9/12 = 3/4 — bu birinchi kasrning o'zi, bo'lish bajarilmagan.",
      ],
    },
    ru: {
      skill: 'Деление дробей',
      question: 'Вычисли: 3/4 : 2/3',
      options: ['9/8', '6/12', '8/9', '9/12'], answer: '9/8',
      correctText: 'Заменяем деление умножением: 3/4 · 3/2 = 9/8.',
      wrong: [
        'Это правильный ответ.',
        'Здесь дроби просто перемножены. При делении вторую дробь переворачивают.',
        'Перевёрнута не та дробь: переворачивают вторую, а не первую.',
        '9/12 = 3/4 — это сама первая дробь, деление не выполнено.',
      ],
    },
    en: {
      skill: 'Dividing fractions',
      question: 'Work out: 3/4 : 2/3',
      options: ['9/8', '6/12', '8/9', '9/12'], answer: '9/8',
      correctText: 'Division becomes multiplication: 3/4 · 3/2 = 9/8.',
      wrong: [
        'This is the correct answer.',
        'Here the fractions were simply multiplied. In division the second fraction is turned over.',
        'The wrong fraction was turned over: it is the second one, not the first.',
        '9/12 = 3/4 — this is the first fraction itself, the division was not carried out.',
      ],
    },
  },
  {
    id: 'g6-brackets', grade: 6, domain: 'algebra', type: 'choice',
    uz: {
      skill: 'Qavslarni ochish',
      question: "Ifodani soddalashtiring: 5a − (2a − 7)",
      options: ['3a + 7', '3a − 7', '7a − 7', '7a + 7'], answer: '3a + 7',
      correctText: "Qavs oldida minus turgani uchun ikkala hadning ishorasi almashadi: 5a − 2a + 7 = 3a + 7.",
      wrong: [
        "Bu to'g'ri javob.",
        "Yetti oldidagi ishora almashmagan. Minusli qavs ochilganda ichidagi barcha hadlar ishorasi o'zgaradi.",
        "Qavs oldidagi minus umuman hisobga olinmagan: na 2a, na 7 ishorasi almashmagan. Ikkala hadning ishorasi o'zgarishi kerak.",
        "Faqat yettining ishorasi almashgan, 2a niki esa yo'q: u qo'shilgan, holbuki uni ayirish kerak edi.",
      ],
    },
    ru: {
      skill: 'Раскрытие скобок',
      question: 'Упрости выражение: 5a − (2a − 7)',
      options: ['3a + 7', '3a − 7', '7a − 7', '7a + 7'], answer: '3a + 7',
      correctText: 'Перед скобкой стоит минус, поэтому знаки обоих слагаемых меняются: 5a − 2a + 7 = 3a + 7.',
      wrong: [
        'Это правильный ответ.',
        'У семёрки не изменён знак. При раскрытии скобки с минусом меняются знаки всех слагаемых внутри.',
        'Минус перед скобкой проигнорирован: не изменены знаки ни у 2a, ни у 7. Менять нужно знаки обоих слагаемых.',
        'Знак сменили только у семёрки, а у 2a — нет: его прибавили, хотя нужно было вычесть.',
      ],
    },
    en: {
      skill: 'Removing brackets',
      question: 'Simplify the expression: 5a − (2a − 7)',
      options: ['3a + 7', '3a − 7', '7a − 7', '7a + 7'], answer: '3a + 7',
      correctText: 'There is a minus in front of the bracket, so both signs inside change: 5a − 2a + 7 = 3a + 7.',
      wrong: [
        'This is the correct answer.',
        'The sign of the seven was not changed. A minus in front of a bracket flips every sign inside it.',
        'The minus in front of the bracket was ignored: neither 2a nor 7 changed sign. Both signs must flip.',
        'Only the seven changed sign, 2a did not: it was added although it had to be subtracted.',
      ],
    },
  },
  {
    id: 'g6-percentchange', grade: 6, domain: 'number', type: 'choice',
    uz: {
      skill: "Foiz o'zgarishi: eski narxni topish",
      question: "Mahsulot narxi 15% ga oshgach, 46 000 so'm bo'ldi. Ilgari u qancha turgan?",
      options: ["40 000 so'm", "39 100 so'm", "52 900 so'm", "31 000 so'm"], answer: "40 000 so'm",
      correctText: "Yangi narx eski narxning 115% i: 46 000 : 115 · 100 = 40 000 so'm.",
      wrong: [
        "Bu to'g'ri javob.",
        "Bu yerda foiz yangi narxdan olingan. Foiz doim eski narxdan hisoblanadi.",
        "Bu yerda narx yana oshirilgan. Bizga eski, ya'ni kichikroq narx kerak.",
        "Bu yerda foiz so'm bilan almashtirilgan: 15 000 ayirilgan. Foiz — bu sonning yuzdan bir qismi.",
      ],
    },
    ru: {
      skill: 'Восстановление цены до роста',
      question: 'После подорожания на 15% товар стал стоить 46 000 сумов. Сколько он стоил раньше?',
      options: ['40 000 сумов', '39 100 сумов', '52 900 сумов', '31 000 сумов'], answer: '40 000 сумов',
      correctText: 'Новая цена — это 115% старой: 46 000 : 115 · 100 = 40 000 сумов.',
      wrong: [
        'Это правильный ответ.',
        'Здесь процент взят от новой цены. Процент всегда считается от старой.',
        'Здесь цену подняли ещё раз. Нужна старая цена, то есть меньшая.',
        'Здесь проценты заменены суммой: вычтено 15 000. Процент — это сотая часть числа.',
      ],
    },
    en: {
      skill: 'Recovering the price before an increase',
      question: 'After a 15% rise an item costs 46 000. What did it cost before?',
      options: ['40 000', '39 100', '52 900', '31 000'], answer: '40 000',
      correctText: 'The new price is 115% of the old one: 46 000 : 115 · 100 = 40 000.',
      wrong: [
        'This is the correct answer.',
        'Here the percentage was taken from the new price. A percentage is always taken from the old one.',
        'Here the price was raised again. The old price is the smaller one.',
        'Here the percentage was replaced by an amount: 15 000 was subtracted. A percent is one hundredth of the number.',
      ],
    },
  },
  {
    id: 'g6-circle', grade: 6, domain: 'geometry', type: 'text',
    uz: {
      skill: 'Aylana uzunligi',
      question: "Aylananing radiusi 4 sm. Aylana uzunligini toping. Javobga π oldidagi sonni yozing.",
      answer: '8',
      correctText: "Aylana uzunligi 2πr formulasi bilan topiladi: 2 · 4 = 8, demak 8π.",
      wrongText: "Aylana uzunligi ikki pi radiusga teng. Radiusni ikkiga ko'paytiring.",
    },
    ru: {
      skill: 'Длина окружности',
      question: 'Радиус окружности 4 см. Найди длину окружности. В ответе запиши число, стоящее перед π.',
      answer: '8',
      correctText: 'Длина окружности находится по формуле 2πr: 2 · 4 = 8, то есть 8π.',
      wrongText: 'Длина окружности равна двум пи радиусам. Умножь радиус на два.',
    },
    en: {
      skill: 'Circumference',
      question: 'A circle has radius 4 cm. Find its circumference. Write the number that stands in front of π.',
      answer: '8',
      correctText: 'The circumference is 2πr: 2 · 4 = 8, that is 8π.',
      wrongText: 'The circumference equals two pi times the radius. Multiply the radius by two.',
    },
  },
  {
    id: 'g7-power', grade: 7, domain: 'algebra', type: 'choice',
    uz: {
      skill: 'Daraja xossalari',
      question: "Soddalashtiring: a⁵ · a³",
      options: ['a⁸', 'a¹⁵', 'a²', 'a¹⁶'], answer: 'a⁸',
      correctText: "Bir xil asosli darajalar ko'paytirilganda ko'rsatkichlar qo'shiladi: 5 + 3 = 8.",
      wrong: [
        "Bu to'g'ri javob.",
        "Bu yerda ko'rsatkichlar ko'paytirilgan. Ular ko'paytmada qo'shiladi, ko'paytirilmaydi.",
        "Bu yerda ko'rsatkichlar ayirilgan. Ayirish bo'lishda bo'ladi, ko'paytirishda emas.",
        "Ko'rsatkich ikki baravar katta chiqqan. Bu yerda faqat 5 + 3 = 8 ni hisoblash kerak.",
      ],
    },
    ru: {
      skill: 'Свойства степени',
      question: 'Упрости: a⁵ · a³',
      options: ['a⁸', 'a¹⁵', 'a²', 'a¹⁶'], answer: 'a⁸',
      correctText: 'При умножении степеней с одинаковым основанием показатели складываются: 5 + 3 = 8.',
      wrong: [
        'Это правильный ответ.',
        'Здесь показатели перемножены. При умножении степеней они складываются, а не умножаются.',
        'Здесь показатели вычтены. Вычитание бывает при делении, а не при умножении.',
        'Показатель получился вдвое больше нужного. Здесь нужно сложить только 5 + 3 = 8.',
      ],
    },
    en: {
      skill: 'Laws of exponents',
      question: 'Simplify: a⁵ · a³',
      options: ['a⁸', 'a¹⁵', 'a²', 'a¹⁶'], answer: 'a⁸',
      correctText: 'When powers with the same base are multiplied the exponents are added: 5 + 3 = 8.',
      wrong: [
        'This is the correct answer.',
        'Here the exponents were multiplied. In a product they are added, not multiplied.',
        'Here the exponents were subtracted. Subtraction happens in division, not multiplication.',
        'The exponent is twice as large as it should be. Add only 5 + 3 = 8.',
      ],
    },
  },
  {
    id: 'g7-linear', grade: 7, domain: 'algebra', type: 'text',
    uz: {
      skill: "Kasrli chiziqli tenglama",
      question: "Tenglamani yeching: x/3 + x/6 = 5", answer: '10',
      correctText: "Ikkala tomonni umumiy maxraj 6 ga ko'paytiramiz: 2x + x = 30, ya'ni 3x = 30, x = 10.",
      wrongText: "Kasrlardan qutuling: tenglamaning ikkala tomonini umumiy maxrajga ko'paytiring.",
    },
    ru: {
      skill: 'Линейное уравнение с дробями',
      question: 'Реши уравнение: x/3 + x/6 = 5', answer: '10',
      correctText: 'Умножаем обе части на общий знаменатель 6: 2x + x = 30, то есть 3x = 30, x = 10.',
      wrongText: 'Избавься от дробей: умножь обе части уравнения на общий знаменатель.',
    },
    en: {
      skill: 'Linear equation with fractions',
      question: 'Solve the equation: x/3 + x/6 = 5', answer: '10',
      correctText: 'Multiply both sides by the common denominator 6: 2x + x = 30, so 3x = 30 and x = 10.',
      wrongText: 'Clear the fractions: multiply both sides of the equation by the common denominator.',
    },
  },
  {
    id: 'g7-coordinate', grade: 7, domain: 'functions', type: 'choice',
    uz: {
      skill: 'Koordinata tekisligi',
      question: "A(−4; 2) nuqta o'ngga 6 birlik siljitildi. Hosil bo'lgan nuqta qaysi chorakda yotadi?",
      options: ['birinchi', 'ikkinchi', 'uchinchi', "to'rtinchi"], answer: 'birinchi',
      correctText: "O'ngga siljish abssissani oshiradi: −4 + 6 = 2. Nuqta (2; 2) bo'ladi, ikkala koordinata musbat — birinchi chorak.",
      wrong: [
        "Bu to'g'ri javob.",
        "Ikkinchi chorakda A nuqtaning o'zi yotadi. Siljishdan keyin abssissa musbat bo'ladi.",
        "Uchinchi chorakda ikkala koordinata manfiy. Ordinata bu yerda musbatligicha qoladi.",
        "To'rtinchi chorak pastga siljiganda chiqadi. Bu yerda siljish o'ngga, ordinata o'zgarmaydi.",
      ],
    },
    ru: {
      skill: 'Координатная плоскость',
      question: 'Точку A(−4; 2) сдвинули на 6 единиц вправо. В какой четверти лежит полученная точка?',
      options: ['первая', 'вторая', 'третья', 'четвёртая'], answer: 'первая',
      correctText: 'Сдвиг вправо увеличивает абсциссу: −4 + 6 = 2. Точка становится (2; 2), обе координаты положительны — первая четверть.',
      wrong: [
        'Это правильный ответ.',
        'Во второй четверти лежит сама точка A. После сдвига абсцисса становится положительной.',
        'В третьей четверти обе координаты отрицательны. Ордината здесь остаётся положительной.',
        'Четвёртая четверть получилась бы при сдвиге вниз. Здесь сдвиг вправо, ордината не меняется.',
      ],
    },
    en: {
      skill: 'Coordinate plane',
      question: 'The point A(−4; 2) is moved 6 units to the right. Which quadrant does the new point lie in?',
      options: ['first', 'second', 'third', 'fourth'], answer: 'first',
      correctText: 'Moving right increases the x-coordinate: −4 + 6 = 2. The point becomes (2; 2), both coordinates positive — the first quadrant.',
      wrong: [
        'This is the correct answer.',
        'The point A itself lies in the second quadrant. After the move the x-coordinate becomes positive.',
        'In the third quadrant both coordinates are negative. Here the y-coordinate stays positive.',
        'The fourth quadrant would come from moving down. Here the move is to the right and y does not change.',
      ],
    },
  },
  {
    id: 'g7-function', grade: 7, domain: 'functions', type: 'text',
    uz: {
      skill: 'Chiziqli funksiya',
      question: "y = 2x − 1 funksiya berilgan. x ning qanday qiymatida y = 9 bo'ladi?", answer: '5',
      correctText: "2x − 1 = 9 tenglamani yechamiz: 2x = 10, demak x = 5.",
      wrongText: "Bu yerda x emas, y berilgan. Formulani tenglamaga aylantiring va x ni toping.",
    },
    ru: {
      skill: 'Линейная функция',
      question: 'Дана функция y = 2x − 1. При каком значении x значение функции равно 9?', answer: '5',
      correctText: 'Решаем уравнение 2x − 1 = 9: получаем 2x = 10, значит x = 5.',
      wrongText: 'Здесь дан не x, а y. Преврати формулу в уравнение и найди x.',
    },
    en: {
      skill: 'Linear function',
      question: 'A function is given by y = 2x − 1. For which value of x does the function equal 9?', answer: '5',
      correctText: 'Solve the equation 2x − 1 = 9: this gives 2x = 10, so x = 5.',
      wrongText: 'Here you are given y, not x. Turn the formula into an equation and find x.',
    },
  },
  {
    id: 'g7-triangle', grade: 7, domain: 'geometry', type: 'text',
    uz: {
      skill: 'Uchburchak burchaklari',
      question: "Uchburchakning bir burchagi 40°, ikkinchisi undan ikki marta katta. Uchinchi burchakni toping. Javobga faqat sonni yozing.",
      answer: '60',
      correctText: "Ikkinchi burchak 40 · 2 = 80°. Uchinchisi 180 − 40 − 80 = 60°.",
      wrongText: "Avval ikkinchi burchakni toping, keyin ikkalasining yig'indisini 180 dan ayiring.",
    },
    ru: {
      skill: 'Углы треугольника',
      question: 'Один угол треугольника равен 40°, второй в два раза больше первого. Найди третий угол. В ответе запиши только число.',
      answer: '60',
      correctText: 'Второй угол равен 40 · 2 = 80°. Третий равен 180 − 40 − 80 = 60°.',
      wrongText: 'Сначала найди второй угол, а затем вычти сумму двух углов из 180.',
    },
    en: {
      skill: 'Angles of a triangle',
      question: 'One angle of a triangle is 40°, the second is twice the first. Find the third angle. Write only the number.',
      answer: '60',
      correctText: 'The second angle is 40 · 2 = 80°. The third is 180 − 40 − 80 = 60°.',
      wrongText: 'First find the second angle, then subtract the sum of the two angles from 180.',
    },
  },
  {
    id: 'g8-fraction', grade: 8, domain: 'algebra', type: 'choice',
    uz: {
      skill: 'Algebraik kasrni qisqartirish',
      question: "Kasrni qisqartiring: (x² − 9)/(x + 3)",
      options: ['x − 3', 'x + 3', 'x² − 3', '−3'], answer: 'x − 3',
      correctText: "Surat ayirmaning ko'paytmasi ko'rinishida: (x − 3)(x + 3). (x + 3) qisqaradi va x − 3 qoladi, bunda x ≠ −3.",
      wrong: [
        "Bu to'g'ri javob.",
        "(x + 3) qisqaradigan ko'paytuvchi, javob esa ikkinchi ko'paytuvchi bo'ladi.",
        "Bu yerda faqat sonlar qisqartirilgan. Qo'shiluvchilarni alohida qisqartirib bo'lmaydi, avval ko'paytuvchilarga ajratish kerak.",
        "Bu yerda x² bilan x qisqartirilgan. Qisqartirish faqat umumiy ko'paytuvchi bo'yicha bajariladi.",
      ],
    },
    ru: {
      skill: 'Сокращение алгебраической дроби',
      question: 'Сократи дробь: (x² − 9)/(x + 3)',
      options: ['x − 3', 'x + 3', 'x² − 3', '−3'], answer: 'x − 3',
      correctText: 'Числитель раскладывается как (x − 3)(x + 3). Множитель (x + 3) сокращается, остаётся x − 3 при x ≠ −3.',
      wrong: [
        'Это правильный ответ.',
        '(x + 3) — это тот множитель, который сокращается, а в ответе остаётся второй.',
        'Здесь сокращены только числа. Слагаемые по отдельности сокращать нельзя, сначала нужно разложить на множители.',
        'Здесь сокращены x² и x. Сокращать можно только общий множитель.',
      ],
    },
    en: {
      skill: 'Simplifying an algebraic fraction',
      question: 'Simplify the fraction: (x² − 9)/(x + 3)',
      options: ['x − 3', 'x + 3', 'x² − 3', '−3'], answer: 'x − 3',
      correctText: 'The numerator factorises as (x − 3)(x + 3). The factor (x + 3) cancels and x − 3 is left for x ≠ −3.',
      wrong: [
        'This is the correct answer.',
        '(x + 3) is the factor that cancels; the other factor is the answer.',
        'Only the numbers were cancelled here. Separate terms cannot be cancelled; the numerator has to be factorised first.',
        'Here x² was cancelled with x. Only a common factor can be cancelled.',
      ],
    },
  },
  {
    id: 'g8-quadratic', grade: 8, domain: 'algebra', type: 'text',
    uz: {
      skill: 'Kvadrat tenglama',
      question: "x² − 7x + 12 = 0 tenglamaning katta ildizini toping.", answer: '4',
      correctText: "Vyet teoremasi bo'yicha ildizlar yig'indisi 7, ko'paytmasi 12. Bu 3 va 4, kattasi 4.",
      wrongText: "Yig'indisi 7 ga, ko'paytmasi 12 ga teng ikkita son toping. Javobga ulardan kattasini yozing.",
    },
    ru: {
      skill: 'Квадратное уравнение',
      question: 'Найди больший корень уравнения x² − 7x + 12 = 0.', answer: '4',
      correctText: 'По теореме Виета сумма корней равна 7, произведение 12. Это 3 и 4, больший равен 4.',
      wrongText: 'Найди два числа, сумма которых равна 7, а произведение 12. В ответе запиши большее из них.',
    },
    en: {
      skill: 'Quadratic equation',
      question: 'Find the larger root of the equation x² − 7x + 12 = 0.', answer: '4',
      correctText: 'By Vieta the roots add up to 7 and multiply to 12. They are 3 and 4, so the larger one is 4.',
      wrongText: 'Find two numbers with sum 7 and product 12. Write the larger of them as your answer.',
    },
  },
  {
    id: 'g8-hyperbola', grade: 8, domain: 'functions', type: 'text',
    uz: {
      skill: 'Teskari proporsional bogʻlanish',
      question: "y = k/x funksiyaning grafigi (2; 6) nuqtadan o'tadi. x = 4 bo'lganda y ning qiymatini toping.",
      answer: '3',
      correctText: "Avval koeffitsiyentni topamiz: k = 2 · 6 = 12. So'ng y = 12 : 4 = 3.",
      wrongText: "Berilgan nuqtaning koordinatalarini formulaga qo'yib, avval k ni toping. Keyingina yangi x ni qo'ying.",
    },
    ru: {
      skill: 'Обратная пропорциональность',
      question: 'График функции y = k/x проходит через точку (2; 6). Найди значение y при x = 4.',
      answer: '3',
      correctText: 'Сначала находим коэффициент: k = 2 · 6 = 12. Затем y = 12 : 4 = 3.',
      wrongText: 'Подставь координаты данной точки в формулу и найди сначала k. Только потом подставляй новый x.',
    },
    en: {
      skill: 'Inverse proportion',
      question: 'The graph of y = k/x passes through the point (2; 6). Find the value of y when x = 4.',
      answer: '3',
      correctText: 'First find the coefficient: k = 2 · 6 = 12. Then y = 12 : 4 = 3.',
      wrongText: 'Substitute the coordinates of the given point into the formula and find k first. Only then substitute the new x.',
    },
  },
  {
    id: 'g8-pythagoras', grade: 8, domain: 'geometry', type: 'text',
    uz: {
      skill: 'Pifagor teoremasi: katetni topish',
      question: "To'g'ri burchakli uchburchakning gipotenuzasi 13 sm, bir kateti 5 sm. Ikkinchi katetni toping. Javobga faqat sonni yozing.",
      answer: '12',
      correctText: "169 − 25 = 144, undan kvadrat ildiz olsak 12 sm chiqadi.",
      wrongText: "Bu yerda gipotenuza ma'lum, demak kvadratlar qo'shilmaydi, ayiriladi. Gipotenuza kvadratidan katet kvadratini ayiring.",
    },
    ru: {
      skill: 'Теорема Пифагора: поиск катета',
      question: 'Гипотенуза прямоугольного треугольника 13 см, один катет 5 см. Найди второй катет. В ответе запиши только число.',
      answer: '12',
      correctText: '169 − 25 = 144, квадратный корень из 144 равен 12 см.',
      wrongText: 'Здесь известна гипотенуза, значит квадраты не складывают, а вычитают. Вычти квадрат катета из квадрата гипотенузы.',
    },
    en: {
      skill: 'Pythagorean theorem: finding a leg',
      question: 'The hypotenuse of a right triangle is 13 cm and one leg is 5 cm. Find the other leg. Write only the number.',
      answer: '12',
      correctText: '169 − 25 = 144, and the square root of 144 is 12 cm.',
      wrongText: 'Here the hypotenuse is known, so the squares are subtracted, not added. Subtract the square of the leg from the square of the hypotenuse.',
    },
  },
  {
    id: 'g8-inscribed', grade: 8, domain: 'geometry', type: 'choice',
    uz: {
      skill: 'Ichki chizilgan burchak',
      question: "Ichki chizilgan burchak 100° li yoyga tiralgan. Bu burchakni toping.",
      options: ['50°', '100°', '200°', '25°'], answer: '50°',
      correctText: "Ichki chizilgan burchak o'zi tiralgan yoyning yarmiga teng: 100 : 2 = 50°.",
      wrong: [
        "Bu to'g'ri javob.",
        "100° — bu yoyning o'zi, ya'ni markaziy burchak. Ichki chizilgan burchak undan ikki marta kichik.",
        "Bu yerda yoy ikkiga ko'paytirilgan. Ichki chizilgan burchak uchun yoy ikkiga bo'linadi.",
        "Bu yerda yoy to'rtga bo'lingan. Bo'luvchi ikki bo'lishi kerak.",
      ],
    },
    ru: {
      skill: 'Вписанный угол',
      question: 'Вписанный угол опирается на дугу в 100°. Найди этот угол.',
      options: ['50°', '100°', '200°', '25°'], answer: '50°',
      correctText: 'Вписанный угол равен половине дуги, на которую опирается: 100 : 2 = 50°.',
      wrong: [
        'Это правильный ответ.',
        '100° — это сама дуга, то есть центральный угол. Вписанный угол вдвое меньше.',
        'Здесь дуга умножена на два. Для вписанного угла дугу делят на два.',
        'Здесь дуга разделена на четыре. Делить нужно на два.',
      ],
    },
    en: {
      skill: 'Inscribed angle',
      question: 'An inscribed angle stands on an arc of 100°. Find this angle.',
      options: ['50°', '100°', '200°', '25°'], answer: '50°',
      correctText: 'An inscribed angle is half the arc it stands on: 100 : 2 = 50°.',
      wrong: [
        'This is the correct answer.',
        '100° is the arc itself, that is the central angle. The inscribed angle is half of it.',
        'Here the arc was multiplied by two. For an inscribed angle the arc is divided by two.',
        'Here the arc was divided by four. The divisor should be two.',
      ],
    },
  },
];

const mathTestItems911 = [
  {
    id: 'g9-parabola', grade: 9, domain: 'functions', type: 'choice',
    uz: {
      skill: 'Kvadrat funksiya', question: "y = x² − 6x + 5 parabolasining uchi koordinatalarini toping.",
      options: ['(3; −4)', '(−3; −4)', '(3; 4)', '(6; 5)'], answer: '(3; −4)',
      correctText: "Uch abssissasi x = −b/(2a) = 6/2 = 3. Uni funksiyaga qo'yamiz: 9 − 18 + 5 = −4.",
      wrong: [
        "Bu to'g'ri javob.",
        "Abssissa −b/(2a) formulasi bilan topiladi; bu yerda minus olti bo'lgani uchun x musbat chiqadi.",
        "Ordinatani topish uchun x = 3 ni funksiyaga qo'yish kerak: natija manfiy.",
        "6 va 5 — tenglama koeffitsiyentlari, uch koordinatalari emas.",
      ],
    },
    ru: {
      skill: 'Квадратичная функция', question: 'Найди координаты вершины параболы y = x² − 6x + 5.',
      options: ['(3; −4)', '(−3; −4)', '(3; 4)', '(6; 5)'], answer: '(3; −4)',
      correctText: 'Абсцисса вершины x = −b/(2a) = 6/2 = 3. Подставляем в функцию: 9 − 18 + 5 = −4.',
      wrong: [
        'Это правильный ответ.',
        'Абсцисса ищется по формуле −b/(2a); здесь b равно минус шести, поэтому x положительный.',
        'Чтобы найти ординату, нужно подставить x = 3 в функцию — получится отрицательное число.',
        '6 и 5 — коэффициенты уравнения, а не координаты вершины.',
      ],
    },
    en: {
      skill: 'Quadratic function', question: 'Find the coordinates of the vertex of the parabola y = x² − 6x + 5.',
      options: ['(3; −4)', '(−3; −4)', '(3; 4)', '(6; 5)'], answer: '(3; −4)',
      correctText: 'The x of the vertex is −b/(2a) = 6/2 = 3. Substituting into the function: 9 − 18 + 5 = −4.',
      wrong: [
        'This is the correct answer.',
        'The x is found by −b/(2a); here b is minus six, so x comes out positive.',
        'To find the y you substitute x = 3 into the function, and the result is negative.',
        '6 and 5 are coefficients of the equation, not the coordinates of the vertex.',
      ],
    },
  },
  {
    id: 'g9-quadineq', grade: 9, domain: 'algebra', type: 'choice',
    uz: {
      skill: 'Kvadrat tengsizlik', question: "x² − 5x + 6 > 0 tengsizlikni yeching.",
      options: ['x < 2 yoki x > 3', '2 < x < 3', 'x < 3', 'x > 2'], answer: 'x < 2 yoki x > 3',
      correctText: "Ildizlar 2 va 3. Tarmoqlar yuqoriga qaragani uchun ifoda ildizlardan tashqarida musbat.",
      wrong: [
        "Bu to'g'ri javob.",
        "Ildizlar orasida parabola nol chizig'idan pastda: u yerda ifoda manfiy.",
        "Bitta chegara yetarli emas: ikkita ildiz sonlar o'qini uchta oraliqqa bo'ladi.",
        "Ikkinchi ildizni hisobga olmadingiz; ikki va uch orasida ifoda musbat emas.",
      ],
    },
    ru: {
      skill: 'Квадратное неравенство', question: 'Реши неравенство x² − 5x + 6 > 0.',
      options: ['x < 2 или x > 3', '2 < x < 3', 'x < 3', 'x > 2'], answer: 'x < 2 или x > 3',
      correctText: 'Корни 2 и 3. Ветви направлены вверх, поэтому выражение положительно вне корней.',
      wrong: [
        'Это правильный ответ.',
        'Между корнями парабола ниже нуля — там выражение отрицательное.',
        'Одной границы мало: два корня делят прямую на три промежутка.',
        'Второй корень не учтён; между двумя и тремя выражение не положительно.',
      ],
    },
    en: {
      skill: 'Quadratic inequality', question: 'Solve the inequality x² − 5x + 6 > 0.',
      options: ['x < 2 or x > 3', '2 < x < 3', 'x < 3', 'x > 2'], answer: 'x < 2 or x > 3',
      correctText: 'The roots are 2 and 3. The parabola opens upwards, so the expression is positive outside the roots.',
      wrong: [
        'This is the correct answer.',
        'Between the roots the parabola is below zero — the expression is negative there.',
        'One boundary is not enough: two roots split the line into three intervals.',
        'The second root is missing; between two and three the expression is not positive.',
      ],
    },
  },
  {
    id: 'g9-radian', grade: 9, domain: 'functions', type: 'choice',
    uz: {
      skill: "Radian o'lchovi",
      question: "90° burchakni radianda ifodalang.",
      options: ['π/2', 'π', '2π', 'π/4'], answer: 'π/2',
      correctText: "To'liq burilish 2π, yarim burilish π, to'g'ri burchak esa uning yarmi: π/2.",
      wrong: [
        "Bu to'g'ri javob.",
        "π — bu 180°, ya'ni yoyilgan burchak. To'g'ri burchak undan ikki marta kichik.",
        "2π — bu to'liq aylana, ya'ni 360°.",
        "π/4 — bu 45°. To'g'ri burchak undan ikki marta katta.",
      ],
    },
    ru: {
      skill: 'Радианная мера',
      question: 'Вырази угол 90° в радианах.',
      options: ['π/2', 'π', '2π', 'π/4'], answer: 'π/2',
      correctText: 'Полный оборот равен 2π, развёрнутый угол π, а прямой угол вдвое меньше: π/2.',
      wrong: [
        'Это правильный ответ.',
        'π — это 180°, то есть развёрнутый угол. Прямой угол вдвое меньше.',
        '2π — это полная окружность, то есть 360°.',
        'π/4 — это 45°. Прямой угол вдвое больше.',
      ],
    },
    en: {
      skill: 'Radian measure',
      question: 'Express the angle 90° in radians.',
      options: ['π/2', 'π', '2π', 'π/4'], answer: 'π/2',
      correctText: 'A full turn is 2π, a straight angle is π, and a right angle is half of that: π/2.',
      wrong: [
        'This is the correct answer.',
        'π is 180°, a straight angle. A right angle is half of it.',
        '2π is a full circle, that is 360°.',
        'π/4 is 45°. A right angle is twice that.',
      ],
    },
  },
  {
    id: 'g9-trigid', grade: 9, domain: 'functions', type: 'text',
    uz: {
      skill: 'Trigonometrik ayniyat', question: "sin α = 0,6 va α birinchi chorakda. cos α ni toping.", answer: '0,8',
      correctText: "Asosiy ayniyat: cos²α = 1 − 0,36 = 0,64. Birinchi chorakda kosinus musbat, demak cos α = 0,8.",
      wrongText: "Asosiy trigonometrik ayniyatdan foydalaning. Birinchi chorakda kosinus musbat bo'lishini unutmang.",
    },
    ru: {
      skill: 'Тригонометрическое тождество', question: 'sin α = 0,6, угол α в первой четверти. Найди cos α.', answer: '0,8',
      correctText: 'Основное тождество: cos²α = 1 − 0,36 = 0,64. В первой четверти косинус положителен, значит cos α = 0,8.',
      wrongText: 'Используй основное тригонометрическое тождество. Не забудь, что в первой четверти косинус положителен.',
    },
    en: {
      skill: 'Trigonometric identity', question: 'sin α = 0.6 and α is in the first quadrant. Find cos α.', answer: '0.8',
      correctText: 'The main identity: cos²α = 1 − 0.36 = 0.64. In the first quadrant cosine is positive, so cos α = 0.8.',
      wrongText: 'Use the main trigonometric identity. Remember that cosine is positive in the first quadrant.',
    },
  },
  {
    id: 'g9-progress', grade: 9, domain: 'algebra', type: 'text',
    uz: {
      skill: 'Arifmetik progressiya', question: "Arifmetik progressiyada a₁ = 3, a₅ = 19. Ayirmani toping.", answer: '4',
      correctText: "a₅ = a₁ + 4d, ya'ni 19 = 3 + 4d. Bundan 4d = 16 va d = 4.",
      wrongText: "Birinchi haddan beshinchi hadgacha to'rtta qadam bor. Hadlar farqini qadamlar soniga bo'ling.",
    },
    ru: {
      skill: 'Арифметическая прогрессия', question: 'В арифметической прогрессии a₁ = 3, a₅ = 19. Найди разность.', answer: '4',
      correctText: 'a₅ = a₁ + 4d, то есть 19 = 3 + 4d. Отсюда 4d = 16 и d = 4.',
      wrongText: 'От первого члена до пятого четыре шага. Раздели разницу между членами на число шагов.',
    },
    en: {
      skill: 'Arithmetic progression', question: 'In an arithmetic progression a₁ = 3 and a₅ = 19. Find the common difference.', answer: '4',
      correctText: 'a₅ = a₁ + 4d, so 19 = 3 + 4d. Hence 4d = 16 and d = 4.',
      wrongText: 'There are four steps from the first term to the fifth. Divide the gap between the terms by the number of steps.',
    },
  },
  {
    id: 'g9-similar', grade: 9, domain: 'geometry', type: 'text',
    uz: {
      skill: "Uchburchaklar o'xshashligi",
      question: "O'xshash uchburchaklarning o'xshashlik koeffitsiyenti 2,5. Kichik uchburchakning perimetri 12 sm. Katta uchburchakning perimetrini toping.", answer: '30',
      correctText: "O'xshash shakllarda perimetrlar ham koeffitsiyent kabi nisbatda: 12 · 2,5 = 30 sm.",
      wrongText: "Perimetr chiziqli o'lcham, shuning uchun u koeffitsiyentga ko'payadi, kvadratiga emas.",
    },
    ru: {
      skill: 'Подобие треугольников',
      question: 'Коэффициент подобия двух треугольников равен 2,5. Периметр меньшего равен 12 см. Найди периметр большего.', answer: '30',
      correctText: 'У подобных фигур периметры относятся так же, как коэффициент: 12 · 2,5 = 30 см.',
      wrongText: 'Периметр — линейная величина, поэтому он умножается на коэффициент, а не на его квадрат.',
    },
    en: {
      skill: 'Similar triangles',
      question: 'The scale factor of two similar triangles is 2.5. The perimeter of the smaller one is 12 cm. Find the perimeter of the larger one.', answer: '30',
      correctText: 'For similar figures the perimeters scale with the same factor: 12 · 2.5 = 30 cm.',
      wrongText: 'The perimeter is a length, so it is multiplied by the scale factor, not by its square.',
    },
  },
  {
    id: 'g10-log', grade: 10, domain: 'algebra', type: 'text',
    uz: {
      skill: 'Logarifm',
      question: "Hisoblang: log₂ 32", answer: '5',
      correctText: "log₂ 32 — bu ikkini nechanchi darajaga ko'tarsak 32 chiqishini bildiradi. 2⁵ = 32, demak javob 5.",
      wrongText: "Ikkini ketma-ket ko'paytirib boring: qaysi darajada 32 hosil bo'ladi?",
    },
    ru: {
      skill: 'Логарифм',
      question: 'Вычисли: log₂ 32', answer: '5',
      correctText: 'log₂ 32 — это степень, в которую нужно возвести 2, чтобы получить 32. Так как 2⁵ = 32, ответ равен 5.',
      wrongText: 'Умножай двойку саму на себя: в какой степени получится 32?',
    },
    en: {
      skill: 'Logarithm',
      question: 'Work out: log₂ 32', answer: '5',
      correctText: 'log₂ 32 is the power to which 2 must be raised to get 32. Since 2⁵ = 32, the answer is 5.',
      wrongText: 'Keep multiplying two by itself: at which power do you reach 32?',
    },
  },
  {
    id: 'g10-exponent', grade: 10, domain: 'algebra', type: 'choice',
    uz: {
      skill: "Ko'rsatkichli tenglama", question: "3^(x+1) = 81 tenglamani yeching.",
      options: ['3', '4', '27', '80'], answer: '3',
      correctText: "81 = 3⁴, demak x + 1 = 4 va x = 3.",
      wrong: [
        "Bu to'g'ri javob.",
        "4 — bu daraja ko'rsatkichi, ya'ni x plyus bir; iksning o'zi bittaga kichik.",
        "27 = 3³, lekin tenglamada o'ng tomonda 81 turibdi.",
        "80 — bu 81 dan birni ayirish natijasi: ko'rsatkichli tenglama bunday yechilmaydi.",
      ],
    },
    ru: {
      skill: 'Показательное уравнение', question: 'Реши уравнение 3^(x+1) = 81.',
      options: ['3', '4', '27', '80'], answer: '3',
      correctText: '81 = 3⁴, значит x + 1 = 4 и x = 3.',
      wrong: [
        'Это правильный ответ.',
        '4 — это показатель степени, то есть x плюс один; сам икс на единицу меньше.',
        '27 = 3³, но в уравнении справа стоит 81.',
        '80 получилось вычитанием единицы из 81 — показательные уравнения так не решаются.',
      ],
    },
    en: {
      skill: 'Exponential equation', question: 'Solve the equation 3^(x+1) = 81.',
      options: ['3', '4', '27', '80'], answer: '3',
      correctText: '81 = 3⁴, so x + 1 = 4 and x = 3.',
      wrong: [
        'This is the correct answer.',
        '4 is the exponent, that is x plus one; x itself is one less.',
        '27 = 3³, but the right side of the equation is 81.',
        '80 comes from subtracting one from 81 — exponential equations are not solved that way.',
      ],
    },
  },
  {
    id: 'g10-irrational', grade: 10, domain: 'algebra', type: 'text',
    uz: {
      skill: 'Irratsional tenglama', question: "√(x + 5) = 3 tenglamani yeching.", answer: '4',
      correctText: "Ikkala tomonni kvadratga oshiramiz: x + 5 = 9, demak x = 4. Tekshirish: √9 = 3.",
      wrongText: "Ildizdan qutulish uchun ikkala tomonni kvadratga oshiring, so'ng hosil bo'lgan tenglamani yeching.",
    },
    ru: {
      skill: 'Иррациональное уравнение', question: 'Реши уравнение √(x + 5) = 3.', answer: '4',
      correctText: 'Возводим обе части в квадрат: x + 5 = 9, значит x = 4. Проверка: √9 = 3.',
      wrongText: 'Чтобы избавиться от корня, возведи обе части в квадрат, затем реши полученное уравнение.',
    },
    en: {
      skill: 'Irrational equation', question: 'Solve the equation √(x + 5) = 3.', answer: '4',
      correctText: 'Square both sides: x + 5 = 9, so x = 4. Check: √9 = 3.',
      wrongText: 'To remove the root, square both sides and then solve the equation you get.',
    },
  },
  {
    id: 'g10-domain', grade: 10, domain: 'functions', type: 'choice',
    uz: {
      skill: 'Aniqlanish sohasi', question: "y = √(6 − 2x) funksiyaning aniqlanish sohasini toping.",
      options: ['x ≤ 3', 'x ≥ 3', 'x ≤ 6', 'x > 3'], answer: 'x ≤ 3',
      correctText: "Ildiz ostidagi ifoda manfiy bo'lmasligi kerak: 6 − 2x ≥ 0, bundan x ≤ 3.",
      wrong: [
        "Bu to'g'ri javob.",
        "Manfiy songa bo'lganda tengsizlik belgisi teskari bo'ladi; bu yerda belgi noto'g'ri qolgan.",
        "6 — ozod had, chegara emas: ikkiga bo'lish qadamini bajarish kerak.",
        "Bu yerda ikkita xato: −2 ga bo'lganda belgi teskari bo'lmagan, chegaradagi x = 3 nuqta esa tashlab yuborilgan, holbuki u yerda ildiz nolga teng va funksiya aniqlangan.",
      ],
    },
    ru: {
      skill: 'Область определения', question: 'Найди область определения функции y = √(6 − 2x).',
      options: ['x ≤ 3', 'x ≥ 3', 'x ≤ 6', 'x > 3'], answer: 'x ≤ 3',
      correctText: 'Подкоренное выражение неотрицательно: 6 − 2x ≥ 0, отсюда x ≤ 3.',
      wrong: [
        'Это правильный ответ.',
        'При делении на отрицательное число знак неравенства меняется — здесь он остался прежним.',
        '6 — свободный член, а не граница: нужно ещё разделить на два.',
        'Здесь две ошибки: при делении на −2 знак не перевёрнут, а граничная точка x = 3 выброшена, хотя корень там равен нулю и функция определена.',
      ],
    },
    en: {
      skill: 'Domain of a function', question: 'Find the domain of the function y = √(6 − 2x).',
      options: ['x ≤ 3', 'x ≥ 3', 'x ≤ 6', 'x > 3'], answer: 'x ≤ 3',
      correctText: 'The expression under the root is non-negative: 6 − 2x ≥ 0, hence x ≤ 3.',
      wrong: [
        'This is the correct answer.',
        'Dividing by a negative number flips the inequality sign — here it was kept as it was.',
        '6 is the constant term, not the boundary: you still have to divide by two.',
        'Two mistakes here: the sign was not flipped when dividing by −2, and the boundary point x = 3 was dropped although the root equals zero there and the function is defined.',
      ],
    },
  },
  {
    id: 'g10-events', grade: 10, domain: 'probability', type: 'text',
    uz: {
      skill: "Ehtimolliklarni qo'shish",
      question: "A va B hodisalar birgalikda emas. P(A) = 0,2, P(B) = 0,5. A ham, B ham ro'y bermasligi ehtimolini toping.",
      answer: '0,3',
      correctText: "Birgalikda bo'lmagan hodisalar uchun P(A yoki B) = 0,2 + 0,5 = 0,7. Qarama-qarshi hodisa: 1 − 0,7 = 0,3.",
      wrongText: "Avval A yoki B ro'y berish ehtimolini toping, so'ng qarama-qarshi hodisaga o'ting: birdan ayiring.",
    },
    ru: {
      skill: 'Сложение вероятностей',
      question: 'События A и B несовместны. P(A) = 0,2, P(B) = 0,5. Найди вероятность того, что не произойдёт ни A, ни B.',
      answer: '0,3',
      correctText: 'Для несовместных событий P(A или B) = 0,2 + 0,5 = 0,7. Противоположное событие: 1 − 0,7 = 0,3.',
      wrongText: 'Сначала найди вероятность того, что произойдёт A или B, потом перейди к противоположному событию: вычти из единицы.',
    },
    en: {
      skill: 'Addition rule for probabilities',
      question: 'Events A and B are mutually exclusive. P(A) = 0.2, P(B) = 0.5. Find the probability that neither A nor B happens.',
      answer: '0.3',
      correctText: 'For mutually exclusive events P(A or B) = 0.2 + 0.5 = 0.7. The complementary event: 1 − 0.7 = 0.3.',
      wrongText: 'First find the probability that A or B happens, then switch to the complementary event by subtracting from one.',
    },
  },
  {
    id: 'g10-skew', grade: 10, domain: 'geometry', type: 'choice',
    uz: {
      skill: 'Fazoda to‘g‘ri chiziqlar',
      question: "ABCDA₁B₁C₁D₁ kubda AB qirrasi bilan nechta qirra ayqash joylashgan?",
      options: ['2', '3', '4', '6'], answer: '4',
      correctText: "Ayqash qirralar AB bilan kesishmaydi va unga parallel emas: CC₁, DD₁, B₁C₁ va A₁D₁ — jami to‘rtta.",
      wrong: [
        "Faqat yon qirralar sanalgan; yuqori asosda ham ayqash qirralar bor.",
        "Bitta qirra hisobdan tushib qolgan: yuqori asosning ikkala qirrasini ham tekshiring.",
        "Bu to‘g‘ri javob.",
        "Bu yerda AB bilan kesishuvchi yoki unga parallel qirralar ham qo‘shib yuborilgan.",
      ],
    },
    ru: {
      skill: 'Прямые в пространстве',
      question: 'В кубе ABCDA₁B₁C₁D₁ сколько рёбер скрещиваются с ребром AB?',
      options: ['2', '3', '4', '6'], answer: '4',
      correctText: 'Скрещивающиеся не пересекают AB и не параллельны ему: CC₁, DD₁, B₁C₁ и A₁D₁ — всего четыре.',
      wrong: [
        'Посчитаны только боковые рёбра; в верхнем основании тоже есть скрещивающиеся.',
        'Одно ребро потеряно: проверь оба ребра верхнего основания.',
        'Это правильный ответ.',
        'Сюда попали и рёбра, которые пересекают AB или параллельны ему.',
      ],
    },
    en: {
      skill: 'Lines in space',
      question: 'In the cube ABCDA₁B₁C₁D₁, how many edges are skew to the edge AB?',
      options: ['2', '3', '4', '6'], answer: '4',
      correctText: 'Skew edges neither meet AB nor run parallel to it: CC₁, DD₁, B₁C₁ and A₁D₁ — four in total.',
      wrong: [
        'Only the vertical edges were counted; the top face has skew edges too.',
        'One edge is missing: check both edges of the top face.',
        'This is the correct answer.',
        'Edges that meet AB or run parallel to it were counted as well.',
      ],
    },
  },
  {
    id: 'g11-derivative', grade: 11, domain: 'functions', type: 'choice',
    uz: {
      skill: 'Hosila',
      question: "f(x) = x³ funksiyaning hosilasini toping.",
      options: ['3x²', 'x²', '3x', 'x⁴/4'], answer: '3x²',
      correctText: "Daraja hosilasi qoidasi: ko'rsatkich oldinga chiqadi, o'zi esa birga kamayadi. Demak (x³)′ = 3x².",
      wrong: [
        "Bu to'g'ri javob.",
        "Ko'rsatkich kamaytirilgan, ammo koeffitsiyent qo'yilmagan. Eski ko'rsatkich ko'paytuvchi bo'lib oldinga chiqadi.",
        "Bu yerda ko'rsatkich ikkiga kamaytirilgan. U faqat bittaga kamayadi.",
        "Bu boshlang'ich funksiya, ya'ni teskari amal natijasi.",
      ],
    },
    ru: {
      skill: 'Производная',
      question: 'Найди производную функции f(x) = x³.',
      options: ['3x²', 'x²', '3x', 'x⁴/4'], answer: '3x²',
      correctText: 'Правило производной степени: показатель выходит вперёд множителем, а сам уменьшается на единицу. Значит (x³)′ = 3x².',
      wrong: [
        'Это правильный ответ.',
        'Показатель уменьшен, но коэффициент не поставлен. Старый показатель выходит вперёд множителем.',
        'Здесь показатель уменьшен на два. Он уменьшается только на единицу.',
        'Это первообразная, то есть результат обратного действия.',
      ],
    },
    en: {
      skill: 'Derivative',
      question: 'Find the derivative of f(x) = x³.',
      options: ['3x²', 'x²', '3x', 'x⁴/4'], answer: '3x²',
      correctText: 'The power rule: the exponent comes out in front as a factor and drops by one. So (x³)′ = 3x².',
      wrong: [
        'This is the correct answer.',
        'The exponent was reduced but no coefficient was placed. The old exponent comes out in front as a factor.',
        'Here the exponent dropped by two. It drops by only one.',
        'This is the antiderivative, the result of the opposite operation.',
      ],
    },
  },
  {
    id: 'g11-chain', grade: 11, domain: 'functions', type: 'choice',
    uz: {
      skill: 'Murakkab funksiya hosilasi', question: "y = (2x + 1)⁵ funksiyaning hosilasini toping.",
      options: ['10(2x + 1)⁴', '5(2x + 1)⁴', '10(2x + 1)⁵', '2(2x + 1)⁴'], answer: '10(2x + 1)⁴',
      correctText: "Tashqi funksiyaning hosilasi 5(2x + 1)⁴, ichki funksiyaniki 2. Ularni ko‘paytiramiz: 10(2x + 1)⁴.",
      wrong: [
        "Bu to‘g‘ri javob.",
        "Ichki funksiyaning hosilasi hisobga olinmagan: qavs ichidagi ikki iksdan ikki chiqadi.",
        "Daraja bittaga kamayishi kerak edi; bu yerda u o‘zgarmay qolgan.",
        "Tashqi funksiyaning darajasi oldinga tushmagan: besh koeffitsiyent ham kerak.",
      ],
    },
    ru: {
      skill: 'Производная сложной функции', question: 'Найди производную функции y = (2x + 1)⁵.',
      options: ['10(2x + 1)⁴', '5(2x + 1)⁴', '10(2x + 1)⁵', '2(2x + 1)⁴'], answer: '10(2x + 1)⁴',
      correctText: 'Производная внешней функции 5(2x + 1)⁴, внутренней — 2. Перемножаем: 10(2x + 1)⁴.',
      wrong: [
        'Это правильный ответ.',
        'Не учтена производная внутренней функции: из двух икс получается двойка.',
        'Степень должна понизиться на единицу, а здесь она осталась прежней.',
        'Показатель внешней функции не вынесен вперёд: нужен ещё коэффициент пять.',
      ],
    },
    en: {
      skill: 'Chain rule', question: 'Find the derivative of the function y = (2x + 1)⁵.',
      options: ['10(2x + 1)⁴', '5(2x + 1)⁴', '10(2x + 1)⁵', '2(2x + 1)⁴'], answer: '10(2x + 1)⁴',
      correctText: 'The derivative of the outer function is 5(2x + 1)⁴ and of the inner one is 2. Multiplying gives 10(2x + 1)⁴.',
      wrong: [
        'This is the correct answer.',
        'The derivative of the inner function is missing: two x gives a factor of two.',
        'The power should drop by one, but here it stayed the same.',
        'The exponent of the outer function was not brought forward: the factor five is missing.',
      ],
    },
  },
  {
    id: 'g11-antiderivative', grade: 11, domain: 'functions', type: 'choice',
    uz: {
      skill: "Boshlang‘ich funksiya", question: "3x² + 2 funksiyaning boshlang‘ich funksiyalarining umumiy ko‘rinishini tanlang.",
      options: ['x³ + 2x + C', 'x³ + C', '3x³ + 2x + C', '6x + C'], answer: 'x³ + 2x + C',
      correctText: "Har bir hadning boshlang‘ich funksiyasi alohida topiladi: 3x² uchun x³, 2 uchun 2x. Umumiy ko‘rinishda C qo‘shiladi.",
      wrong: [
        "Bu to‘g‘ri javob.",
        "Ikkinchi had unutilgan: doimiy 2 ning boshlang‘ich funksiyasi 2x.",
        "Birinchi hadda koeffitsiyent uchga bo‘linishi kerak edi: (x³)′ allaqachon 3x² beradi.",
        "Bu hosila, boshlang‘ich funksiya emas: yo‘nalish teskari.",
      ],
    },
    ru: {
      skill: 'Первообразная', question: 'Выбери общий вид первообразных функции 3x² + 2.',
      options: ['x³ + 2x + C', 'x³ + C', '3x³ + 2x + C', '6x + C'], answer: 'x³ + 2x + C',
      correctText: 'Первообразная берётся по слагаемым: для 3x² это x³, для 2 это 2x. В общем виде добавляется C.',
      wrong: [
        'Это правильный ответ.',
        'Забыто второе слагаемое: первообразная постоянной 2 равна 2x.',
        'В первом слагаемом коэффициент нужно было разделить на три: производная x³ уже даёт 3x².',
        'Это производная, а не первообразная — направление обратное.',
      ],
    },
    en: {
      skill: 'Antiderivative', question: 'Choose the general form of the antiderivatives of 3x² + 2.',
      options: ['x³ + 2x + C', 'x³ + C', '3x³ + 2x + C', '6x + C'], answer: 'x³ + 2x + C',
      correctText: 'Take the antiderivative term by term: 3x² gives x³ and 2 gives 2x. The general form adds C.',
      wrong: [
        'This is the correct answer.',
        'The second term is missing: the antiderivative of the constant 2 is 2x.',
        'The coefficient in the first term should have been divided by three: the derivative of x³ already gives 3x².',
        'This is the derivative, not the antiderivative — the direction is reversed.',
      ],
    },
  },
  {
    id: 'g11-integral', grade: 11, domain: 'functions', type: 'text',
    uz: {
      skill: 'Aniq integral', question: "1 dan 2 gacha (2x + 1) ifodaning aniq integralini hisoblang.", answer: '4',
      correctText: "Boshlang‘ich funksiya x² + x. Nyuton–Leybnits formulasi: (4 + 2) − (1 + 1) = 4.",
      wrongText: "Avval boshlang‘ich funksiyani toping, so‘ng yuqori chegaradagi qiymatdan quyi chegaradagi qiymatni ayiring.",
    },
    ru: {
      skill: 'Определённый интеграл', question: 'Вычисли определённый интеграл выражения (2x + 1) от 1 до 2.', answer: '4',
      correctText: 'Первообразная равна x² + x. По формуле Ньютона–Лейбница: (4 + 2) − (1 + 1) = 4.',
      wrongText: 'Сначала найди первообразную, затем вычти её значение в нижнем пределе из значения в верхнем.',
    },
    en: {
      skill: 'Definite integral', question: 'Evaluate the definite integral of (2x + 1) from 1 to 2.', answer: '4',
      correctText: 'The antiderivative is x² + x. By the fundamental theorem: (4 + 2) − (1 + 1) = 4.',
      wrongText: 'First find the antiderivative, then subtract its value at the lower limit from its value at the upper limit.',
    },
  },
  {
    id: 'g11-median', grade: 11, domain: 'probability', type: 'text',
    uz: {
      skill: 'Medianadan qiymatni tiklash',
      question: "2, 5, x, 9, 12, 14 qatorning medianasi 8 ga teng. x ni toping.",
      answer: '7',
      correctText: "Olti a'zoli qatorda mediana o'rtadagi ikki sonning yarim yig'indisi: (x + 9) : 2 = 8, demak x = 7.",
      wrongText: "Juft sonli qatorda mediana o'rtadagi ikkita sonning o'rtacha qiymati. Shu tenglikni tuzib, x ni toping.",
    },
    ru: {
      skill: 'Восстановление значения по медиане',
      question: 'Медиана ряда 2, 5, x, 9, 12, 14 равна 8. Найди x.',
      answer: '7',
      correctText: 'В ряду из шести чисел медиана — полусумма двух средних: (x + 9) : 2 = 8, значит x = 7.',
      wrongText: 'При чётном количестве чисел медиана равна среднему двух центральных. Составь это равенство и найди x.',
    },
    en: {
      skill: 'Recovering a value from the median',
      question: 'The median of the list 2, 5, x, 9, 12, 14 is 8. Find x.',
      answer: '7',
      correctText: 'For six values the median is the average of the two middle ones: (x + 9) : 2 = 8, so x = 7.',
      wrongText: 'With an even count the median is the average of the two central values. Set up that equation and find x.',
    },
  },
  {
    id: 'g11-binom', grade: 11, domain: 'probability', type: 'choice',
    uz: {
      skill: 'Nyuton binomi', question: "(a + b)⁵ yoyilmasida a²b³ hadining koeffitsiyentini toping.",
      options: ['10', '5', '20', '6'], answer: '10',
      correctText: "Koeffitsiyent birlashmalar soniga teng: C(5, 3) = 10.",
      wrong: [
        "Bu to‘g‘ri javob.",
        "5 — bu daraja ko‘rsatkichi, binomial koeffitsiyent emas.",
        "20 — o‘rinlashtirishlar soni; bu yerda tartib muhim emas.",
        "6 — yoyilmadagi hadlar soni, koeffitsiyent emas.",
      ],
    },
    ru: {
      skill: 'Бином Ньютона', question: 'Найди коэффициент при a²b³ в разложении (a + b)⁵.',
      options: ['10', '5', '20', '6'], answer: '10',
      correctText: 'Коэффициент равен числу сочетаний: C(5, 3) = 10.',
      wrong: [
        'Это правильный ответ.',
        '5 — это показатель степени, а не биномиальный коэффициент.',
        '20 — число размещений; здесь порядок не важен.',
        '6 — количество слагаемых в разложении, а не коэффициент.',
      ],
    },
    en: {
      skill: 'Binomial theorem', question: 'Find the coefficient of a²b³ in the expansion of (a + b)⁵.',
      options: ['10', '5', '20', '6'], answer: '10',
      correctText: 'The coefficient equals the number of combinations: C(5, 3) = 10.',
      wrong: [
        'This is the correct answer.',
        '5 is the exponent, not the binomial coefficient.',
        '20 is the number of arrangements; here the order does not matter.',
        '6 is the number of terms in the expansion, not the coefficient.',
      ],
    },
  },
  {
    id: 'g11-vector3d', grade: 11, domain: 'geometry', type: 'text',
    uz: {
      skill: 'Vektorlar perpendikulyarligi',
      question: "(1; 2; m) va (2; 0; 1) vektorlar perpendikulyar bo'lishi uchun m qanday bo'lishi kerak?",
      answer: '−2',
      correctText: "Perpendikulyarlik sharti — skalyar ko'paytma nolga teng: 1 · 2 + 2 · 0 + m · 1 = 0, demak m = −2.",
      wrongText: "Perpendikulyar vektorlarning skalyar ko'paytmasi nolga teng. Ko'paytmani m orqali yozing va nolga tenglang.",
    },
    ru: {
      skill: 'Перпендикулярность векторов',
      question: 'При каком значении m векторы (1; 2; m) и (2; 0; 1) перпендикулярны?',
      answer: '−2',
      correctText: 'Условие перпендикулярности — скалярное произведение равно нулю: 1 · 2 + 2 · 0 + m · 1 = 0, значит m = −2.',
      wrongText: 'Скалярное произведение перпендикулярных векторов равно нулю. Запиши произведение через m и приравняй к нулю.',
    },
    en: {
      skill: 'Perpendicular vectors',
      question: 'For which value of m are the vectors (1; 2; m) and (2; 0; 1) perpendicular?',
      answer: '−2',
      correctText: 'Perpendicular means the dot product is zero: 1 · 2 + 2 · 0 + m · 1 = 0, so m = −2.',
      wrongText: 'The dot product of perpendicular vectors is zero. Write the product in terms of m and set it equal to zero.',
    },
  },
  {
    id: 'g11-pyramid', grade: 11, domain: 'geometry', type: 'text',
    uz: {
      skill: "Piramida hajmi",
      question: "Piramidaning hajmi 60 sm³, balandligi 5 sm. Asos yuzasini toping.",
      answer: '36',
      correctText: "V = (1/3) · S · h formuladan S = 3V : h = 3 · 60 : 5 = 36 sm².",
      wrongText: "Formulada uchdan bir bor. Asos yuzasini topish uchun hajmni uchga ko'paytirib, balandlikka bo'ling.",
    },
    ru: {
      skill: 'Объём пирамиды',
      question: 'Объём пирамиды 60 см³, высота 5 см. Найди площадь основания.',
      answer: '36',
      correctText: 'Из формулы V = (1/3) · S · h получаем S = 3V : h = 3 · 60 : 5 = 36 см².',
      wrongText: 'В формуле есть одна треть. Чтобы найти площадь основания, умножь объём на три и раздели на высоту.',
    },
    en: {
      skill: 'Volume of a pyramid',
      question: 'A pyramid has volume 60 cm³ and height 5 cm. Find the area of its base.',
      answer: '36',
      correctText: 'From V = (1/3) · S · h we get S = 3V : h = 3 · 60 : 5 = 36 cm².',
      wrongText: 'The formula has a factor of one third. To find the base area, multiply the volume by three and divide by the height.',
    },
  },
];

const LESSON_ID = 'math-placement-v2';
const QUESTION_TOTAL = 20;
const MIN_DOMAIN_ITEMS = 3;
const C = {
  bg: 'rgb(245, 245, 245)', text: '#000', primary: '#fe5b1a',
  green1: '#10b981', green2: '#6ee7b7', green3: '#a7f3d0', green4: '#ecfdf5',
  yellow1: '#fcd34d', yellow2: '#fde68a', yellow3: '#fffbeb', yellow4: '#ffd659',
  gray1: '#94a3b8', gray2: '#5e5e5e33',
  red1: '#ff9090', red2: '#ff6a6a', redBg: '#fff5f5',
  orange1: '#f59e0b', blue: '#019acb', lightOrange: '#ff8b3e',
};
const F = {
  sans: '"Inter", system-ui, -apple-system, sans-serif',
  serif: '"Fraunces", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};
const LANGS = ['uz', 'ru', 'en'];
const CONTENT = {
  TOTAL_SCREENS: QUESTION_TOTAL + 2,
  uz: {
    lessonTitle: "Matematika bo'yicha joylashtirish diagnostikasi",
    hookKicker: 'Boshlash nuqtasi',
    hookTitle: (name) => `${name}, matematika yo'lingizni qayerdan boshlaymiz?`,
    hookSub: "Yigirmata topshiriq bilimlaringizning kuchli tomonlari va keyingi o'sish nuqtasini ko'rsatadi.",
    hookPrompt: "O'qiyotgan sinflar oralig'ini tanlang",
    bands: [
      { id: '1-4', title: '1-4-sinflar', sub: "Sonlar, amallar, tartib va o'lchovlar" },
      { id: '5-8', title: '5-8-sinflar', sub: 'Kasrlar, algebra, geometriya va funksiyalar' },
      { id: '9-11', title: '9-11-sinflar', sub: 'Algebra, trigonometriya, analiz va ehtimollik' },
    ],
    start: 'Diagnostikani boshlash',
    back: 'Orqaga',
    next: 'Davom',
    check: 'Tekshirish',
    dontKnow: 'Bilmayman',
    selected: 'Tanlandi',
    skill: "Ko'nikma",
    midKicker: 'yarmini bajardingiz',
    inputHint: 'Javobni klaviaturada yozing.',
    inputPlaceholder: 'Javobingiz',
    emptyAnswer: 'Avval javob yozing.',
    orderHint: "To'g'ri tartibni tuzish uchun bo'laklarni ketma-ket bosing.",
    matchHint: "Chapdagi misolni tanlang, so'ng unga mos javobni o'ngdan bosing.",
    clear: 'Tozalash',
    correct: "To'g'ri",
    incorrect: 'Qayta tahlil qiling',
    review: "Yechimni ko'rib chiqing",
    exit: 'Testni yakunlash',
    exitTitle: 'Testni natijasiz yakunlaysizmi?',
    exitText: "Hozir yakunlasangiz, sinf tavsiyasi berilmaydi va joylashtirish noma'lum bo'lib qoladi.",
    keepGoing: 'Testni davom ettirish',
    confirmExit: 'Natijasiz yakunlash',
    resultKicker: 'Yakun',
    resultTitle: (name) => `${name}, bilim profilingiz tayyor`,
    incompleteKicker: 'Test yakunlanmadi',
    incompleteTitle: "Joylashtirish noma'lum",
    incompleteText: 'Barcha 20 ta savol bajarilmagani uchun sinf tavsiyasi berilmadi.',
    answered: 'Bajarilgan savollar',
    scoreLabel: 'Sizning natijangiz',
    gradeLabel: 'Tavsiya etilgan bosqich',
    openLabel: 'Ochiladigan sinf',
    allMasteredText: "Bu bosqichdagi barcha sinflar o'zlashtirilgan. Keyingi bosqichga o'tish mumkin.",
    topBandMasteredText: "11-sinfgacha bo'lgan barcha tekshirilgan mavzular o'zlashtirilgan.",
    lowerBandText: "Bu bosqichning birinchi sinfi hali mustahkam emas. Avval quyi bosqich diagnostikasidan o'ting.",
    excellent: 'Ajoyib natija!',
    good: 'Yaxshi poydevor bor.',
    repeat: 'Asosiy mavzularni mustahkamlash foydali.',
    strong: "Ishonchli ko'nikmalar",
    improve: 'Mashq qilish kerak',
    noStrong: "Hozircha barqaror kuchli yo'nalish aniqlanmadi.",
    noImprove: "Muhim bo'shliqlar aniqlanmadi.",
    mistakes: 'Xatolar ustida ishlash',
    noMistakes: "Barcha javoblar to'g'ri — zo'r ish!",
    yourAnswer: 'Sizning javobingiz',
    correctAnswer: "To'g'ri javob",
    finish: 'Diagnostikani tugatish',
    domains: {
      number: 'Sonlar va hisoblashlar', algebra: 'Algebra', geometry: 'Geometriya',
      functions: 'Funksiyalar', probability: "Ehtimollik va ma'lumotlar", reasoning: 'Mantiqiy fikrlash',
      operations: 'Amallar va tengliklar', measurement: 'Miqdorlar va masalalar',
    },
  },
  ru: {
    lessonTitle: 'Диагностика распределения по математике',
    hookKicker: 'Точка старта',
    hookTitle: (name) => `${name}, откуда начнём твой путь в математике?`,
    hookSub: 'Двадцать заданий покажут сильные навыки и следующую точку роста.',
    hookPrompt: 'Выбери диапазон классов, в котором учишься',
    bands: [
      { id: '1-4', title: '1-4 классы', sub: 'Числа, действия, порядок и величины' },
      { id: '5-8', title: '5-8 классы', sub: 'Дроби, алгебра, геометрия и функции' },
      { id: '9-11', title: '9-11 классы', sub: 'Алгебра, тригонометрия, анализ и вероятность' },
    ],
    start: 'Начать диагностику',
    back: 'Назад',
    next: 'Далее',
    check: 'Проверить',
    dontKnow: 'Не знаю',
    selected: 'Выбрано',
    skill: 'Навык',
    midKicker: 'половина уже позади',
    inputHint: 'Введи ответ с клавиатуры.',
    inputPlaceholder: 'Твой ответ',
    emptyAnswer: 'Сначала введи ответ.',
    orderHint: 'Нажимай части по порядку, чтобы собрать верный ответ.',
    matchHint: 'Выбери пример слева, затем нажми на подходящий ответ справа.',
    clear: 'Очистить',
    correct: 'Верно',
    incorrect: 'Разбери ещё раз',
    review: 'Посмотри разбор',
    exit: 'Завершить тест',
    exitTitle: 'Завершить тест без результата?',
    exitText: 'Если завершить сейчас, рекомендация по классу не будет дана, а распределение останется неизвестным.',
    keepGoing: 'Продолжить тест',
    confirmExit: 'Завершить без результата',
    resultKicker: 'Итог',
    resultTitle: (name) => `${name}, твой профиль знаний готов`,
    incompleteKicker: 'Тест не завершён',
    incompleteTitle: 'Распределение неизвестно',
    incompleteText: 'Рекомендация по классу не дана, потому что выполнены не все 20 вопросов.',
    answered: 'Выполнено вопросов',
    scoreLabel: 'Твой результат',
    gradeLabel: 'Рекомендуемый этап',
    openLabel: 'Открываем класс',
    allMasteredText: 'Все классы этого диапазона освоены. Можно переходить к следующей ступени.',
    topBandMasteredText: 'Все проверенные темы до 11 класса освоены.',
    lowerBandText: 'Первый класс диапазона пока не закрыт. Сначала пройди диагностику ступенью ниже.',
    excellent: 'Отличный результат!',
    good: 'Хорошая основа.',
    repeat: 'Полезно укрепить базовые темы.',
    strong: 'Уверенные навыки',
    improve: 'Стоит потренировать',
    noStrong: 'Устойчиво сильное направление пока не определилось.',
    noImprove: 'Критичных пробелов не обнаружено.',
    mistakes: 'Работа над ошибками',
    noMistakes: 'Все ответы верны — отличная работа!',
    yourAnswer: 'Твой ответ',
    correctAnswer: 'Правильный ответ',
    finish: 'Завершить диагностику',
    domains: {
      number: 'Числа и вычисления', algebra: 'Алгебра', geometry: 'Геометрия',
      functions: 'Функции', probability: 'Вероятность и данные', reasoning: 'Логическое мышление',
      operations: 'Действия и равенства', measurement: 'Величины и задачи',
    },
  },
  en: {
    lessonTitle: 'Maths placement diagnostic',
    hookKicker: 'Starting point',
    hookTitle: (name) => `${name}, where should your maths path begin?`,
    hookSub: 'Twenty tasks will show your strong skills and the next point of growth.',
    hookPrompt: 'Choose the range of grades you are in',
    bands: [
      { id: '1-4', title: 'Grades 1-4', sub: 'Numbers, operations, order and measures' },
      { id: '5-8', title: 'Grades 5-8', sub: 'Fractions, algebra, geometry and functions' },
      { id: '9-11', title: 'Grades 9-11', sub: 'Algebra, trigonometry, calculus and probability' },
    ],
    start: 'Start the diagnostic',
    back: 'Back',
    next: 'Next',
    check: 'Check',
    dontKnow: 'I do not know',
    selected: 'Selected',
    skill: 'Skill',
    midKicker: 'halfway through',
    inputHint: 'Type your answer.',
    inputPlaceholder: 'Your answer',
    emptyAnswer: 'Type an answer first.',
    orderHint: 'Tap the parts one after another to build the answer.',
    matchHint: 'Pick a question on the left, then tap its answer on the right.',
    clear: 'Clear',
    correct: 'Correct',
    incorrect: 'Look at it again',
    review: 'Look at the solution',
    exit: 'Finish the test',
    exitTitle: 'Finish the test without a result?',
    exitText: 'If you finish now, no grade will be suggested and the placement stays unknown.',
    keepGoing: 'Keep going',
    confirmExit: 'Finish without a result',
    resultKicker: 'Result',
    resultTitle: (name) => `${name}, your skills profile is ready`,
    incompleteKicker: 'Test not finished',
    incompleteTitle: 'Placement unknown',
    incompleteText: 'No grade was suggested because not all 20 questions were answered.',
    answered: 'Questions answered',
    scoreLabel: 'Your score',
    gradeLabel: 'Suggested stage',
    openLabel: 'Class to open',
    allMasteredText: 'Every grade in this range is mastered. You are ready for the next stage.',
    topBandMasteredText: 'All tested topics through grade 11 are mastered.',
    lowerBandText: 'The first grade of this range is not secure yet. Start with the diagnostic one stage lower.',
    excellent: 'Excellent result!',
    good: 'A solid foundation.',
    repeat: 'It helps to strengthen the core topics.',
    strong: 'Confident skills',
    improve: 'Worth practising',
    noStrong: 'No consistently strong area has emerged yet.',
    noImprove: 'No critical gaps found.',
    mistakes: 'Work on mistakes',
    noMistakes: 'Every answer is correct — great work!',
    yourAnswer: 'Your answer',
    correctAnswer: 'Correct answer',
    finish: 'Finish the diagnostic',
    domains: {
      number: 'Numbers and calculation', algebra: 'Algebra', geometry: 'Geometry',
      functions: 'Functions', probability: 'Probability and data', reasoning: 'Reasoning',
      operations: 'Operations and equalities', measurement: 'Measures and problems',
    },
  },
};
function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return mobile;
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
function shuffleWith(random, list) {
  const result = list.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}
// Место верного ответа берётся из мешка, а не из случайности: иначе одна из
// четырёх позиций может не выпасть ни разу на весь банк.
function buildAnswerSlots(count, optionCount, seed) {
  const bag = [];
  for (let index = 0; index < count; index += 1) bag.push(index % optionCount);
  return shuffleWith(makeRandom(seed), bag);
}
const ANSWER_SLOTS = buildAnswerSlots(QUESTION_TOTAL, 4, 20260903);
// slotIndex — порядковый номер среди заданий с вариантами, а не номер экрана:
// иначе мешок раздаёт места только тем позициям, на которые попали такие задания.
function arrangeOptions(itemId, options, answer, slotIndex) {
  const others = options.filter((option) => option !== answer);
  const mixed = shuffleWith(makeRandom(hashString(itemId)), others);
  const slot = ANSWER_SLOTS[((slotIndex % ANSWER_SLOTS.length) + ANSWER_SLOTS.length) % ANSWER_SLOTS.length];
  mixed.splice(slot % options.length, 0, answer);
  return mixed;
}
// Если перемешивание случайно выложило готовый ответ, сдвигаем порядок на один:
// иначе ученику остаётся нажать части слева направо.
function arrangeTokens(itemId, tokens, expected) {
  const order = shuffleWith(makeRandom(hashString(itemId)), tokens.map((_, index) => index));
  const shown = order.map((index) => tokens[index]).join(String.fromCharCode(124));
  if (shown === expected.join(String.fromCharCode(124))) {
    return order.slice(1).concat(order[0]);
  }
  return order;
}
// Равенство из карточек может быть верным и не в «эталонном» порядке:
// 31 + 26 = 57, 57 = 26 + 31, 100 − 63 = 37 и т. п. Поэтому считаем обе части.
const EQ_OPS = {
  '+': (a, b) => a + b, '-': (a, b) => a - b, '−': (a, b) => a - b,
  '×': (a, b) => a * b, '·': (a, b) => a * b, '*': (a, b) => a * b,
  ':': (a, b) => a / b, '/': (a, b) => a / b, '÷': (a, b) => a / b,
};
const EQ_HIGH = new Set(['×', '·', '*', ':', '/', '÷']);
function evaluateSide(parts) {
  if (!parts.length || parts.length % 2 === 0) return null;
  const nums = [];
  const ops = [];
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (index % 2 === 0) {
      const value = Number(String(part).replace(',', '.'));
      if (!Number.isFinite(value)) return null;
      nums.push(value);
    } else {
      if (!EQ_OPS[part]) return null;
      ops.push(part);
    }
  }
  const sumNums = [nums[0]];
  const sumOps = [];
  ops.forEach((op, index) => {
    if (EQ_HIGH.has(op)) sumNums[sumNums.length - 1] = EQ_OPS[op](sumNums[sumNums.length - 1], nums[index + 1]);
    else { sumOps.push(op); sumNums.push(nums[index + 1]); }
  });
  return sumOps.reduce((total, op, index) => EQ_OPS[op](total, sumNums[index + 1]), sumNums[0]);
}
function isTrueEquality(parts) {
  const eq = parts.indexOf('=');
  if (eq < 0 || parts.lastIndexOf('=') !== eq) return false;
  const left = evaluateSide(parts.slice(0, eq));
  const right = evaluateSide(parts.slice(eq + 1));
  return left !== null && right !== null && Math.abs(left - right) < 1e-9;
}

const STAGE_CSS = [
  '.diag-stage{height:100vh;height:100dvh;}',
  '.diag-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;}',
].join('');
function VideoStage({ children, progress, kicker, screenIdx, totalScreens, labels, onExit }) {
  const isMobile = useIsMobile();
  const padX = isMobile ? 12 : 100;
  return (
    <div
      className="diag-stage"
      style={{
        width: '100%', background: C.bg, color: C.text, fontFamily: F.sans,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      <style>{STAGE_CSS}</style>
      <div style={{ flex: '0 0 auto', background: C.bg, borderBottom: `1px solid ${C.gray2}` }}>
        <div style={{ height: 3, background: C.gray2 }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', background: C.primary }}
          />
        </div>
        <div style={{
          padding: `12px ${padX}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            fontFamily: F.mono, fontSize: isMobile ? 9 : 11, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: C.gray1, display: 'flex', alignItems: 'center', gap: 8,
            minWidth: 0,
          }}>
            <span style={{ width: 6, height: 6, flex: '0 0 auto', borderRadius: '50%', background: C.primary }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kicker}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
            <div style={{ fontFamily: F.mono, fontSize: isMobile ? 10 : 11, color: C.gray1, letterSpacing: '0.1em' }}>
              {String(screenIdx + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}
            </div>
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                title={labels.exit}
                aria-label={labels.exit}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                  display: 'flex', alignItems: 'center', color: C.gray1,
                }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
function Btn({ children, onClick, variant = 'primary', disabled = false, ariaLabel, style = {} }) {
  const variants = {
    primary: { background: C.text, color: C.bg, border: `1.5px solid ${C.text}` },
    ghost: { background: 'transparent', color: C.text, border: `1.5px solid ${C.text}` },
    accent: { background: C.primary, color: '#fff', border: `1.5px solid ${C.primary}` },
  };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={disabled ? {} : { scale: 0.97 }}
      whileHover={disabled ? {} : { background: C.primary, borderColor: C.primary, color: '#fff' }}
      style={{
        fontFamily: F.sans, fontWeight: 600,
        padding: 'clamp(12px,2vw,14px) clamp(18px,2.5vw,28px)',
        fontSize: 'clamp(14px,1.8vw,16px)', borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...variants[variant], ...style,
      }}
    >
      {children}
    </motion.button>
  );
}
function NavBar({ onBack, onNext, nextLabel, backLabel, nextDisabled, onSkip, skipLabel, skipDisabled }) {
  const isMobile = useIsMobile();
  const padX = isMobile ? 12 : 100;
  return (
    <div style={{
      flex: '0 0 auto', background: C.bg, borderTop: `1px solid ${C.gray2}`,
      padding: `${isMobile ? 12 : 18}px ${padX}px`, display: 'flex', gap: 12, alignItems: 'center',
    }}>
      {onBack && (
        <Btn onClick={onBack} variant="ghost" ariaLabel={backLabel}>
          <ArrowLeft size={16} /> {isMobile ? '' : backLabel}
        </Btn>
      )}
      {onSkip && !skipDisabled && (
        <Btn onClick={onSkip} variant="ghost">{skipLabel}</Btn>
      )}
      <Btn onClick={onNext} variant="primary" disabled={nextDisabled} style={{ marginLeft: 'auto' }}>
        {nextLabel} <ArrowRight size={16} />
      </Btn>
    </div>
  );
}
// tone: 'correct' — верно, 'wrong' — ошибка, 'review' — ученик выбрал «Не знаю»
const FEEDBACK_TONES = {
  correct: { bg: C.green4, line: C.green1, text: C.green1 },
  wrong: { bg: C.redBg, line: C.primary, text: C.primary },
  review: { bg: C.yellow3, line: C.yellow1, text: C.orange1 },
};
function FeedbackBlock({ show, tone, children }) {
  const palette = FEEDBACK_TONES[tone] || FEEDBACK_TONES.wrong;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 14 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: palette.bg,
            borderLeft: `4px solid ${palette.line}`,
            borderRadius: 12, padding: 'clamp(12px,2vw,18px)', overflow: 'hidden',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function FeedbackText({ tone, ui, children }) {
  const palette = FEEDBACK_TONES[tone] || FEEDBACK_TONES.wrong;
  const title = tone === 'correct' ? ui.correct : tone === 'review' ? ui.review : ui.incorrect;
  return (
    <>
      <p style={{
        margin: '0 0 5px', fontFamily: F.mono, fontSize: 11, fontWeight: 700,
        color: palette.text, textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 'clamp(13px,1.7vw,15px)', lineHeight: 1.45 }}>{children}</p>
    </>
  );
}
function HookScreen({ c, displayName, screenIdx, totalScreens, progress, storedAnswer, onAnswer, onNext, onHome }) {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const isMobile = useIsMobile();
  const padX = isMobile ? 12 : 100;
  const pick = (bandId) => {
    if (picked !== null) return;
    setPicked(bandId);
    onAnswer(screenIdx, { picked: bandId, type: 'hook' });
  };
  return (
    <VideoStage progress={progress} kicker={c.hookKicker} screenIdx={screenIdx} totalScreens={totalScreens} labels={c}>
      <div
        className="diag-scroll"
        style={{
          flex: 1, minHeight: 0, display: 'flex', alignItems: 'center',
          padding: `${isMobile ? 18 : 36}px ${padX}px`,
        }}
      >
        <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.primary, marginBottom: 10 }}>
              <Sparkles size={isMobile ? 20 : 24} />
              <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {c.hookPrompt}
              </span>
            </div>
            <h1 style={{
              fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600,
              fontSize: isMobile ? 32 : 'clamp(40px,6vw,68px)', lineHeight: 1.02, margin: '0 0 12px',
            }}>
              {c.hookTitle(displayName)}
            </h1>
            <p style={{ maxWidth: 720, color: C.gray1, fontSize: 'clamp(14px,2vw,18px)', lineHeight: 1.55, margin: '0 0 clamp(18px,3vw,28px)' }}>
              {c.hookSub}
            </p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {c.bands.map((bandOption, index) => {
              const selected = picked === bandOption.id;
              return (
                <motion.button
                  type="button"
                  key={bandOption.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.08 }}
                  disabled={picked !== null}
                  onClick={() => pick(bandOption.id)}
                  style={{
                    background: selected ? C.green4 : '#fff', color: selected ? C.green1 : C.text,
                    border: `1.5px solid ${selected ? C.green1 : C.text}`, borderRadius: 16,
                    padding: isMobile ? 16 : 22, textAlign: 'left', cursor: picked === null ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', gap: 14, fontFamily: F.sans,
                  }}
                >
                  <span style={{
                    width: 42, height: 42, borderRadius: '50%', flex: '0 0 auto', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', background: selected ? C.green1 : C.yellow3,
                    color: selected ? '#fff' : C.text,
                  }}>
                    {selected ? <Check size={21} /> : <span style={{ fontFamily: F.mono }}>{index + 1}</span>}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', fontFamily: F.serif, fontSize: 'clamp(20px,3vw,28px)', lineHeight: 1.1 }}>
                      {bandOption.title}
                    </strong>
                    <span style={{ display: 'block', marginTop: 5, color: selected ? C.green1 : C.gray1, fontSize: 13, lineHeight: 1.35 }}>
                      {bandOption.sub}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
      <NavBar onBack={onHome} onNext={onNext} nextLabel={c.start} backLabel={c.back} nextDisabled={picked === null} />
    </VideoStage>
  );
}
function QuestionFrame({ c, ui, screenIdx, totalScreens, progress, kicker, children, onBack, onNext, nextDisabled, onSkip, skipLabel, skipDisabled, onExit }) {
  const isMobile = useIsMobile();
  const padX = isMobile ? 12 : 100;
  return (
    <VideoStage progress={progress} kicker={kicker} screenIdx={screenIdx} totalScreens={totalScreens} labels={ui} onExit={onExit}>
      <div
        className="diag-scroll"
        style={{
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: `${isMobile ? 16 : 30}px ${padX}px`,
        }}
      >
        <div style={{ width: '100%', maxWidth: 780, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, color: C.blue,
            fontFamily: F.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 9,
          }}>
            <Lightbulb size={14} /> {ui.skill}: {c.skill}
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: F.serif, fontWeight: 600, fontSize: isMobile ? 23 : 'clamp(26px,3.6vw,38px)',
              lineHeight: 1.18, margin: '0 0 clamp(14px,2.5vw,22px)',
            }}
          >
            {c.question}
          </motion.h2>
          {children}
        </div>
      </div>
      <NavBar
        onBack={onBack} onNext={onNext} nextLabel={ui.next} backLabel={ui.back} nextDisabled={nextDisabled}
        onSkip={onSkip} skipLabel={skipLabel} skipDisabled={skipDisabled}
      />
    </VideoStage>
  );
}
function MCScreen({ item, lang, ui, screenIdx, totalScreens, progress, kicker, variantSlot, storedAnswer, onAnswer, onBack, onNext, onExit }) {
  const c = item[lang];
  const sfx = useSfx();
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [skipped, setSkipped] = useState(storedAnswer?.skipped ?? false);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);
  const shownOptions = useMemo(
    () => arrangeOptions(item.id, c.options, c.answer, variantSlot),
    [item.id, c.options, c.answer, variantSlot],
  );
  const pick = (option, viaSkip = false) => {
    if (revealed) return;
    const isCorrect = !viaSkip && option === c.answer;
    setPicked(viaSkip ? null : option);
    setSkipped(viaSkip);
    setRevealed(true);
    onAnswer(screenIdx, {
      itemId: item.id, grade: item.grade, domain: item.domain, skill: c.skill,
      picked: viaSkip ? ui.dontKnow : option, correct: isCorrect, skipped: viaSkip,
      correctAnswer: c.answer, question: c.question, type: 'mc',
    });
    if (viaSkip) {
      return;
    }
    if (isCorrect) sfx.playCorrect(); else sfx.playWrong();
  };
  const pickedIndex = picked === null ? -1 : c.options.indexOf(picked);
  const isCorrect = !skipped && picked === c.answer;
  const tone = skipped ? 'review' : isCorrect ? 'correct' : 'wrong';
  return (
    <QuestionFrame
      c={c} ui={ui} screenIdx={screenIdx} totalScreens={totalScreens} progress={progress}
      kicker={kicker} onBack={onBack} onNext={onNext} nextDisabled={!revealed}
      onSkip={() => pick(null, true)} skipLabel={ui.dontKnow} skipDisabled={revealed} onExit={onExit}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {shownOptions.map((option, index) => {
          const selected = picked === option;
          const correctOption = option === c.answer;
          let background = '#fff';
          let borderColor = C.text;
          let color = C.text;
          if (revealed) {
            if (correctOption) {
              background = C.green4; borderColor = C.green1; color = C.green1;
            } else if (selected) {
              background = C.redBg; borderColor = C.primary; color = C.primary;
            } else {
              borderColor = C.gray2; color = C.gray1;
            }
          }
          return (
            <motion.button
              type="button"
              key={`${item.id}-${option}`}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }} whileTap={revealed ? {} : { scale: 0.99 }}
              disabled={revealed} onClick={() => pick(option)}
              style={{
                background, border: `1.5px solid ${borderColor}`, color,
                padding: 'clamp(12px,1.8vw,16px) clamp(14px,2vw,20px)', borderRadius: 12,
                cursor: revealed ? 'default' : 'pointer', fontFamily: F.sans,
                fontSize: 'clamp(14px,1.9vw,17px)', fontWeight: 500, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 12, minWidth: 20, color: correctOption && revealed ? C.green1 : C.gray1 }}>
                {String.fromCharCode(65 + index)}
              </span>
              <span style={{ flex: 1 }}>{option}</span>
              {revealed && correctOption && <Check size={18} />}
              {revealed && selected && !correctOption && <X size={18} />}
            </motion.button>
          );
        })}
      </div>
      <FeedbackBlock show={revealed} tone={tone}>
        <FeedbackText tone={tone} ui={ui}>
          {skipped || isCorrect || pickedIndex < 0 ? c.correctText : c.wrong[pickedIndex]}
        </FeedbackText>
      </FeedbackBlock>
    </QuestionFrame>
  );
}
const ANSWER_UNITS = ['sm³', 'sm²', 'sm', 'cm³', 'cm²', 'cm', 'см³', 'см²', 'см', 'm', 'м'];
function normalizeAnswer(value) {
  let text = String(value).trim().toLowerCase();
  text = text.replaceAll('−', '-').replaceAll('–', '-').replaceAll('—', '-');
  text = text.replaceAll(',', '.');
  text = text.replace(/[\s  ]+/g, '');
  // «x=10», «m=-2», «d=4» — ученик может записать ответ вместе с переменной.
  text = text.replace(/^[a-zа-яё]=/, '');
  ANSWER_UNITS.forEach((unit) => { text = text.replaceAll(unit, ''); });
  text = text.replaceAll('π', '').replaceAll('pi', '').replaceAll('°', '').replaceAll('%', '');
  return text;
}
// Числовое сравнение: 3,60 = 3,6, 4/5 = 0,8, ,8 = 0,8 — это один и тот же ответ.
function answerToNumber(text) {
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(text)) return Number(text);
  const fraction = text.match(/^(-?\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
  return null;
}
function answersMatch(given, expected) {
  const a = normalizeAnswer(given);
  const b = normalizeAnswer(expected);
  if (a === b) return true;
  const na = answerToNumber(a);
  const nb = answerToNumber(b);
  return na !== null && nb !== null && Math.abs(na - nb) < 1e-9;
}

function InputScreen({ item, lang, ui, screenIdx, totalScreens, progress, kicker, storedAnswer, onAnswer, onBack, onNext, onExit }) {
  const c = item[lang];
  const sfx = useSfx();
  const [answerText, setAnswerText] = useState(storedAnswer?.answerText ?? '');
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);
  const [skipped, setSkipped] = useState(storedAnswer?.skipped ?? false);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();
  const correct = revealed && !skipped && answersMatch(answerText, c.answer);
  const tone = skipped ? 'review' : correct ? 'correct' : 'wrong';
  const submit = () => {
    if (revealed) return;
    if (!answerText.trim()) {
      setError(ui.emptyAnswer);
      return;
    }
    const isCorrect = answersMatch(answerText, c.answer);
    setError('');
    setSkipped(false);
    setRevealed(true);
    onAnswer(screenIdx, {
      itemId: item.id, grade: item.grade, domain: item.domain, skill: c.skill,
      picked: answerText.trim(), answerText: answerText.trim(), correct: isCorrect, skipped: false,
      correctAnswer: c.answer, question: c.question, type: item.type,
    });
    if (isCorrect) sfx.playCorrect(); else sfx.playWrong();
  };
  const skip = () => {
    if (revealed) return;
    setError('');
    setSkipped(true);
    setRevealed(true);
    onAnswer(screenIdx, {
      itemId: item.id, grade: item.grade, domain: item.domain, skill: c.skill,
      picked: ui.dontKnow, answerText: '', correct: false, skipped: true,
      correctAnswer: c.answer, question: c.question, type: item.type,
    });
  };
  return (
    <QuestionFrame
      c={c} ui={ui} screenIdx={screenIdx} totalScreens={totalScreens} progress={progress}
      kicker={kicker} onBack={onBack} onNext={onNext} nextDisabled={!revealed}
      onSkip={skip} skipLabel={ui.dontKnow} skipDisabled={revealed} onExit={onExit}
    >
      <p style={{ margin: '0 0 10px', color: C.gray1, fontSize: 13 }}>{ui.inputHint}</p>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <input
          value={skipped ? '' : answerText}
          onChange={(event) => {
            if (!revealed) setAnswerText(event.target.value);
            if (error) setError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
          disabled={revealed}
          placeholder={skipped ? ui.dontKnow : ui.inputPlaceholder}
          aria-label={ui.inputPlaceholder}
          style={{
            flex: 1, minWidth: 0,
            background: revealed ? (correct ? C.green4 : skipped ? C.yellow3 : C.redBg) : '#fff',
            color: correct ? C.green1 : C.text,
            border: `1.5px solid ${revealed ? (correct ? C.green1 : skipped ? C.yellow1 : C.primary) : C.text}`,
            borderRadius: 12, padding: '13px 15px', fontFamily: F.serif,
            fontSize: 'clamp(19px,3vw,27px)', outline: 'none',
          }}
        />
        {!revealed && <Btn onClick={submit} variant="accent">{ui.check} <Check size={17} /></Btn>}
      </div>
      {error && <p role="alert" style={{ margin: '8px 0 0', color: C.primary, fontSize: 13 }}>{error}</p>}
      <FeedbackBlock show={revealed} tone={tone}>
        <FeedbackText tone={tone} ui={ui}>
          {correct || skipped ? c.correctText : c.wrongText}
        </FeedbackText>
      </FeedbackBlock>
    </QuestionFrame>
  );
}
function BuildScreen({ item, lang, ui, screenIdx, totalScreens, progress, kicker, storedAnswer, onAnswer, onBack, onNext, onExit }) {
  const c = item[lang];
  const sfx = useSfx();
  const order = useMemo(() => arrangeTokens(item.id, c.tokens, c.expected), [item.id, c.tokens, c.expected]);
  const [built, setBuilt] = useState(storedAnswer?.builtIndices ?? []);
  const [skipped, setSkipped] = useState(storedAnswer?.skipped ?? false);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);
  const usedSet = new Set(built);
  const isComplete = built.length === c.tokens.length;
  const matchesExpected = (list) => {
    if (list.length !== c.expected.length) return false;
    if (item.type === 'equation') return isTrueEquality(list.map((tokenIndex) => c.tokens[tokenIndex]));
    return list.every((tokenIndex, position) => c.tokens[tokenIndex] === c.expected[position]);
  };
  const correct = revealed && !skipped && matchesExpected(built);
  const tone = skipped ? 'review' : correct ? 'correct' : 'wrong';
  const addToken = (tokenIndex) => {
    if (revealed || usedSet.has(tokenIndex)) return;
    setBuilt((current) => [...current, tokenIndex]);
  };
  const removeAt = (position) => {
    if (revealed) return;
    setBuilt((current) => current.filter((_, index) => index !== position));
  };
  const clear = () => { if (!revealed) setBuilt([]); };
  const finalize = (viaSkip = false) => {
    if (revealed) return;
    const isCorrect = !viaSkip && matchesExpected(built);
    setSkipped(viaSkip);
    setRevealed(true);
    onAnswer(screenIdx, {
      itemId: item.id, grade: item.grade, domain: item.domain, skill: c.skill,
      picked: viaSkip ? ui.dontKnow : built.map((tokenIndex) => c.tokens[tokenIndex]).join(' '),
      builtIndices: viaSkip ? [] : built, correct: isCorrect, skipped: viaSkip,
      correctAnswer: c.expected.join(' '), question: c.question, type: item.type,
    });
    if (viaSkip) {
      return;
    }
    if (isCorrect) sfx.playCorrect(); else sfx.playWrong();
  };
  return (
    <QuestionFrame
      c={c} ui={ui} screenIdx={screenIdx} totalScreens={totalScreens} progress={progress}
      kicker={kicker} onBack={onBack} onNext={onNext} nextDisabled={!revealed}
      onSkip={() => finalize(true)} skipLabel={ui.dontKnow} skipDisabled={revealed} onExit={onExit}
    >
      <p style={{ margin: '0 0 10px', color: C.gray1, fontSize: 13 }}>{ui.orderHint}</p>
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, minHeight: 46, padding: 10,
        background: '#fff', border: `1.5px solid ${C.text}`, borderRadius: 12, marginBottom: 12,
      }}>
        {built.length === 0 && <span style={{ color: C.gray1, fontSize: 13 }}>{skipped ? ui.dontKnow : ui.inputPlaceholder}</span>}
        {built.map((tokenIndex, position) => {
          let borderColor = C.text; let color = C.text; let background = '#fff';
          if (revealed) {
            const ok = correct || c.tokens[tokenIndex] === c.expected[position];
            borderColor = ok ? C.green1 : C.primary; color = ok ? C.green1 : C.primary; background = ok ? C.green4 : C.redBg;
          }
          return (
            <button
              key={`built-${position}`}
              type="button"
              onClick={() => removeAt(position)}
              disabled={revealed}
              style={{
                fontFamily: F.mono, fontSize: 16, padding: '8px 12px', borderRadius: 9,
                border: `1.5px solid ${borderColor}`, color, background, cursor: revealed ? 'default' : 'pointer',
              }}
            >
              {c.tokens[tokenIndex]}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {order.map((tokenIndex) => {
          const used = usedSet.has(tokenIndex);
          return (
            <button
              key={`pool-${tokenIndex}`}
              type="button"
              onClick={() => addToken(tokenIndex)}
              disabled={revealed || used}
              style={{
                fontFamily: F.mono, fontSize: 16, padding: '8px 12px', borderRadius: 9,
                border: `1.5px solid ${C.gray2}`, color: used ? C.gray1 : C.text,
                background: used ? C.bg : '#fff', opacity: used ? 0.4 : 1,
                cursor: revealed || used ? 'default' : 'pointer',
              }}
            >
              {c.tokens[tokenIndex]}
            </button>
          );
        })}
      </div>
      {!revealed && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={clear} variant="ghost" disabled={built.length === 0}>{ui.clear}</Btn>
          <Btn onClick={() => finalize(false)} variant="accent" disabled={!isComplete}>{ui.check} <Check size={17} /></Btn>
        </div>
      )}
      <FeedbackBlock show={revealed} tone={tone}>
        <FeedbackText tone={tone} ui={ui}>
          {correct || skipped ? c.correctText : c.wrongText}
        </FeedbackText>
        <p style={{ margin: '6px 0 0', fontFamily: F.mono, fontSize: 12, color: C.green1 }}>
          {ui.correctAnswer}: {c.expected.join(' ')}
        </p>
      </FeedbackBlock>
    </QuestionFrame>
  );
}
function MatchScreen({ item, lang, ui, screenIdx, totalScreens, progress, kicker, storedAnswer, onAnswer, onBack, onNext, onExit }) {
  const c = item[lang];
  const sfx = useSfx();
  const [links, setLinks] = useState(storedAnswer?.links ?? {});
  const [activeLeft, setActiveLeft] = useState(null);
  const [skipped, setSkipped] = useState(storedAnswer?.skipped ?? false);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);
  const isMobile = useIsMobile();
  const usedRights = new Set(Object.values(links));
  const isComplete = c.pairs.every((pair) => links[pair.id] !== undefined);
  const allMatched = c.pairs.every((pair) => links[pair.id] === pair.right);
  const correct = revealed && !skipped && allMatched;
  const tone = skipped ? 'review' : correct ? 'correct' : 'wrong';
  const pickLeft = (pairId) => {
    if (revealed) return;
    setActiveLeft((current) => (current === pairId ? null : pairId));
  };
  const pickRight = (value) => {
    if (revealed || usedRights.has(value) || !activeLeft) return;
    setLinks((current) => ({ ...current, [activeLeft]: value }));
    setActiveLeft(null);
  };
  const unlink = (pairId) => {
    if (revealed) return;
    setLinks((current) => {
      const next = { ...current };
      delete next[pairId];
      return next;
    });
  };
  const clear = () => { if (!revealed) { setLinks({}); setActiveLeft(null); } };
  const finalize = (viaSkip = false) => {
    if (revealed) return;
    const isCorrect = !viaSkip && allMatched;
    setSkipped(viaSkip);
    setRevealed(true);
    onAnswer(screenIdx, {
      itemId: item.id, grade: item.grade, domain: item.domain, skill: c.skill,
      picked: viaSkip ? ui.dontKnow : c.pairs.map((pair) => `${pair.left} = ${links[pair.id] ?? '?'}`).join(', '),
      links: viaSkip ? {} : links, correct: isCorrect, skipped: viaSkip,
      correctAnswer: c.pairs.map((pair) => `${pair.left} = ${pair.right}`).join(', '),
      question: c.question, type: item.type,
    });
    if (viaSkip) {
      return;
    }
    if (isCorrect) sfx.playCorrect(); else sfx.playWrong();
  };
  return (
    <QuestionFrame
      c={c} ui={ui} screenIdx={screenIdx} totalScreens={totalScreens} progress={progress}
      kicker={kicker} onBack={onBack} onNext={onNext} nextDisabled={!revealed}
      onSkip={() => finalize(true)} skipLabel={ui.dontKnow} skipDisabled={revealed} onExit={onExit}
    >
      <p style={{ margin: '0 0 10px', color: C.gray1, fontSize: 13 }}>{ui.matchHint}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 10 : 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.pairs.map((pair) => {
            const linkedValue = links[pair.id];
            const selected = activeLeft === pair.id;
            let borderColor = selected ? C.blue : C.text;
            let background = selected ? C.yellow3 : '#fff';
            let color = C.text;
            if (revealed) {
              const ok = linkedValue === pair.right;
              borderColor = ok ? C.green1 : C.primary; color = ok ? C.green1 : C.primary; background = ok ? C.green4 : C.redBg;
            }
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => (linkedValue !== undefined ? unlink(pair.id) : pickLeft(pair.id))}
                disabled={revealed}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  fontFamily: F.mono, fontSize: isMobile ? 13 : 15, padding: '10px 12px', borderRadius: 10,
                  border: `1.5px solid ${borderColor}`, background, color, cursor: revealed ? 'default' : 'pointer',
                }}
              >
                <span>{pair.left}</span>
                <span style={{ fontWeight: 700 }}>{linkedValue ?? '?'}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.answers.map((value, index) => {
            const used = usedRights.has(value);
            return (
              <button
                key={`${value}-${index}`}
                type="button"
                onClick={() => pickRight(value)}
                disabled={revealed || used}
                style={{
                  fontFamily: F.mono, fontSize: isMobile ? 13 : 15, padding: '10px 12px', borderRadius: 10,
                  border: `1.5px solid ${C.gray2}`, color: used ? C.gray1 : C.text,
                  background: used ? C.bg : '#fff', opacity: used ? 0.5 : 1,
                  cursor: revealed || used ? 'default' : 'pointer',
                }}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>
      {!revealed && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Btn onClick={clear} variant="ghost" disabled={Object.keys(links).length === 0}>{ui.clear}</Btn>
          <Btn onClick={() => finalize(false)} variant="accent" disabled={!isComplete}>{ui.check} <Check size={17} /></Btn>
        </div>
      )}
      <FeedbackBlock show={revealed} tone={tone}>
        <FeedbackText tone={tone} ui={ui}>
          {correct || skipped ? c.correctText : c.wrongText}
        </FeedbackText>
      </FeedbackBlock>
    </QuestionFrame>
  );
}
const MAX_SCHOOL_GRADE = 11;
function getResult(answers, items) {
  const scored = Object.entries(answers)
    .filter(([idx, answer]) => Number(idx) > 0 && answer?.correct !== undefined)
    .map(([, answer]) => answer);
  const correct = scored.filter((answer) => answer.correct === true).length;
  const grades = [...new Set(items.map((item) => item.grade))].sort((a, b) => a - b);
  const gradeStats = grades.map((grade) => {
    const gradeAnswers = scored.filter((answer) => answer.grade === grade);
    return { grade, correct: gradeAnswers.filter((answer) => answer.correct).length, total: gradeAnswers.length };
  });
  const isSolid = (grade) => {
    const stat = gradeStats.find((entry) => entry.grade === grade);
    return Boolean(stat?.total) && stat.correct >= Math.ceil(stat.total * 0.6);
  };
  // Последний класс, до которого включительно всё освоено.
  const masteredThrough = grades.reduce(
    (level, grade) => (isSolid(grade) && grades.filter((current) => current < grade).every(isSolid) ? grade : level),
    null,
  );
  // Учиться нужно с первого класса, который НЕ освоен, — его и открываем.
  const firstGap = grades.find((grade) => !isSolid(grade));
  const allMastered = grades.length > 0 && firstGap === undefined;
  const lastGrade = grades[grades.length - 1];
  // Весь диапазон освоен — открываем следующий класс (для 11 класса остаётся 11-й).
  const openGrade = allMastered ? Math.min(lastGrade + 1, MAX_SCHOOL_GRADE) : (firstGap ?? null);
  // Провален самый младший класс диапазона: сначала нужна диагностика ступенью ниже.
  // Для диапазона 1-4 ступени ниже нет — тогда просто открываем 1 класс.
  const needsLowerBand = grades.length > 0 && grades[0] > 1 && !isSolid(grades[0]);
  const domains = [...new Set(items.map((item) => item.domain))];
  const domainStats = domains
    .map((domain) => {
      const bankTotal = items.filter((item) => item.domain === domain).length;
      const domainAnswers = scored.filter((answer) => answer.domain === domain);
      return { domain, bankTotal, correct: domainAnswers.filter((answer) => answer.correct).length, total: domainAnswers.length };
    })
    .filter((stat) => stat.bankTotal >= MIN_DOMAIN_ITEMS);
  return {
    scored, correct, total: items.length,
    skippedCount: scored.filter((answer) => answer.skipped).length,
    scorePercent: items.length ? Math.round((correct / items.length) * 100) : 0,
    passed: items.length ? correct >= items.length * 0.6 : false,
    masteredThrough, openGrade: needsLowerBand ? null : openGrade, allMastered, needsLowerBand,
    atTopGrade: allMastered && lastGrade === MAX_SCHOOL_GRADE,
    recommendedGrade: needsLowerBand ? null : (masteredThrough ?? grades[0]),
    gradeStats,
    strengths: domainStats.filter((stat) => stat.total && stat.correct / stat.total >= 0.7),
    improvements: domainStats.filter((stat) => stat.total && stat.correct / stat.total < 0.55),
    mistakes: scored.filter((answer) => answer.correct === false),
  };
}
function ExitDialog({ c, onCancel, onConfirm }) {
  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="diag-exit-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(15,23,42,0.58)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
      }}
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 24px 70px rgba(0,0,0,0.25)' }}
      >
        <AlertTriangle size={28} color={C.primary} />
        <h2 id="diag-exit-title" style={{ fontFamily: F.serif, fontSize: 26, margin: '10px 0 8px' }}>{c.exitTitle}</h2>
        <p style={{ color: C.gray1, lineHeight: 1.5, margin: '0 0 18px' }}>{c.exitText}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
          <Btn onClick={onCancel} variant="ghost">{c.keepGoing}</Btn>
          <Btn onClick={onConfirm} variant="accent">{c.confirmExit}</Btn>
        </div>
      </motion.section>
    </div>
  );
}
function ResultScreen({ c, displayName, screenIdx, totalScreens, progress, result, onFinish, incomplete }) {
  const isMobile = useIsMobile();
  const padX = isMobile ? 12 : 100;
  const resultMessage = incomplete
    ? c.incompleteKicker
    : (result.scorePercent >= 85 ? c.excellent : result.passed ? c.good : c.repeat);
  const kicker = incomplete ? c.incompleteKicker : c.resultKicker;
  const title = incomplete ? c.incompleteTitle : c.resultTitle(displayName);
  return (
    <VideoStage progress={progress} kicker={kicker} screenIdx={screenIdx} totalScreens={totalScreens} labels={c}>
      <div
        className="diag-scroll"
        style={{
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
          padding: `${isMobile ? 14 : 24}px ${padX}px`,
        }}
      >
        <div style={{ width: '100%', maxWidth: 980, margin: '0 auto', minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.primary, marginBottom: 7 }}>
            {incomplete ? <AlertTriangle size={isMobile ? 22 : 28} /> : <Award size={isMobile ? 22 : 28} />}
            <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{resultMessage}</span>
          </div>
          <h1 style={{
            fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600,
            fontSize: isMobile ? 28 : 'clamp(34px,5vw,52px)', lineHeight: 1.04, margin: '0 0 12px',
          }}>
            {title}
          </h1>
          {incomplete ? (
            <>
              <p style={{ background: C.redBg, borderLeft: `4px solid ${C.primary}`, borderRadius: 10, padding: 12, color: C.primary, margin: '0 0 14px' }}>
                {c.incompleteText}
              </p>
              <div style={{ background: '#fff', border: `1px solid ${C.gray2}`, borderRadius: 14, padding: 12, maxWidth: 260 }}>
                <span style={{ display: 'block', color: C.gray1, fontFamily: F.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{c.answered}</span>
                <strong style={{ fontFamily: F.serif, fontSize: 'clamp(26px,4vw,40px)' }}>{result.scored.length}/{result.total}</strong>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
                <div style={{ background: '#fff', border: `1px solid ${C.gray2}`, borderRadius: 14, padding: 12 }}>
                  <span style={{ display: 'block', color: C.gray1, fontFamily: F.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{c.scoreLabel}</span>
                  <strong style={{ fontFamily: F.serif, fontSize: 'clamp(26px,4vw,40px)', color: result.passed ? C.green1 : C.primary }}>
                    {result.correct}/{result.total}
                  </strong>
                </div>
                <div style={{ background: '#fff', border: `1px solid ${C.gray2}`, borderRadius: 14, padding: 12 }}>
                  <span style={{ display: 'block', color: C.gray1, fontFamily: F.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{c.openLabel}</span>
                  <strong style={{ fontFamily: F.serif, fontSize: 'clamp(26px,4vw,40px)', color: C.blue }}>
                    {result.openGrade ?? String.fromCharCode(8212)}
                  </strong>
                </div>
                <div style={{ background: C.yellow3, border: `1px solid ${C.yellow1}`, borderRadius: 14, padding: 12 }}>
                  <span style={{ display: 'block', color: C.gray1, fontFamily: F.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{c.resultKicker}</span>
                  <strong style={{ fontFamily: F.serif, fontSize: 'clamp(26px,4vw,40px)' }}>{result.scorePercent}%</strong>
                </div>
              </div>
              {(result.allMastered || result.needsLowerBand) && (
                <p style={{
                  background: result.allMastered ? C.green4 : C.yellow3,
                  borderLeft: `4px solid ${result.allMastered ? C.green1 : C.yellow1}`,
                  borderRadius: 10, padding: '10px 12px', margin: '0 0 10px',
                  fontSize: 13, lineHeight: 1.45,
                }}>
                  {result.atTopGrade ? c.topBandMasteredText : result.allMastered ? c.allMasteredText : c.lowerBandText}
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div style={{ background: C.green4, borderLeft: `4px solid ${C.green1}`, borderRadius: 12, padding: '10px 12px' }}>
                  <strong style={{ display: 'block', color: C.green1, fontSize: 13, marginBottom: 4 }}>{c.strong}</strong>
                  <span style={{ fontSize: 12, lineHeight: 1.4 }}>
                    {result.strengths.length ? result.strengths.map((stat) => c.domains[stat.domain]).join(' · ') : c.noStrong}
                  </span>
                </div>
                <div style={{ background: C.redBg, borderLeft: `4px solid ${C.primary}`, borderRadius: 12, padding: '10px 12px' }}>
                  <strong style={{ display: 'block', color: C.primary, fontSize: 13, marginBottom: 4 }}>{c.improve}</strong>
                  <span style={{ fontSize: 12, lineHeight: 1.4 }}>
                    {result.improvements.length ? result.improvements.map((stat) => c.domains[stat.domain]).join(' · ') : c.noImprove}
                  </span>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, background: '#fff', border: `1px solid ${C.gray2}`, borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontFamily: F.serif, fontSize: 18, margin: '0 0 8px' }}>{c.mistakes}</h2>
                {result.mistakes.length ? (
                  <div className="diag-scroll" style={{ minHeight: 0, paddingRight: 5 }}>
                    {result.mistakes.map((mistake, index) => (
                      <div key={`${mistake.itemId}-${index}`} style={{ borderTop: index ? `1px solid ${C.gray2}` : 'none', padding: '8px 0' }}>
                        {mistake.skill && (
                          <p style={{ margin: '0 0 3px', fontFamily: F.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.blue }}>{mistake.skill}</p>
                        )}
                        <p style={{ margin: '0 0 5px', fontSize: 12, lineHeight: 1.35 }}>{mistake.question}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontFamily: F.mono, fontSize: 10 }}>
                          <span style={{ color: C.primary }}>{c.yourAnswer}: {mistake.picked}</span>
                          <span style={{ color: C.green1 }}>{c.correctAnswer}: {mistake.correctAnswer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.green1, fontSize: 14 }}>
                    <Check size={18} />&nbsp; {c.noMistakes}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{
        flex: '0 0 auto', background: C.bg, borderTop: `1px solid ${C.gray2}`,
        padding: `${isMobile ? 12 : 16}px ${padX}px`, display: 'flex', justifyContent: 'flex-end',
      }}>
        <Btn onClick={onFinish} variant="accent">{c.finish} <ArrowRight size={16} /></Btn>
      </div>
    </VideoStage>
  );
}
const BANKS = { '1-4': mathTestItems14, '5-8': mathTestItems58, '9-11': mathTestItems911 };
const EMPTY_ITEMS = [];
export { mathTestItems14, mathTestItems58, mathTestItems911, getResult, isTrueEquality, answersMatch };
export default function MathPlacement({ studentName, lang = 'uz', onHome, onFinished }) {
  const activeLang = LANGS.includes(lang) ? lang : 'uz';
  const c = CONTENT[activeLang];
  const defaultName = { uz: "O'quvchi", ru: 'Ученик', en: 'Student' };
  const displayName = studentName || defaultName[activeLang];
  const startTime = useRef(null);
  const finishSent = useRef(false);
  const [screenIdx, setScreenIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [band, setBand] = useState(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const items = BANKS[band] || EMPTY_ITEMS;
  const totalScreens = CONTENT.TOTAL_SCREENS;
  const progress = ((screenIdx + 1) / totalScreens) * 100;
  const result = useMemo(() => getResult(answers, items), [answers, items]);
  const recordAnswer = useCallback((idx, payload) => {
    if (idx === 0 && startTime.current === null) startTime.current = Date.now();
    setAnswers((current) => ({ ...current, [idx]: payload }));
    if (idx === 0) setBand(payload.picked);
  }, []);
  const goNext = useCallback(() => {
    setScreenIdx((current) => Math.min(current + 1, totalScreens - 1));
  }, [totalScreens]);
  const goBack = useCallback(() => {
    setScreenIdx((current) => Math.max(current - 1, 0));
  }, []);
  const exitEarly = useCallback(() => {
    setExitOpen(false);
    setIncomplete(true);
    setScreenIdx(totalScreens - 1);
  }, [totalScreens]);
  const handleFinish = useCallback(() => {
    if (finishSent.current) return;
    finishSent.current = true;
    const placementLevel = incomplete ? null : result.openGrade;
    onFinished?.({
      lessonId: `${LESSON_ID}-${band || 'unset'}`,
      lessonTitle: c.lessonTitle,
      lang: activeLang,
      durationSec: Math.floor((Date.now() - (startTime.current ?? Date.now())) / 1000),
      completionType: incomplete ? 'INCOMPLETE' : 'FULL_PLACEMENT',
      placementLevel,
      placementKey: placementLevel ? `start_grade_${placementLevel}` : null,
      recommendedCourse: placementLevel,
      openGrade: incomplete ? null : result.openGrade,
      masteredThrough: incomplete ? null : result.masteredThrough,
      allMastered: incomplete ? null : result.allMastered,
      needsLowerBand: incomplete ? null : result.needsLowerBand,
      confidence: incomplete ? 'unknown' : (result.scorePercent >= 85 ? 'high' : result.passed ? 'medium' : 'low'),
      selectedBand: band,
      totalQuestions: result.total,
      answeredCount: result.scored.length,
      skippedCount: result.skippedCount,
      correctAnswers: result.correct,
      scorePercent: result.scorePercent,
      passed: result.passed,
      gradeStats: result.gradeStats,
      strengths: result.strengths,
      improvements: result.improvements,
      answers: result.scored.map((answer, index) => ({
        questionIndex: index + 1,
        itemId: answer.itemId,
        skill: answer.skill,
        type: answer.type,
        question: answer.question,
        picked: answer.picked,
        correctAnswer: answer.correctAnswer,
        correct: answer.correct,
        skipped: Boolean(answer.skipped),
        grade: answer.grade,
        domain: answer.domain,
      })),
    });
  }, [activeLang, band, c.lessonTitle, incomplete, onFinished, result]);
  const storedAnswer = answers[screenIdx];
  const currentItem = !incomplete && screenIdx > 0 && screenIdx <= QUESTION_TOTAL ? items[screenIdx - 1] : null;
  const variantSlot = useMemo(
    () => items.slice(0, Math.max(screenIdx - 1, 0)).filter((entry) => entry.type === 'choice').length,
    [items, screenIdx],
  );
  const personalizedKicker = screenIdx === Math.ceil(QUESTION_TOTAL / 2)
    ? `${displayName}, ${c.midKicker}`
    : currentItem?.[activeLang]?.skill;
  const openExit = () => setExitOpen(true);
  const screenProps = {
    lang: activeLang, ui: c, screenIdx, totalScreens, progress,
    kicker: personalizedKicker, storedAnswer,
    onAnswer: recordAnswer, onBack: goBack, onNext: goNext, onExit: openExit,
  };
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeLang}-${screenIdx}-${incomplete ? 'x' : 'o'}`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {screenIdx === 0 && !incomplete && (
          <HookScreen
            c={c} displayName={displayName} screenIdx={screenIdx} totalScreens={totalScreens}
            progress={progress} storedAnswer={storedAnswer} onAnswer={recordAnswer} onNext={goNext} onHome={onHome}
          />
        )}
        {currentItem?.type === 'choice' && (
          <MCScreen item={currentItem} variantSlot={variantSlot} {...screenProps} />
        )}
        {(currentItem?.type === 'text' || currentItem?.type === 'number') && (
          <InputScreen item={currentItem} {...screenProps} />
        )}
        {(currentItem?.type === 'sequence' || currentItem?.type === 'equation') && (
          <BuildScreen item={currentItem} {...screenProps} />
        )}
        {currentItem?.type === 'match' && (
          <MatchScreen item={currentItem} {...screenProps} />
        )}
        {screenIdx === totalScreens - 1 && (
          <ResultScreen
            c={c} displayName={displayName} screenIdx={screenIdx} totalScreens={totalScreens}
            progress={incomplete ? Math.round((result.scored.length / Math.max(result.total, 1)) * 100) : progress}
            result={result} onFinish={handleFinish} incomplete={incomplete}
          />
        )}
        {exitOpen && <ExitDialog c={c} onCancel={() => setExitOpen(false)} onConfirm={exitEarly} />}
      </motion.div>
    </AnimatePresence>
  );
}
