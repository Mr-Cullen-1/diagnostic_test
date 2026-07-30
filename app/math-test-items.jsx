const bi = (ru, uz) => ({ ru, uz });

export const domainNames = {
  number: bi("Числа и вычисления", "Sonlar va hisoblashlar"),
  operations: bi("Действия и равенства", "Amallar va tengliklar"),
  reasoning: bi("Логика и порядок", "Mantiq va tartib"),
  measurement: bi("Величины и задачи", "Miqdorlar va masalalar"),
  algebra: bi("Алгебраические преобразования", "Algebraik o‘zgartirishlar"),
  functions: bi("Функции и графики", "Funksiyalar va grafiklar"),
  geometry: bi("Геометрия", "Geometriya"),
  probability: bi("Вероятность и данные", "Ehtimollik va ma’lumotlar"),
};

// The bank intentionally covers every core prerequisite of grades 1–4.
// It contains no ordinary single-choice items: answers are built, ordered, or matched.
export const mathTestItems = [
  { id: "g1-count", grade: 1, domain: "number", type: "number", skill: bi("Счёт в пределах 20", "20 ichida sanash"), prompt: bi("У Маши было 4 карандаша. Ей дали ещё 3. Сколько карандашей стало?", "Mashada 4 ta qalam bor edi. Unga yana 3 ta berishdi. Jami nechta qalam bo‘ldi?"), answer: "7" },
  { id: "g1-order", grade: 1, domain: "reasoning", type: "sequence", skill: bi("Порядок чисел", "Sonlar tartibi"), prompt: bi("Поставь числа по возрастанию.", "Sonlarni o‘sish tartibida joylashtiring."), tokens: ["8", "2", "5"], expected: ["2", "5", "8"] },
  { id: "g1-build", grade: 1, domain: "operations", type: "equation", skill: bi("Сложение", "Qo‘shish"), prompt: bi("Собери верное равенство.", "To‘g‘ri tenglikni tuzing."), tokens: ["7", "=", "4", "+", "3"], expected: ["4", "+", "3", "=", "7"] },
  { id: "g1-match", grade: 1, domain: "operations", type: "match", skill: bi("Связь примера и ответа", "Misol va javob bog‘lanishi"), prompt: bi("Соедини каждый пример с его ответом.", "Har bir misolni uning javobi bilan bog‘lang."), pairs: [{ id: "a", left: "2 + 5", right: "7" }, { id: "b", left: "9 − 4", right: "5" }, { id: "c", left: "6 + 3", right: "9" }], answers: ["5", "9", "7"] },
  { id: "g1-subtract", grade: 1, domain: "number", type: "number", skill: bi("Вычитание в пределах 20", "20 ichida ayirish"), prompt: bi("В коробке было 13 кубиков. 5 кубиков взяли. Сколько осталось?", "Qutida 13 ta kubik bor edi. 5 tasini olishdi. Nechtasi qoldi?"), answer: "8" },

  { id: "g2-add", grade: 2, domain: "number", type: "number", skill: bi("Сложение двузначных чисел", "Ikki xonali sonlarni qo‘shish"), prompt: bi("Вычисли: 36 + 27", "Hisoblang: 36 + 27"), answer: "63" },
  { id: "g2-subtract", grade: 2, domain: "operations", type: "equation", skill: bi("Вычитание с переходом", "O‘nlikdan o‘tib ayirish"), prompt: bi("Собери верное равенство.", "To‘g‘ri tenglikni tuzing."), tokens: ["18", "45", "=", "27", "−"], expected: ["45", "−", "18", "=", "27"] },
  { id: "g2-place", grade: 2, domain: "reasoning", type: "sequence", skill: bi("Разрядный состав и порядок", "Xona birliklari va tartib"), prompt: bi("Расположи числа от меньшего к большему.", "Sonlarni kichikdan kattaga qarab joylashtiring."), tokens: ["210", "102", "120"], expected: ["102", "120", "210"] },
  { id: "g2-multiply", grade: 2, domain: "operations", type: "match", skill: bi("Табличное умножение", "Ko‘paytirish jadvali"), prompt: bi("Соедини пример с ответом.", "Misolni javobi bilan bog‘lang."), pairs: [{ id: "a", left: "2 × 6", right: "12" }, { id: "b", left: "3 × 5", right: "15" }, { id: "c", left: "4 × 4", right: "16" }], answers: ["12", "15", "16"] },
  { id: "g2-groups", grade: 2, domain: "measurement", type: "number", skill: bi("Умножение как равные группы", "Teng guruhlar orqali ko‘paytirish"), prompt: bi("На 4 тарелках лежит по 5 печений. Сколько печений всего?", "4 ta likopchada 5 tadan pechenye bor. Jami nechta pechenye bor?"), answer: "20" },

  { id: "g3-add", grade: 3, domain: "number", type: "number", skill: bi("Сложение трёхзначных чисел", "Uch xonali sonlarni qo‘shish"), prompt: bi("Вычисли: 125 + 278", "Hisoblang: 125 + 278"), answer: "403" },
  { id: "g3-divide", grade: 3, domain: "operations", type: "equation", skill: bi("Деление", "Bo‘lish"), prompt: bi("Собери верное равенство.", "To‘g‘ri tenglikni tuzing."), tokens: ["12", "7", "84", "=", ":"], expected: ["84", ":", "7", "=", "12"] },
  { id: "g3-fractions", grade: 3, domain: "reasoning", type: "sequence", skill: bi("Сравнение простых дробей", "Oddiy kasrlarni taqqoslash"), prompt: bi("Поставь дроби от меньшей к большей.", "Kasrlarni kichikdan kattaga qarab joylashtiring."), tokens: ["3/4", "1/4", "1/2"], expected: ["1/4", "1/2", "3/4"] },
  { id: "g3-facts", grade: 3, domain: "operations", type: "match", skill: bi("Умножение и деление", "Ko‘paytirish va bo‘lish"), prompt: bi("Соедини каждый пример с ответом.", "Har bir misolni uning javobi bilan bog‘lang."), pairs: [{ id: "a", left: "7 × 8", right: "56" }, { id: "b", left: "54 : 6", right: "9" }, { id: "c", left: "48 : 6", right: "8" }], answers: ["9", "56", "8"] },
  { id: "g3-perimeter", grade: 3, domain: "measurement", type: "number", skill: bi("Периметр прямоугольника", "To‘g‘ri to‘rtburchak perimetri"), prompt: bi("У прямоугольника стороны 6 см и 4 см. Чему равен его периметр в сантиметрах?", "To‘g‘ri to‘rtburchakning tomonlari 6 sm va 4 sm. Perimetri necha santimetr?"), answer: "20" },

  { id: "g4-fraction", grade: 4, domain: "number", type: "number", skill: bi("Нахождение дроби от числа", "Sonning qismini topish"), prompt: bi("Найди 3/4 от 20.", "20 ning 3/4 qismini toping."), answer: "15" },
  { id: "g4-divide", grade: 4, domain: "operations", type: "equation", skill: bi("Деление многозначного числа", "Ko‘p xonali sonni bo‘lish"), prompt: bi("Собери верное равенство.", "To‘g‘ri tenglikni tuzing."), tokens: ["6", "240", "=", "40", ":"], expected: ["240", ":", "6", "=", "40"] },
  { id: "g4-decimals", grade: 4, domain: "reasoning", type: "sequence", skill: bi("Сравнение десятичных дробей", "O‘nli kasrlarni taqqoslash"), prompt: bi("Поставь числа от меньшего к большему.", "Sonlarni kichikdan kattaga qarab joylashtiring."), tokens: ["0,7", "0,07", "0,17"], expected: ["0,07", "0,17", "0,7"] },
  { id: "g4-units", grade: 4, domain: "measurement", type: "match", skill: bi("Перевод единиц длины", "Uzunlik birliklarini aylantirish"), prompt: bi("Соедини величину с числом сантиметров.", "Miqdorni santimetrlar soni bilan bog‘lang."), pairs: [{ id: "a", left: "2 м 30 см", right: "230" }, { id: "b", left: "1 м 5 см", right: "105" }, { id: "c", left: "4 м", right: "400" }], answers: ["400", "105", "230"] },
  { id: "g4-brackets", grade: 4, domain: "operations", type: "number", skill: bi("Порядок действий", "Amallar tartibi"), prompt: bi("Вычисли: (18 + 6) × 3", "Hisoblang: (18 + 6) × 3"), answer: "72" },
];

export const localText = (value, locale) => value[locale];
