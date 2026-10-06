/**
 * Foundation is the bridge between Kids (alphabet / first words) and A1.
 * It intentionally checks core survival English before A1 grammar becomes
 * the main signal. The bank has 30 original items: 10 per domain.
 */

const labels = {
  instruction: { ru: "Выбери правильный ответ.", uz: "To‘g‘ri javobni tanlang." },
  reading: { ru: "Прочитай и выбери правильный ответ.", uz: "O‘qing va to‘g‘ri javobni tanlang." },
  listening: { ru: "Прослушай и выбери правильный ответ.", uz: "Tinglang va to‘g‘ri javobni tanlang." },
};

function choice({ id, domain, difficulty, prompt, options, answer, skill, audioText }) {
  return {
    id: `foundation-${id}`,
    level: "Foundation",
    domain,
    difficulty,
    type: domain === "listening" ? "listening" : "choice",
    skill: { ru: skill, uz: skill },
    instruction: labels[domain === "listening" ? "listening" : domain === "reading" ? "reading" : "instruction"],
    prompt: { ru: prompt, uz: prompt },
    options,
    answer,
    ...(audioText ? { audioText } : {}),
  };
}

export const englishTestItemsFoundation = [
  choice({ id: "lu-01", domain: "languageUse", difficulty: 1, skill: "Глагол to be", prompt: "I ___ ten years old.", options: ["am", "is", "are", "be"], answer: "am" }),
  choice({ id: "lu-02", domain: "languageUse", difficulty: 1, skill: "Множественное число", prompt: "Two ___", options: ["book", "books", "bookes", "a book"], answer: "books" }),
  choice({ id: "lu-03", domain: "languageUse", difficulty: 1, skill: "Притяжательные слова", prompt: "This is ___ bag.", options: ["my", "I", "me", "mine is"], answer: "my" }),
  choice({ id: "lu-04", domain: "languageUse", difficulty: 2, skill: "There is / there are", prompt: "___ a cat in the garden.", options: ["There is", "There are", "It are", "They is"], answer: "There is" }),
  choice({ id: "lu-05", domain: "languageUse", difficulty: 2, skill: "Настоящее простое", prompt: "My brother ___ football on Sundays.", options: ["plays", "play", "playing", "is play"], answer: "plays" }),
  choice({ id: "lu-06", domain: "languageUse", difficulty: 2, skill: "Настоящее длительное", prompt: "Look! The baby ___.", options: ["is sleeping", "sleep", "sleeps", "sleeping is"], answer: "is sleeping" }),
  choice({ id: "lu-07", domain: "languageUse", difficulty: 2, skill: "Вопросы", prompt: "___ you like apples?", options: ["Do", "Does", "Are", "Is"], answer: "Do" }),
  choice({ id: "lu-08", domain: "languageUse", difficulty: 3, skill: "Прошедшее простое", prompt: "Yesterday we ___ to the park.", options: ["went", "go", "goes", "are going"], answer: "went" }),
  choice({ id: "lu-09", domain: "languageUse", difficulty: 3, skill: "Количество", prompt: "There ___ some juice in the glass.", options: ["is", "are", "be", "am"], answer: "is" }),
  choice({ id: "lu-10", domain: "languageUse", difficulty: 3, skill: "Предлоги места", prompt: "The ball is ___ the box.", options: ["in", "at", "on to", "from"], answer: "in" }),

  choice({ id: "r-01", domain: "reading", difficulty: 1, skill: "Короткая вывеска", prompt: "OPEN 9:00–18:00\nWhen can you visit the shop?", options: ["At 10:00", "At 7:00", "At 20:00", "Never"], answer: "At 10:00" }),
  choice({ id: "r-02", domain: "reading", difficulty: 1, skill: "Простое сообщение", prompt: "Hi Sam. I am at the bus stop. See you in ten minutes.\nWhere is the writer?", options: ["At the bus stop", "At school", "At home", "In the shop"], answer: "At the bus stop" }),
  choice({ id: "r-03", domain: "reading", difficulty: 1, skill: "Простое сообщение", prompt: "Maya is at the park. She cannot find her blue backpack.\nWhat is Maya looking for?", options: ["Her blue backpack.", "Her friend.", "A football.", "Her lunch."], answer: "Her blue backpack." }),
  choice({ id: "r-04", domain: "reading", difficulty: 2, skill: "Короткое объявление", prompt: "Please leave your shoes by the door.\nWhat should you do?", options: ["Take off your shoes", "Buy new shoes", "Open the door", "Clean the floor"], answer: "Take off your shoes" }),
  choice({ id: "r-05", domain: "reading", difficulty: 2, skill: "Повседневный текст", prompt: "Mia has lunch at school. Her favourite food is pasta.\nWhat does Mia like?", options: ["Pasta", "Soup", "School bags", "Breakfast"], answer: "Pasta" }),
  choice({ id: "r-06", domain: "reading", difficulty: 2, skill: "Направления", prompt: "The library is next to the bank.\nWhere is the library?", options: ["Beside the bank", "Inside the bank", "Behind the school", "At the station"], answer: "Beside the bank" }),
  choice({ id: "r-07", domain: "reading", difficulty: 2, skill: "План", prompt: "I cannot play today because I have a dentist appointment.\nWhy cannot the writer play?", options: ["They have a dentist appointment", "They are at work", "They do not like the game", "They are travelling"], answer: "They have a dentist appointment" }),
  choice({ id: "r-08", domain: "reading", difficulty: 3, skill: "Короткое письмо", prompt: "Bring a warm jacket. It may rain after lunch.\nWhat should you bring?", options: ["A warm jacket", "A lunchbox", "A new phone", "A ticket"], answer: "A warm jacket" }),
  choice({ id: "r-09", domain: "reading", difficulty: 3, skill: "Сравнение", prompt: "Tom is taller than Max, but Max is faster.\nWho is faster?", options: ["Max", "Tom", "They are the same", "The text does not say"], answer: "Max" }),
  choice({ id: "r-10", domain: "reading", difficulty: 3, skill: "Причина", prompt: "The café is closed today because the staff are cleaning it.\nWhy is the café closed?", options: ["The staff are cleaning", "There is no food", "It is too late", "The owner is travelling"], answer: "The staff are cleaning" }),

  choice({ id: "l-01", domain: "listening", difficulty: 1, skill: "Числа", prompt: "What number do you hear?", audioText: "My house number is fourteen.", options: ["14", "40", "4", "15"], answer: "14" }),
  choice({ id: "l-02", domain: "listening", difficulty: 1, skill: "Цвета", prompt: "What colour is the bag?", audioText: "Please take the blue bag.", options: ["Blue", "Green", "Black", "Red"], answer: "Blue" }),
  choice({ id: "l-03", domain: "listening", difficulty: 1, skill: "Базовые действия", prompt: "What should you do?", audioText: "Please sit down.", options: ["Sit down", "Stand up", "Run outside", "Open the window"], answer: "Sit down" }),
  choice({ id: "l-04", domain: "listening", difficulty: 2, skill: "Время", prompt: "When does the film start?", audioText: "The film starts at half past six.", options: ["6:30", "6:00", "7:30", "5:30"], answer: "6:30" }),
  choice({ id: "l-05", domain: "listening", difficulty: 2, skill: "Место", prompt: "Where is Anna?", audioText: "Anna is waiting in front of the supermarket.", options: ["In front of the supermarket", "At the cinema", "At school", "On the bus"], answer: "In front of the supermarket" }),
  choice({ id: "l-06", domain: "listening", difficulty: 2, skill: "Планы", prompt: "What is Leo going to do?", audioText: "Leo is going to visit his grandmother this weekend.", options: ["Visit his grandmother", "Play football", "Go to school", "Buy a bicycle"], answer: "Visit his grandmother" }),
  choice({ id: "l-07", domain: "listening", difficulty: 2, skill: "Погода", prompt: "What is the weather like?", audioText: "It is cold today, so wear a coat.", options: ["Cold", "Hot", "Windy and warm", "Sunny"], answer: "Cold" }),
  choice({ id: "l-08", domain: "listening", difficulty: 3, skill: "Изменение плана", prompt: "What has changed?", audioText: "The lesson was on Friday, but it is now on Thursday.", options: ["The day", "The teacher", "The room", "The subject"], answer: "The day" }),
  choice({ id: "l-09", domain: "listening", difficulty: 3, skill: "Просьба", prompt: "What does the speaker need?", audioText: "Could you help me carry these books, please?", options: ["Help carrying books", "A new book", "A pen", "A ticket"], answer: "Help carrying books" }),
  choice({ id: "l-10", domain: "listening", difficulty: 3, skill: "Простая причина", prompt: "Why is the speaker late?", audioText: "I missed the bus because I left home late.", options: ["They missed the bus", "They lost a book", "They were ill", "They forgot the lesson"], answer: "They missed the bus" }),
];
