/**
 * English Placement bank: Pre-A1 and A1 (60 items).
 *
 * All items are original. They are designed around CEFR can-do progression and
 * Cambridge-style task families, but they are not copied from protected tests.
 * Each level contains exactly 30 items: 10 languageUse, 10 reading, 10 listening.
 * Within each domain: 3 difficulty-1, 4 difficulty-2, 3 difficulty-3 items.
 */

export const levelOrder = ["preA1", "Foundation", "A1", "A2", "B1", "B2"];

export const levelDefinitions = {
  Foundation: {
    code: "Foundation",
    rank: 1,
    label: { ru: "Foundation", uz: "Foundation" },
  },
  preA1: { code: "Pre-A1", rank: 0, label: { ru: "Почти с нуля", uz: "Deyarli noldan" } },
  A1: { code: "A1", rank: 1, label: { ru: "Начинающий", uz: "Boshlang‘ich" } },
  A2: { code: "A2", rank: 2, label: { ru: "Элементарный", uz: "Elementar" } },
  B1: { code: "B1", rank: 3, label: { ru: "Средний", uz: "O‘rta" } },
  B2: { code: "B2", rank: 4, label: { ru: "Уверенный средний", uz: "Yuqori o‘rta" } },
};

export const domainNames = {
  languageUse: { ru: "Слова и грамматика", uz: "Lug‘at va grammatika" },
  reading: { ru: "Чтение", uz: "O‘qish" },
  listening: { ru: "Аудирование", uz: "Tinglab tushunish" },
};

export const localText = (value, locale = "ru") => {
  if (typeof value === "string") return value;
  return value?.[locale] ?? value?.ru ?? "";
};

export const englishTestItemsKidsA1 = [
  {
    "id": "preA1-lu-01",
    "level": "preA1",
    "difficulty": 1,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Базовая лексика",
      "uz": "Asosiy lug‘at"
    },
    "instruction": {
      "ru": "Выбери английское слово.",
      "uz": "Inglizcha so‘zni tanlang."
    },
    "prompt": {
      "ru": "🛏️ = ?",
      "uz": "🛏️ = ?"
    },
    "options": [
      "bed",
      "bus",
      "pen",
      "milk"
    ],
    "answer": "bed",
    "audioText": null
  },
  {
    "id": "preA1-lu-02",
    "level": "preA1",
    "difficulty": 1,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Глагол to be",
      "uz": "To be fe’li"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "I ___ Kamola.",
      "uz": "I ___ Kamola."
    },
    "options": [
      "am",
      "is",
      "are",
      "be"
    ],
    "answer": "am",
    "audioText": null
  },
  {
    "id": "preA1-lu-03",
    "level": "preA1",
    "difficulty": 1,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Английский алфавит",
      "uz": "Ingliz alifbosi"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "Which letter comes after B?",
      "uz": "Which letter comes after B?"
    },
    "options": [
      "C",
      "A",
      "D",
      "P"
    ],
    "answer": "C",
    "audioText": null
  },
  {
    "id": "preA1-lu-04",
    "level": "preA1",
    "difficulty": 2,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Притяжательные местоимения",
      "uz": "Egalik olmoshlari"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "This is my brother. ___ name is Bek.",
      "uz": "This is my brother. ___ name is Bek."
    },
    "options": [
      "His",
      "Her",
      "My",
      "Your"
    ],
    "answer": "His",
    "audioText": null
  },
  {
    "id": "preA1-lu-05",
    "level": "preA1",
    "difficulty": 2,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Глагол to be во множественном числе",
      "uz": "To be fe’lining ko‘plik shakli"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "We ___ at home.",
      "uz": "We ___ at home."
    },
    "options": [
      "am",
      "is",
      "are",
      "be"
    ],
    "answer": "are",
    "audioText": null
  },
  {
    "id": "preA1-lu-06",
    "level": "preA1",
    "difficulty": 2,
    "domain": "languageUse",
    "type": "text",
    "skill": {
      "ru": "Множественное число",
      "uz": "Ko‘plik shakli"
    },
    "instruction": {
      "ru": "Введи правильный ответ на английском.",
      "uz": "Ingliz tilida to‘g‘ri javobni kiriting."
    },
    "prompt": {
      "ru": "One book, two ___.",
      "uz": "One book, two ___."
    },
    "options": null,
    "answer": [
      "books"
    ],
    "audioText": null
  },
  {
    "id": "preA1-lu-07",
    "level": "preA1",
    "difficulty": 2,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Артикль a/an",
      "uz": "A/an artikli"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "I have ___ orange.",
      "uz": "I have ___ orange."
    },
    "options": [
      "a",
      "an",
      "the",
      "two"
    ],
    "answer": "an",
    "audioText": null
  },
  {
    "id": "preA1-lu-08",
    "level": "preA1",
    "difficulty": 3,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Глагол to be в третьем лице",
      "uz": "To be fe’li uchinchi shaxsda"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "She ___ from Samarkand.",
      "uz": "She ___ from Samarkand."
    },
    "options": [
      "am",
      "is",
      "are",
      "be"
    ],
    "answer": "is",
    "audioText": null
  },
  {
    "id": "preA1-lu-09",
    "level": "preA1",
    "difficulty": 3,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Простой союз",
      "uz": "Sodda bog‘lovchi"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "I like tea ___ milk.",
      "uz": "I like tea ___ milk."
    },
    "options": [
      "and",
      "but",
      "because",
      "at"
    ],
    "answer": "and",
    "audioText": null
  },
  {
    "id": "preA1-lu-10",
    "level": "preA1",
    "difficulty": 3,
    "domain": "languageUse",
    "type": "sequence",
    "skill": {
      "ru": "Порядок слов",
      "uz": "So‘z tartibi"
    },
    "instruction": {
      "ru": "Собери правильное предложение.",
      "uz": "To‘g‘ri gapni tuzing."
    },
    "prompt": {
      "ru": "Put the words in the correct order.",
      "uz": "Put the words in the correct order."
    },
    "options": null,
    "answer": [
      "This",
      "is",
      "my",
      "bag"
    ],
    "audioText": null,
    "tokens": [
      "my",
      "bag",
      "This",
      "is"
    ]
  },
  {
    "id": "preA1-r-01",
    "level": "preA1",
    "difficulty": 1,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Понимание простой вывески",
      "uz": "Sodda belgini tushunish"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "The sign says: “CAFÉ OPEN”. What can you do now?",
      "uz": "The sign says: “CAFÉ OPEN”. What can you do now?"
    },
    "options": [
      "Buy food or a drink",
      "Take a bus",
      "See a doctor",
      "Go to sleep"
    ],
    "answer": "Buy food or a drink",
    "audioText": null
  },
  {
    "id": "preA1-r-02",
    "level": "preA1",
    "difficulty": 1,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Время в коротком сообщении",
      "uz": "Qisqa xabardagi vaqt"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Bus 12 — 8:30. When does the bus leave?",
      "uz": "Bus 12 — 8:30. When does the bus leave?"
    },
    "options": [
      "At 8:30",
      "At 12:00",
      "At 3:30",
      "At 8:12"
    ],
    "answer": "At 8:30",
    "audioText": null
  },
  {
    "id": "preA1-r-03",
    "level": "preA1",
    "difficulty": 1,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Значение знакомого слова",
      "uz": "Tanish so‘z ma’nosi"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "A bottle has the label “WATER”. What is inside?",
      "uz": "A bottle has the label “WATER”. What is inside?"
    },
    "options": [
      "Water",
      "Bread",
      "A book",
      "A key"
    ],
    "answer": "Water",
    "audioText": null
  },
  {
    "id": "preA1-r-04",
    "level": "preA1",
    "difficulty": 2,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Поиск простой детали",
      "uz": "Sodda tafsilotni topish"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Aziza, your keys are on the kitchen table. Mum. Where are the keys?",
      "uz": "Aziza, your keys are on the kitchen table. Mum. Where are the keys?"
    },
    "options": [
      "On the kitchen table",
      "In the bedroom",
      "At school",
      "In a bag"
    ],
    "answer": "On the kitchen table",
    "audioText": null
  },
  {
    "id": "preA1-r-05",
    "level": "preA1",
    "difficulty": 2,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "День и время",
      "uz": "Kun va vaqt"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Please put your coat on the hook by the door. What should you do?",
      "uz": "Please put your coat on the hook by the door. What should you do?"
    },
    "options": [
      "Put the coat on the hook.",
      "Wear the coat outside.",
      "Open the door.",
      "Find a new coat."
    ],
    "answer": "Put the coat on the hook.",
    "audioText": null
  },
  {
    "id": "preA1-r-06",
    "level": "preA1",
    "difficulty": 2,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Описание человека и вещи",
      "uz": "Odam va buyumni tasvirlash"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "I am Tom. I have a red bike. What colour is Tom’s bike?",
      "uz": "I am Tom. I have a red bike. What colour is Tom’s bike?"
    },
    "options": [
      "Red",
      "Blue",
      "Black",
      "Green"
    ],
    "answer": "Red",
    "audioText": null
  },
  {
    "id": "preA1-r-07",
    "level": "preA1",
    "difficulty": 2,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Простая инструкция",
      "uz": "Sodda ko‘rsatma"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "The notice says: “Please close the door.” What should you do?",
      "uz": "The notice says: “Please close the door.” What should you do?"
    },
    "options": [
      "Close the door",
      "Open the window",
      "Sit down",
      "Call a friend"
    ],
    "answer": "Close the door",
    "audioText": null
  },
  {
    "id": "preA1-r-08",
    "level": "preA1",
    "difficulty": 3,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Короткий распорядок дня",
      "uz": "Qisqa kun tartibi"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Nodira gets up at seven. She eats breakfast and walks to school. How does she go to school?",
      "uz": "Nodira gets up at seven. She eats breakfast and walks to school. How does she go to school?"
    },
    "options": [
      "On foot",
      "By bus",
      "By car",
      "By train"
    ],
    "answer": "On foot",
    "audioText": null
  },
  {
    "id": "preA1-r-09",
    "level": "preA1",
    "difficulty": 3,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Простое логическое понимание",
      "uz": "Sodda mantiqiy tushunish"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "The shop opens at 9:00. It is now 8:45. Can you shop there now?",
      "uz": "The shop opens at 9:00. It is now 8:45. Can you shop there now?"
    },
    "options": [
      "No, it opens in 15 minutes",
      "Yes, it is open",
      "No, it opens tomorrow",
      "Yes, it closes at 9:00"
    ],
    "answer": "No, it opens in 15 minutes",
    "audioText": null
  },
  {
    "id": "preA1-r-10",
    "level": "preA1",
    "difficulty": 3,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Место встречи",
      "uz": "Uchrashuv joyi"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Hi Ali, I am at the library. Meet me by the front desk at five. Where should Ali go?",
      "uz": "Hi Ali, I am at the library. Meet me by the front desk at five. Where should Ali go?"
    },
    "options": [
      "To the library front desk",
      "To the sports centre",
      "To the bus stop",
      "To the café kitchen"
    ],
    "answer": "To the library front desk",
    "audioText": null
  },
  {
    "id": "preA1-l-01",
    "level": "preA1",
    "difficulty": 1,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Цвет",
      "uz": "Rang"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "What colour is the cup?",
      "uz": "What colour is the cup?"
    },
    "options": [
      "Blue",
      "Red",
      "Yellow",
      "White"
    ],
    "answer": "Blue",
    "audioText": "The cup is blue."
  },
  {
    "id": "preA1-l-02",
    "level": "preA1",
    "difficulty": 1,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Количество",
      "uz": "Miqdor"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "How many pencils does the speaker have?",
      "uz": "How many pencils does the speaker have?"
    },
    "options": [
      "Three",
      "Two",
      "Four",
      "Five"
    ],
    "answer": "Three",
    "audioText": "I have three pencils."
  },
  {
    "id": "preA1-l-03",
    "level": "preA1",
    "difficulty": 1,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Положение предмета",
      "uz": "Buyum joylashuvi"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Where is the cat?",
      "uz": "Where is the cat?"
    },
    "options": [
      "Under the chair",
      "On the table",
      "Behind the door",
      "In the box"
    ],
    "answer": "Under the chair",
    "audioText": "The cat is under the chair."
  },
  {
    "id": "preA1-l-04",
    "level": "preA1",
    "difficulty": 2,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Возраст",
      "uz": "Yosh"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "How old is Dilshod?",
      "uz": "How old is Dilshod?"
    },
    "options": [
      "Twelve",
      "Ten",
      "Twenty",
      "Eleven"
    ],
    "answer": "Twelve",
    "audioText": "My name is Dilshod. I am twelve."
  },
  {
    "id": "preA1-l-05",
    "level": "preA1",
    "difficulty": 2,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Номер страницы",
      "uz": "Sahifa raqami"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Which page should you open?",
      "uz": "Which page should you open?"
    },
    "options": [
      "Page 10",
      "Page 2",
      "Page 12",
      "Page 20"
    ],
    "answer": "Page 10",
    "audioText": "Please open your book on page ten."
  },
  {
    "id": "preA1-l-06",
    "level": "preA1",
    "difficulty": 2,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Время отправления",
      "uz": "Jo‘nash vaqti"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "When does the bus leave?",
      "uz": "When does the bus leave?"
    },
    "options": [
      "At six o’clock",
      "At seven o’clock",
      "At half past six",
      "At five o’clock"
    ],
    "answer": "At six o’clock",
    "audioText": "The bus leaves at six o’clock."
  },
  {
    "id": "preA1-l-07",
    "level": "preA1",
    "difficulty": 2,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Выбор напитка",
      "uz": "Ichimlik tanlash"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "What drink does the second speaker choose?",
      "uz": "What drink does the second speaker choose?"
    },
    "options": [
      "Juice",
      "Tea",
      "Water",
      "Milk"
    ],
    "answer": "Juice",
    "audioText": "Would you like tea or juice? Juice, please."
  },
  {
    "id": "preA1-l-08",
    "level": "preA1",
    "difficulty": 3,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Изменение привычного действия",
      "uz": "Odatdagi harakatning o‘zgarishi"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "How is the speaker going to school today?",
      "uz": "How is the speaker going to school today?"
    },
    "options": [
      "By car",
      "On foot",
      "By bus",
      "By bike"
    ],
    "answer": "By car",
    "audioText": "I usually walk to school, but today my father is driving me."
  },
  {
    "id": "preA1-l-09",
    "level": "preA1",
    "difficulty": 3,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Исправленная информация",
      "uz": "Tuzatilgan ma’lumot"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Which room is the meeting in?",
      "uz": "Which room is the meeting in?"
    },
    "options": [
      "Room 5",
      "Room 2",
      "Room 3",
      "Room 8"
    ],
    "answer": "Room 5",
    "audioText": "The meeting is not in Room Two. It is in Room Five."
  },
  {
    "id": "preA1-l-10",
    "level": "preA1",
    "difficulty": 3,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Два простых действия",
      "uz": "Ikki sodda harakat"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "What should the listener buy?",
      "uz": "What should the listener buy?"
    },
    "options": [
      "Two apples and one banana",
      "One apple and two bananas",
      "Two bananas only",
      "One apple only"
    ],
    "answer": "Two apples and one banana",
    "audioText": "Buy two apples and one banana."
  },
  {
    "id": "A1-lu-01",
    "level": "A1",
    "difficulty": 1,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Глагол to be",
      "uz": "To be fe’li"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "My sister ___ a doctor.",
      "uz": "My sister ___ a doctor."
    },
    "options": [
      "is",
      "are",
      "am",
      "be"
    ],
    "answer": "is",
    "audioText": null,
    "startOrder": 1
  },
  {
    "id": "A1-lu-02",
    "level": "A1",
    "difficulty": 1,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Present Simple",
      "uz": "Present Simple"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "They ___ football every Saturday.",
      "uz": "They ___ football every Saturday."
    },
    "options": [
      "play",
      "plays",
      "playing",
      "played"
    ],
    "answer": "play",
    "audioText": null,
    "startOrder": 7
  },
  {
    "id": "A1-lu-03",
    "level": "A1",
    "difficulty": 1,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Неопределённый артикль",
      "uz": "Noaniq artikl"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "There is ___ book on the desk.",
      "uz": "There is ___ book on the desk."
    },
    "options": [
      "a",
      "an",
      "some",
      "any"
    ],
    "answer": "a",
    "audioText": null
  },
  {
    "id": "A1-lu-04",
    "level": "A1",
    "difficulty": 2,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Модальный глагол can",
      "uz": "Can modal fe’li"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "Can you ___ a bike?",
      "uz": "Can you ___ a bike?"
    },
    "options": [
      "ride",
      "rides",
      "riding",
      "rode"
    ],
    "answer": "ride",
    "audioText": null,
    "startOrder": 13
  },
  {
    "id": "A1-lu-05",
    "level": "A1",
    "difficulty": 2,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Some/any",
      "uz": "Some/any"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "I don’t have ___ brothers.",
      "uz": "I don’t have ___ brothers."
    },
    "options": [
      "any",
      "some",
      "a",
      "much"
    ],
    "answer": "any",
    "audioText": null
  },
  {
    "id": "A1-lu-06",
    "level": "A1",
    "difficulty": 2,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Past Simple: be",
      "uz": "Past Simple: be"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "Yesterday we ___ at home.",
      "uz": "Yesterday we ___ at home."
    },
    "options": [
      "were",
      "are",
      "was",
      "be"
    ],
    "answer": "were",
    "audioText": null
  },
  {
    "id": "A1-lu-07",
    "level": "A1",
    "difficulty": 2,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Present Continuous",
      "uz": "Present Continuous"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "She is ___ dinner now.",
      "uz": "She is ___ dinner now."
    },
    "options": [
      "cooking",
      "cook",
      "cooks",
      "cooked"
    ],
    "answer": "cooking",
    "audioText": null
  },
  {
    "id": "A1-lu-08",
    "level": "A1",
    "difficulty": 3,
    "domain": "languageUse",
    "type": "choice",
    "skill": {
      "ru": "Past Simple",
      "uz": "Past Simple"
    },
    "instruction": {
      "ru": "Выбери правильный вариант.",
      "uz": "To‘g‘ri variantni tanlang."
    },
    "prompt": {
      "ru": "Last week I ___ my aunt.",
      "uz": "Last week I ___ my aunt."
    },
    "options": [
      "visited",
      "visit",
      "visiting",
      "visits"
    ],
    "answer": "visited",
    "audioText": null
  },
  {
    "id": "A1-lu-09",
    "level": "A1",
    "difficulty": 3,
    "domain": "languageUse",
    "type": "text",
    "skill": {
      "ru": "Предлог транспорта",
      "uz": "Transport predlogi"
    },
    "instruction": {
      "ru": "Введи правильный ответ на английском.",
      "uz": "Ingliz tilida to‘g‘ri javobni kiriting."
    },
    "prompt": {
      "ru": "He goes to school ___ bus.",
      "uz": "He goes to school ___ bus."
    },
    "options": null,
    "answer": [
      "by"
    ],
    "audioText": null
  },
  {
    "id": "A1-lu-10",
    "level": "A1",
    "difficulty": 3,
    "domain": "languageUse",
    "type": "sequence",
    "skill": {
      "ru": "Порядок слов с наречием частоты",
      "uz": "Takroriylik ravishi bilan so‘z tartibi"
    },
    "instruction": {
      "ru": "Собери правильное предложение.",
      "uz": "To‘g‘ri gapni tuzing."
    },
    "prompt": {
      "ru": "Put the words in the correct order.",
      "uz": "Put the words in the correct order."
    },
    "options": null,
    "answer": [
      "I",
      "usually",
      "have",
      "breakfast",
      "at seven"
    ],
    "audioText": null,
    "tokens": [
      "at seven",
      "usually",
      "breakfast",
      "I",
      "have"
    ]
  },
  {
    "id": "A1-r-01",
    "level": "A1",
    "difficulty": 1,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Понимание объявления",
      "uz": "E’lonni tushunish"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "The library closes at 6 p.m. What must visitors do?",
      "uz": "The library closes at 6 p.m. What must visitors do?"
    },
    "options": [
      "Leave before 6 p.m.",
      "Arrive after 6 p.m.",
      "Bring food",
      "Pay at 6 p.m."
    ],
    "answer": "Leave before 6 p.m.",
    "audioText": null,
    "startOrder": 3
  },
  {
    "id": "A1-r-02",
    "level": "A1",
    "difficulty": 1,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Место по сообщению",
      "uz": "Xabardagi joy"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "I’m at the supermarket. Do you need bread? Where is the writer?",
      "uz": "I’m at the supermarket. Do you need bread? Where is the writer?"
    },
    "options": [
      "At the supermarket",
      "At school",
      "At home",
      "At the station"
    ],
    "answer": "At the supermarket",
    "audioText": null
  },
  {
    "id": "A1-r-03",
    "level": "A1",
    "difficulty": 1,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Простое объявление",
      "uz": "Sodda e’lon"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Room for rent. One person. No pets. Who is the room suitable for?",
      "uz": "Room for rent. One person. No pets. Who is the room suitable for?"
    },
    "options": [
      "One person without a pet",
      "A family with a dog",
      "Two students with a cat",
      "Three people"
    ],
    "answer": "One person without a pet",
    "audioText": null
  },
  {
    "id": "A1-r-04",
    "level": "A1",
    "difficulty": 2,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Изменение времени",
      "uz": "Vaqt o‘zgarishi"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Hi Sara, football practice starts at 5, not 4. Meet outside the sports centre. When should Sara arrive?",
      "uz": "Hi Sara, football practice starts at 5, not 4. Meet outside the sports centre. When should Sara arrive?"
    },
    "options": [
      "At 5",
      "At 4",
      "At 6",
      "At 3"
    ],
    "answer": "At 5",
    "audioText": null,
    "startOrder": 9
  },
  {
    "id": "A1-r-05",
    "level": "A1",
    "difficulty": 2,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Расписание",
      "uz": "Jadval"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Leo cannot play football on Thursday because he has a piano lesson. Why cannot Leo play football?",
      "uz": "Leo cannot play football on Thursday because he has a piano lesson. Why cannot Leo play football?"
    },
    "options": [
      "He has a piano lesson.",
      "He does not like football.",
      "He is at the park.",
      "He has no football."
    ],
    "answer": "He has a piano lesson.",
    "audioText": null
  },
  {
    "id": "A1-r-06",
    "level": "A1",
    "difficulty": 2,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Короткое описание",
      "uz": "Qisqa tavsif"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Omar lives near his school, so he walks there every morning. Why does he walk?",
      "uz": "Omar lives near his school, so he walks there every morning. Why does he walk?"
    },
    "options": [
      "His school is near",
      "He has no classes",
      "He dislikes school",
      "The bus is free"
    ],
    "answer": "His school is near",
    "audioText": null
  },
  {
    "id": "A1-r-07",
    "level": "A1",
    "difficulty": 2,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Инструкция безопасности",
      "uz": "Xavfsizlik ko‘rsatmasi"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "The lift is out of order. Please use the stairs. What should people do?",
      "uz": "The lift is out of order. Please use the stairs. What should people do?"
    },
    "options": [
      "Use the stairs",
      "Wait inside the lift",
      "Call a taxi",
      "Go home"
    ],
    "answer": "Use the stairs",
    "audioText": null
  },
  {
    "id": "A1-r-08",
    "level": "A1",
    "difficulty": 3,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Простой вывод из текста",
      "uz": "Matndan sodda xulosa"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Marta works from Monday to Friday. On Saturday she visits her grandmother. When is Marta free from work?",
      "uz": "Marta works from Monday to Friday. On Saturday she visits her grandmother. When is Marta free from work?"
    },
    "options": [
      "On Saturday",
      "On Monday",
      "Every morning",
      "Never"
    ],
    "answer": "On Saturday",
    "audioText": null
  },
  {
    "id": "A1-r-09",
    "level": "A1",
    "difficulty": 3,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Понимание задержки",
      "uz": "Kechikishni tushunish"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Train 18:10 delayed by 20 minutes. When will it probably leave?",
      "uz": "Train 18:10 delayed by 20 minutes. When will it probably leave?"
    },
    "options": [
      "At 18:30",
      "At 18:10",
      "At 17:50",
      "At 20:10"
    ],
    "answer": "At 18:30",
    "audioText": null
  },
  {
    "id": "A1-r-10",
    "level": "A1",
    "difficulty": 3,
    "domain": "reading",
    "type": "choice",
    "skill": {
      "ru": "Цель приглашения",
      "uz": "Taklif maqsadi"
    },
    "instruction": {
      "ru": "Прочитай текст и выбери правильный ответ.",
      "uz": "Matnni o‘qing va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Come to my birthday picnic on Sunday at Green Park. Bring a hat and some water. Why did the writer send this message?",
      "uz": "Come to my birthday picnic on Sunday at Green Park. Bring a hat and some water. Why did the writer send this message?"
    },
    "options": [
      "To invite a friend",
      "To cancel a picnic",
      "To sell a hat",
      "To ask for directions"
    ],
    "answer": "To invite a friend",
    "audioText": null
  },
  {
    "id": "A1-l-01",
    "level": "A1",
    "difficulty": 1,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Цена",
      "uz": "Narx"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "How much is the museum ticket?",
      "uz": "How much is the museum ticket?"
    },
    "options": [
      "Five dollars",
      "Four dollars",
      "Fifteen dollars",
      "Free"
    ],
    "answer": "Five dollars",
    "audioText": "The museum ticket costs five dollars.",
    "startOrder": 5
  },
  {
    "id": "A1-l-02",
    "level": "A1",
    "difficulty": 1,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Дата",
      "uz": "Sana"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "When is the speaker’s birthday?",
      "uz": "When is the speaker’s birthday?"
    },
    "options": [
      "The ninth of May",
      "The fifth of September",
      "The nineteenth of May",
      "The ninth of March"
    ],
    "answer": "The ninth of May",
    "audioText": "My birthday is on the ninth of May."
  },
  {
    "id": "A1-l-03",
    "level": "A1",
    "difficulty": 1,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Направление",
      "uz": "Yo‘nalish"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "What should the listener do after the bank?",
      "uz": "What should the listener do after the bank?"
    },
    "options": [
      "Turn left",
      "Turn right",
      "Stop",
      "Cross the bridge"
    ],
    "answer": "Turn left",
    "audioText": "Turn left after the bank."
  },
  {
    "id": "A1-l-04",
    "level": "A1",
    "difficulty": 2,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Исправленное время",
      "uz": "Tuzatilgan vaqt"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "When does the film start?",
      "uz": "When does the film start?"
    },
    "options": [
      "At 7:30",
      "At 7:00",
      "At 6:30",
      "At 8:00"
    ],
    "answer": "At 7:30",
    "audioText": "The film was going to start at seven, but it now starts at half past seven.",
    "startOrder": 11
  },
  {
    "id": "A1-l-05",
    "level": "A1",
    "difficulty": 2,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Погода и одежда",
      "uz": "Ob-havo va kiyim"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "What should the listener take?",
      "uz": "What should the listener take?"
    },
    "options": [
      "A jacket",
      "Sunglasses",
      "A swimsuit",
      "Sandals"
    ],
    "answer": "A jacket",
    "audioText": "It will be cold this evening, so take a jacket."
  },
  {
    "id": "A1-l-06",
    "level": "A1",
    "difficulty": 2,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Размер покупки",
      "uz": "Xarid o‘lchami"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Which size does the customer need?",
      "uz": "Which size does the customer need?"
    },
    "options": [
      "Medium",
      "Small",
      "Large",
      "Extra large"
    ],
    "answer": "Medium",
    "audioText": "This shirt is too small. Do you have it in a medium?"
  },
  {
    "id": "A1-l-07",
    "level": "A1",
    "difficulty": 2,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Время встречи",
      "uz": "Uchrashuv vaqti"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "When is the dentist appointment?",
      "uz": "When is the dentist appointment?"
    },
    "options": [
      "Tuesday at ten",
      "Thursday at two",
      "Tuesday at two",
      "Friday at ten"
    ],
    "answer": "Tuesday at ten",
    "audioText": "Your dentist appointment is on Tuesday at ten o’clock."
  },
  {
    "id": "A1-l-08",
    "level": "A1",
    "difficulty": 3,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Причина опоздания",
      "uz": "Kechikish sababi"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Why is the speaker late?",
      "uz": "Why is the speaker late?"
    },
    "options": [
      "The bus was slow",
      "The speaker overslept",
      "The train was cancelled",
      "The road was closed"
    ],
    "answer": "The bus was slow",
    "audioText": "Sorry I’m late. I left home on time, but the bus was very slow."
  },
  {
    "id": "A1-l-09",
    "level": "A1",
    "difficulty": 3,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Изменение плана",
      "uz": "Rejaning o‘zgarishi"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "What will they do now?",
      "uz": "What will they do now?"
    },
    "options": [
      "Stay home and watch a film",
      "Go to the park",
      "Play football outside",
      "Visit the museum"
    ],
    "answer": "Stay home and watch a film",
    "audioText": "We planned to go to the park, but it is raining. Let’s stay home and watch a film instead."
  },
  {
    "id": "A1-l-10",
    "level": "A1",
    "difficulty": 3,
    "domain": "listening",
    "type": "listening",
    "skill": {
      "ru": "Две детали",
      "uz": "Ikki tafsilot"
    },
    "instruction": {
      "ru": "Прослушай запись и выбери правильный ответ.",
      "uz": "Yozuvni tinglang va to‘g‘ri javobni tanlang."
    },
    "prompt": {
      "ru": "Where and when will they meet?",
      "uz": "Where and when will they meet?"
    },
    "options": [
      "At the café at six",
      "At the station at five",
      "At school at six",
      "At the café at seven"
    ],
    "answer": "At the café at six",
    "audioText": "Let’s meet at the café, not the station, at six o’clock."
  }
];
