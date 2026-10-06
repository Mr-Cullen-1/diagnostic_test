"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PlatformButton from "./platform-button";
import { enforceOneLevelDowngrade } from "./english-placement-policy";
import {
  domainNames,
  englishTestItemsKidsA1,
  levelDefinitions,
  levelOrder,
  localText,
} from "./english-test-items-kids-a1";
import { englishTestItemsA2B1 } from "./english-test-items-a2-b1(1)";
import { englishTestItemsB2 } from "./english-test-items-b2";
import { englishTestItemsFoundation } from "./english-test-items-foundation";
import {
  evaluateInitialLane,
  getEnglishPlacementLane,
  getLaneTestPlan,
  getSelfReportGroup,
  SELF_REPORT_OPTIONS,
} from "./english-placement-routing";

const placementLevelArt = {
  zero: "/placement-level-zero.png",
  words: "/placement-level-words.png",
  read: "/placement-level-read.png",
  simpleTalk: "/placement-level-simple-talk.png",
  hesitantTalk: "/placement-level-hesitant-talk.png",
  fluent: "/placement-level-fluent.png",
};

export const englishPlacementItems = [
  ...englishTestItemsKidsA1,
  ...englishTestItemsFoundation,
  ...englishTestItemsA2B1,
  ...englishTestItemsB2,
];

export const PLACEMENT_TOTAL = 15;
export const START_TOTAL = 15;
export const ADAPTIVE_TOTAL = 0;

const PLACEMENT_SECTIONS = [
  { stage: "screen", total: START_TOTAL },
];

const LEVEL_INDEX = Object.fromEntries(levelOrder.map((level, index) => [level, index]));
const LEVEL_LABEL = {
  preA1: "Pre-A1",
  Foundation: "Foundation",
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
};

const RESULT_LEVEL_LABEL = {
  ...LEVEL_LABEL,
  preA1: "Kids",
};

const SELF_REPORT_COPY = {
  ru: {
    title: "Как вы оцениваете свой английский?",
    text: "Выберите вариант, который лучше всего описывает вас. Это поможет подобрать подходящие вопросы.",
    options: {
      zero: "Я начинаю с нуля",
      words: "Я знаю отдельные слова и простые фразы",
      read: "Я могу читать простые слова и короткие тексты",
      simpleTalk: "Я могу свободно написать 2–3 предложения, допуская лишь небольшие грамматические ошибки",
      hesitantTalk: "Я могу немного рассказать о знакомой теме, но говорю с паузами и не всегда уверенно",
      fluent: "Я свободно говорю и понимаю английский",
    },
    continue: "Продолжить",
  },
  uz: {
    title: "Ingliz tilingizni qanday baholaysiz?",
    text: "Sizni eng yaxshi tasvirlaydigan variantni tanlang. Bu mos savollarni tanlashga yordam beradi.",
    options: {
      zero: "Men ingliz tilini noldan boshlayman",
      words: "Men alohida so'zlar va oddiy iboralarni bilaman",
      read: "Men oddiy so'zlar va qisqa matnlarni o'qiy olaman",
      simpleTalk: "Men 2–3 ta gapni erkin yoza olaman va faqat kichik grammatik xatolarga yo‘l qo‘yaman",
      hesitantTalk: "Men tanish mavzu haqida biroz gapira olaman, lekin pauza qilaman va har doim ham ishonchli emasman",
      fluent: "Men ingliz tilida erkin gaplashaman va tushunaman",
    },
    continue: "Davom etish",
  },
};

const ADAPTIVE_DOMAIN_BLOCKS = [
  ["languageUse", "languageUse", "reading", "listening"],
  ["languageUse", "reading", "reading", "listening"],
  ["languageUse", "reading", "listening", "listening"],
  ["languageUse", "languageUse", "reading", "listening"],
];

const ADAPTIVE_DIFFICULTY_BLOCKS = [
  [1, 2, 2, 3],
  [2, 2, 3, 1],
  [2, 3, 1, 2],
  [3, 2, 2, 1],
];

// 5 lower + 5 upper. Combined domain total: 4 languageUse, 3 reading, 3 listening.
const ITEMS_PER_LEVEL_DOMAIN = 10;
// Every level can be either side of the final pair, so keep two unused items
// in each domain until the confirmation stage.
const CONFIRMATION_RESERVE_PER_DOMAIN = 2;

const CONFIRMATION_SLOTS = [
  { side: "lower", domain: "languageUse", difficulty: 2 },
  { side: "upper", domain: "languageUse", difficulty: 1 },
  { side: "lower", domain: "reading", difficulty: 2 },
  { side: "upper", domain: "listening", difficulty: 2 },
  { side: "lower", domain: "listening", difficulty: 2 },
  { side: "upper", domain: "reading", difficulty: 2 },
  { side: "lower", domain: "languageUse", difficulty: 3 },
  { side: "upper", domain: "languageUse", difficulty: 3 },
  { side: "lower", domain: "reading", difficulty: 3 },
  { side: "upper", domain: "listening", difficulty: 3 },
];

const copy = {
  ru: {
    eyebrow: "Английский · адаптивный Placement",
    introTitle: "Узнай, с какого курса лучше начать",
    introText: "Тест сам подберёт сложность. До 40 заданий в трёх частях.",
    introNote: "Уровень и школьный класс выбирать не нужно — система определит точку старта по ответам.",
    start: "Начать тест",
    resume: "Продолжить тест",
    exit: "Завершить тест",
    exitHint: "Если завершить тест сейчас, уровень не будет определён. Чтобы получить рекомендацию, нужно ответить на все вопросы.",
    exitConfirmTitle: "Завершить тест без результата?",
    cancel: "Продолжить тест",
    incompleteEyebrow: "Тест не завершён",
    incompleteTitle: "Уровень пока не определён",
    incompleteText: "Тест завершён до того, как были выполнены все необходимые задания, поэтому система не может надёжно определить уровень.",
    incompleteRetry: "Пройди тест заново и ответь на все вопросы, чтобы получить рекомендацию по курсу.",
    incompleteProgress: "Выполнено заданий: {count} из {total}",
    part: "Блок",
    ofParts: "из 3",
    question: "Задание",
    ofQuestions: "из 40",
    parts: {
      start: "Стартовая проверка",
      adaptive: "Адаптивная проверка",
      confirm: "Подтверждение границы",
    },
    sectionProgressFirst: "Прогресс первого блока",
    sectionProgressRemaining: "Прогресс двух оставшихся блоков",
    sectionProgressPart: "Блок {part}: {current} из {total}",
    checking: "Проверяем",
    previous: "Назад",
    previousHint: "Предыдущий вопрос",
    answer: "Ответить",
    dontKnow: "Не знаю",
    saved: "Ответ сохранён",
    empty: "Сначала выбери, введи или собери ответ.",
    writePlaceholder: "Напиши ответ на английском",
    build: "Собери предложение",
    reset: "Сбросить",
    soundTitle: "Сначала проверим звук",
    soundText: "Аудирование важно для результата. Нажми кнопку и убедись, что слышишь фразу.",
    testSound: "Проверить звук",
    soundWorks: "Звук слышен — продолжить",
    soundProblem: "Звук не работает",
    continueWithError: "Продолжить с отметкой ошибки",
    audioErrorText: "Система отметит техническую ошибку, а уверенность результата будет снижена.",
    listen: "Прослушать",
    replay: "Прослушать ещё раз",
    playsLeft: "Осталось прослушиваний: {count}",
    audioLimit: "Запись уже прослушана два раза.",
    resultEyebrow: "Placement завершён",
    resultTitle: "Подходящая точка старта найдена",
    yourLevel: "Твой уровень",
    recommended: "Рекомендуемый курс",
    confidence: "Уверенность результата",
    correctAnswers: "Правильных ответов: {score} из {total}",
    high: "высокая",
    medium: "средняя",
    borderline: "Ты близко к уровню {level}, но безопаснее начать с {current}.",
    strong: "Сильнее всего",
    improve: "Стоит потренировать",
    noStrong: "Нет навыка с устойчивым результатом 70%+.",
    noImprove: "Критичных пробелов по проверенным навыкам не обнаружено.",
    answered: "Отвечено: {count} из {total}",
    b2Note: "B2 здесь — рекомендация точки старта курса, а не официальный сертификат CEFR.",
    preA1NoAge: "После уточнения возраста: Kids до 10 лет включительно или A1 Foundation для старших учеников.",
    retake: "Пройти заново",
    courses: "К выбору курса",
    technicalFlag: "В попытке есть технический или противоречивый сигнал, поэтому уверенность снижена.",
  },
  uz: {
    eyebrow: "Ingliz tili · moslashuvchan Placement",
    introTitle: "Qaysi kursdan boshlash yaxshiroq ekanini bilib oling",
    introText: "Test qiyinlikni o‘zi moslaydi. Uch qismda 40 tagacha topshiriq bor.",
    introNote: "Daraja va maktab sinfini tanlash shart emas — tizim boshlash nuqtasini javoblar asosida aniqlaydi.",
    start: "Testni boshlash",
    resume: "Testni davom ettirish",
    exit: "Testni yakunlash",
    exitHint: "Testni hozir yakunlasangiz, darajangiz aniqlanmaydi. Tavsiya olish uchun barcha savollarga javob berish kerak.",
    exitConfirmTitle: "Testni natijasiz yakunlaysizmi?",
    cancel: "Testni davom ettirish",
    incompleteEyebrow: "Test yakunlanmadi",
    incompleteTitle: "Darajangiz hali aniqlanmadi",
    incompleteText: "Siz barcha kerakli savollarga javob bermasdan testni yakunladingiz, shuning uchun tizim darajangizni ishonchli aniqlay olmaydi.",
    incompleteRetry: "Kurs bo‘yicha tavsiya olish uchun testni qayta boshlang va barcha savollarga javob bering.",
    incompleteProgress: "Bajarilgan topshiriqlar: {count} / {total}",
    part: "Blok",
    ofParts: "/ 3",
    question: "Topshiriq",
    ofQuestions: "/ 40",
    parts: {
      start: "Boshlang‘ich tekshiruv",
      adaptive: "Moslashuvchan tekshiruv",
      confirm: "Chegarani tasdiqlash",
    },
    sectionProgressFirst: "Birinchi blok jarayoni",
    sectionProgressRemaining: "Qolgan ikki blok jarayoni",
    sectionProgressPart: "{part}-blok: {current} / {total}",
    checking: "Tekshirilmoqda",
    previous: "Ortga",
    previousHint: "Oldingi savol",
    answer: "Javob berish",
    dontKnow: "Bilmayman",
    saved: "Javob saqlandi",
    empty: "Avval javobni tanlang, kiriting yoki tuzing.",
    writePlaceholder: "Javobni ingliz tilida yozing",
    build: "Gapni tuzing",
    reset: "Tozalash",
    soundTitle: "Avval ovozni tekshiramiz",
    soundText: "Tinglab tushunish natija uchun muhim. Tugmani bosing va gapni eshitayotganingizga ishonch hosil qiling.",
    testSound: "Ovozni tekshirish",
    soundWorks: "Ovoz eshitildi — davom etish",
    soundProblem: "Ovoz ishlamayapti",
    continueWithError: "Xato belgisi bilan davom etish",
    audioErrorText: "Tizim texnik xatoni belgilaydi va natija ishonchliligi pasayadi.",
    listen: "Tinglash",
    replay: "Yana tinglash",
    playsLeft: "Qolgan tinglashlar: {count}",
    audioLimit: "Yozuv ikki marta tinglandi.",
    resultEyebrow: "Placement yakunlandi",
    resultTitle: "Mos boshlash nuqtasi topildi",
    yourLevel: "Sizning darajangiz",
    recommended: "Tavsiya etilgan kurs",
    confidence: "Natija ishonchliligi",
    correctAnswers: "To‘g‘ri javoblar: {score} / {total}",
    high: "yuqori",
    medium: "o‘rta",
    borderline: "Siz {level} darajasiga yaqinsiz, ammo {current} dan boshlash xavfsizroq.",
    strong: "Eng kuchli yo‘nalish",
    improve: "Mashq qilish kerak",
    noStrong: "70%+ barqaror natija ko‘rsatgan yo‘nalish yo‘q.",
    noImprove: "Tekshirilgan ko‘nikmalarda jiddiy bo‘shliq topilmadi.",
    answered: "Javob berildi: {count} / {total}",
    b2Note: "Bu yerdagi B2 — kursni boshlash tavsiyasi, rasmiy CEFR sertifikati emas.",
    preA1NoAge: "Yosh aniqlangach: 10 yoshgacha Kids, kattaroq o‘quvchilar uchun A1 Foundation.",
    retake: "Qayta topshirish",
    courses: "Kurs tanlashga",
    technicalFlag: "Urinishda texnik yoki qarama-qarshi signal bor, shuning uchun ishonchlilik pasaytirildi.",
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function elapsedSince(timestamp) {
  return Math.max(0, Date.now() - timestamp);
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededOrder(seed, key) {
  return hashString(`${seed}:${key}`);
}

function seededShuffle(values, seed, salt) {
  return [...values].sort(
    (left, right) =>
      seededOrder(seed, `${salt}:${JSON.stringify(left)}`) -
      seededOrder(seed, `${salt}:${JSON.stringify(right)}`)
  );
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "");
}

function oneLevelUp(level) {
  return levelOrder[clamp(LEVEL_INDEX[level] + 1, 0, levelOrder.length - 1)];
}

function oneLevelDown(level) {
  return levelOrder[clamp(LEVEL_INDEX[level] - 1, 0, levelOrder.length - 1)];
}

function levelAccuracy(stat) {
  return stat?.total ? stat.correct / stat.total : 0;
}

function makeEmptyStats() {
  return Object.fromEntries(
    levelOrder.map((level) => [level, { level, correct: 0, total: 0, accuracy: 0 }])
  );
}

export function calculateLevelStats(responses) {
  const stats = makeEmptyStats();
  responses.forEach((response) => {
    if (!stats[response.level]) return;
    stats[response.level].total += 1;
    if (response.correct) stats[response.level].correct += 1;
  });
  levelOrder.forEach((level) => {
    stats[level].accuracy = levelAccuracy(stats[level]);
  });
  return stats;
}

export function calculateSkillStats(responses) {
  return Object.keys(domainNames).reduce((accumulator, domain) => {
    const domainResponses = responses.filter((response) => response.domain === domain);
    const correct = domainResponses.filter((response) => response.correct).length;
    accumulator[domain] = {
      correct,
      total: domainResponses.length,
      accuracy: domainResponses.length ? correct / domainResponses.length : 0,
    };
    return accumulator;
  }, {});
}

export function getStartProbe(startResponses) {
  const A1Responses = startResponses.filter((response) => response.level === "A1");
  const A2Responses = startResponses.filter((response) => response.level === "A2");
  const A1Correct = A1Responses.filter((response) => response.correct).length;
  const A2Correct = A2Responses.filter((response) => response.correct).length;

  let probeLevel = "A1";
  let inconsistent = false;

  if (A1Correct <= 2) {
    probeLevel = "preA1";
  } else if (A2Correct <= 2) {
    probeLevel = "A1";
  } else if (A1Correct >= 6 && A2Correct >= 6) {
    probeLevel = "B1";
  } else if (A1Correct >= 5 && A2Correct >= 3) {
    probeLevel = "A2";
  } else {
    // The TZ requires a lower safe point when results are contradictory or weakly supported.
    probeLevel = "A1";
    inconsistent = true;
  }

  if (A2Correct > A1Correct + 1) inconsistent = true;
  if (A1Correct < 5 && A2Correct >= 3) inconsistent = true;

  return {
    probeLevel,
    inconsistent,
    startStats: {
      A1: { correct: A1Correct, total: A1Responses.length },
      A2: { correct: A2Correct, total: A2Responses.length },
    },
  };
}

function adaptiveLevelComposition(probeLevel) {
  if (probeLevel === "preA1") return ["preA1", "preA1", "preA1", "A1"];
  if (probeLevel === "B2") return ["B1", "B2", "B2", "B2"];
  return [oneLevelDown(probeLevel), probeLevel, probeLevel, oneLevelUp(probeLevel)];
}

function countUsedByLevelDomain(itemBank, usedIds) {
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds);
  const counts = {};
  itemBank.forEach((item) => {
    if (!used.has(item.id)) return;
    const key = `${item.level}:${item.domain}`;
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return counts;
}

function uniquePermutations(values) {
  const results = [];
  const build = (remaining, current) => {
    if (!remaining.length) {
      results.push(current);
      return;
    }
    const seen = new Set();
    remaining.forEach((value, index) => {
      if (seen.has(value)) return;
      seen.add(value);
      build(
        remaining.filter((_, remainingIndex) => remainingIndex !== index),
        [...current, value]
      );
    });
  };
  build(values, []);
  return results;
}

function chooseAdaptiveLevelAssignment({
  itemBank,
  usedIds,
  composition,
  domains,
  seed,
  salt,
}) {
  const usedCounts = countUsedByLevelDomain(itemBank, usedIds);
  const maximumBeforeConfirmation =
    ITEMS_PER_LEVEL_DOMAIN - CONFIRMATION_RESERVE_PER_DOMAIN;

  const valid = uniquePermutations(composition).filter((assignment) => {
    const projected = { ...usedCounts };
    for (let slotIndex = 0; slotIndex < assignment.length; slotIndex += 1) {
      const key = `${assignment[slotIndex]}:${domains[slotIndex]}`;
      projected[key] = (projected[key] ?? 0) + 1;
      if (projected[key] > maximumBeforeConfirmation) return false;
    }
    return true;
  });

  if (!valid.length) {
    throw new Error(
      `No adaptive level assignment can preserve the confirmation reserve for ${salt}.`
    );
  }

  return valid.sort(
    (left, right) =>
      seededOrder(seed, `${salt}:${left.join("|")}`) -
      seededOrder(seed, `${salt}:${right.join("|")}`)
  )[0];
}

function pickItem(itemBank, usedIds, spec, seed, salt) {
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds);
  const candidates = itemBank.filter(
    (item) =>
      !used.has(item.id) &&
      item.level === spec.level &&
      item.domain === spec.domain
  );

  if (!candidates.length) {
    throw new Error(
      `English Placement item bank is exhausted for ${spec.level}/${spec.domain}.`
    );
  }

  return [...candidates].sort((left, right) => {
    const leftDistance = Math.abs((left.difficulty ?? 2) - spec.difficulty);
    const rightDistance = Math.abs((right.difficulty ?? 2) - spec.difficulty);
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    return (
      seededOrder(seed, `${salt}:${left.id}`) -
      seededOrder(seed, `${salt}:${right.id}`)
    );
  })[0];
}

export function buildAdaptiveBlock({
  itemBank = englishPlacementItems,
  usedIds,
  probeLevel,
  blockIndex,
  seed,
}) {
  const domains = ADAPTIVE_DOMAIN_BLOCKS[blockIndex];
  const levels = chooseAdaptiveLevelAssignment({
    itemBank,
    usedIds,
    composition: adaptiveLevelComposition(probeLevel),
    domains,
    seed,
    salt: `adaptive-levels-${blockIndex}-${probeLevel}`,
  });
  const difficulties = ADAPTIVE_DIFFICULTY_BLOCKS[blockIndex];
  const localUsed = new Set(usedIds);
  const items = [];

  domains.forEach((domain, slotIndex) => {
    const item = pickItem(
      itemBank,
      localUsed,
      {
        level: levels[slotIndex],
        domain,
        difficulty: difficulties[slotIndex],
      },
      seed,
      `adaptive-${blockIndex}-${slotIndex}`
    );
    localUsed.add(item.id);
    items.push(item);
  });

  return items;
}

export function classifyAdaptiveBlock(correctCount) {
  if (correctCount >= 3) return "S";
  if (correctCount === 2) return "M";
  return "W";
}

export function updateProbeAfterBlock(probeLevel, blockResult) {
  if (blockResult === "S") return oneLevelUp(probeLevel);
  if (blockResult === "W") return oneLevelDown(probeLevel);
  return probeLevel;
}

function isSupportedLevel(level, stats) {
  const stat = stats[level];
  if (!stat || stat.total < 4 || stat.accuracy < 0.6) return false;
  const rank = LEVEL_INDEX[level];
  if (rank === 0) return true;
  const lower = stats[levelOrder[rank - 1]];
  if (lower?.total > 0 && lower.accuracy < 0.7) return false;
  return true;
}

export function getSupportedLevels(responses) {
  const stats = calculateLevelStats(responses);
  const supported = levelOrder.filter((level) => isSupportedLevel(level, stats));
  return { stats, supported };
}

export function getConfirmationPair(first30Responses) {
  const { stats, supported } = getSupportedLevels(first30Responses);
  const highest = [...supported].sort(
    (left, right) => LEVEL_INDEX[right] - LEVEL_INDEX[left]
  )[0];

  let pair;
  if (!supported.includes("A1")) pair = ["preA1", "A1"];
  else if (highest === "A1") pair = ["A1", "A2"];
  else if (highest === "A2") pair = ["A2", "B1"];
  else pair = ["B1", "B2"];

  return { pair, supported, stats, highestSupported: highest ?? null };
}

export function buildConfirmationItems({
  itemBank = englishPlacementItems,
  usedIds,
  pair,
  seed,
}) {
  const [lower, upper] = pair;
  const localUsed = new Set(usedIds);
  return CONFIRMATION_SLOTS.map((slot, slotIndex) => {
    const item = pickItem(
      itemBank,
      localUsed,
      {
        level: slot.side === "lower" ? lower : upper,
        domain: slot.domain,
        difficulty: slot.difficulty,
      },
      seed,
      `confirm-${lower}-${upper}-${slotIndex}`
    );
    localUsed.add(item.id);
    return item;
  });
}

const ROUTE_DOMAIN_PATTERN = [
  ["languageUse", "reading", "listening", "languageUse", "reading", "listening"],
  ["reading", "languageUse", "listening", "reading", "languageUse", "listening"],
  ["languageUse", "reading", "listening"],
];

export function buildLaneItems({ itemBank = englishPlacementItems, lane, seed }) {
  const usedIds = new Set();
  return getLaneTestPlan(lane).flatMap(({ level, count }, groupIndex) =>
    Array.from({ length: count }, (_, itemIndex) => {
      const item = pickItem(
        itemBank,
        usedIds,
        {
          level,
          domain: ROUTE_DOMAIN_PATTERN[groupIndex][itemIndex],
          difficulty: (itemIndex % 3) + 1,
        },
        seed,
        `lane-${lane.kind}-${groupIndex}-${itemIndex}`
      );
      usedIds.add(item.id);
      return item;
    })
  );
}

function buildPlacementResult({
  placementLevel,
  responses,
  session,
  confidence = "medium",
  borderlineWith = null,
  completionType = "FULL_PLACEMENT",
}) {
  const tooFastCount = responses.filter((response) => response.tooFast).length;
  const technicalIssue = Boolean(session.flags?.audioError || tooFastCount >= 4);
  return {
    placementLevel,
    recommendedCourse: placementLevel === "preA1" ? "Kids" : placementLevel,
    confidence: technicalIssue ? "medium" : confidence,
    borderlineWith,
    answeredCount: responses.length,
    totalQuestions: session.totalQuestions ?? responses.length,
    score: responses.filter((response) => response.correct).length,
    levelStats: calculateLevelStats(responses),
    skillStats: calculateSkillStats(responses),
    completionType,
    flags: { ...session.flags, tooFastCount },
    responses,
  };
}

function routeCourse(placementLevel, studentAge) {
  if (placementLevel !== "preA1") return placementLevel;
  if (Number.isFinite(studentAge)) {
    return studentAge <= 10 ? "Kids" : "A1 Foundation";
  }
  return "Pre-A1 route";
}

export function decideEarlyKidsResult({
  responses,
  startStats,
  startInconsistent = false,
  attemptFlags = {},
}) {
  const levelStats = calculateLevelStats(responses);
  const skillStats = calculateSkillStats(responses);
  const tooFastCount = responses.filter((response) => response.tooFast).length;
  const audioError = Boolean(attemptFlags.audioError);
  const confidence =
    startInconsistent || audioError || tooFastCount >= 4 ? "medium" : "high";

  return {
    placementLevel: "preA1",
    recommendedCourse: "Kids",
    confidence,
    borderlineWith: null,
    answeredCount: responses.length,
    totalQuestions: responses.length,
    score: responses.filter((response) => response.correct).length,
    adaptivePath: [],
    startStats,
    confirmStats: {},
    levelStats,
    skillStats,
    confirmationPair: null,
    reasonCode: "START_KIDS_EARLY_EXIT",
    completionType: "SECTION_1_KIDS",
    endedEarly: false,
    flags: {
      startInconsistent,
      inconsistency: false,
      audioError,
      tooFastCount,
    },
    responses,
  };
}

function countConfirmByLevel(responses, level) {
  const selected = responses.filter(
    (response) => response.stage === "confirm" && response.level === level
  );
  return {
    correct: selected.filter((response) => response.correct).length,
    total: selected.length,
  };
}

export function decideFinalResult({
  responses,
  confirmationPair,
  adaptivePath = [],
  startStats,
  startInconsistent = false,
  preConfirmationProbe = null,
  studentAge,
  attemptFlags = {},
}) {
  const [lower, upper] = confirmationPair;
  const lowerConfirm = countConfirmByLevel(responses, lower);
  const upperConfirm = countConfirmByLevel(responses, upper);
  const levelStats = calculateLevelStats(responses);
  const skillStats = calculateSkillStats(responses);
  const upperOverall = levelStats[upper]?.accuracy ?? 0;

  let placementLevel = lower;
  let borderlineWith = null;
  let confidence = "high";
  let reasonCode = "LOWER_CONFIRMED";
  let inconsistency = false;

  if (
    lowerConfirm.correct >= 4 &&
    upperConfirm.correct >= 4 &&
    upperOverall >= 0.65
  ) {
    placementLevel = upper;
    reasonCode = "UPPER_CONFIRMED";
  } else if (lowerConfirm.correct >= 4 && upperConfirm.correct === 3) {
    placementLevel = lower;
    borderlineWith = upper;
    confidence = "medium";
    reasonCode = "BORDERLINE_UPPER_3_OF_5";
  } else if (
    lowerConfirm.correct >= 4 &&
    upperConfirm.correct >= 4 &&
    upperOverall < 0.65
  ) {
    placementLevel = lower;
    borderlineWith = upper;
    confidence = "medium";
    reasonCode = "UPPER_CONFIRM_STRONG_BUT_OVERALL_WEAK";
  } else if (lowerConfirm.correct >= 4 && upperConfirm.correct <= 2) {
    placementLevel = lower;
    reasonCode = "LOWER_CONFIRMED_UPPER_REJECTED";
  } else if (lowerConfirm.correct <= 3 && upperConfirm.correct <= 3) {
    placementLevel = lower;
    confidence = "medium";
    inconsistency = true;
    reasonCode = "PAIR_TOO_HIGH_CAPPED_AT_LOWER";
  } else if (lowerConfirm.correct <= 3 && upperConfirm.correct >= 4) {
    placementLevel = lower;
    confidence = "medium";
    inconsistency = true;
    reasonCode = "CONTRADICTORY_CONFIRMATION";
  } else {
    placementLevel = lower;
    confidence = "medium";
    reasonCode = "UNCLASSIFIED_SAFE_LOWER";
  }

  const downgradeDecision = enforceOneLevelDowngrade({
    placementLevel,
    referenceLevel: preConfirmationProbe,
    levelOrder,
  });
  if (downgradeDecision.applied) {
    placementLevel = downgradeDecision.placementLevel;
    borderlineWith = null;
    confidence = "medium";
    inconsistency = true;
    reasonCode = "ONE_LEVEL_DOWNGRADE_FLOOR";
  }

  const tooFastCount = responses.filter((response) => response.tooFast).length;
  const audioError = Boolean(attemptFlags.audioError);
  if (startInconsistent || inconsistency || audioError || tooFastCount >= 4) {
    confidence = "medium";
  }

  const recommendedCourse = routeCourse(placementLevel, studentAge);
  const score = responses.filter((response) => response.correct).length;

  return {
    placementLevel,
    recommendedCourse,
    confidence,
    borderlineWith,
    answeredCount: responses.length,
    totalQuestions: responses.length,
    score,
    adaptivePath,
    startStats,
    confirmStats: {
      [lower]: lowerConfirm,
      [upper]: upperConfirm,
    },
    levelStats,
    skillStats,
    confirmationPair,
    preConfirmationProbe,
    calculatedPlacementLevel: downgradeDecision.calculatedPlacementLevel,
    downgradeFloor: downgradeDecision.floorLevel,
    downgradeFloorApplied: downgradeDecision.applied,
    reasonCode,
    completionType: "FULL_PLACEMENT",
    flags: {
      startInconsistent,
      inconsistency,
      audioError,
      tooFastCount,
    },
    responses,
  };
}

export function validateEnglishPlacementBank(itemBank = englishPlacementItems) {
  const errors = [];
  const ids = new Set();

  if (itemBank.length !== 180) errors.push(`Expected 180 items, received ${itemBank.length}.`);

  itemBank.forEach((item) => {
    if (ids.has(item.id)) errors.push(`Duplicate item id: ${item.id}`);
    ids.add(item.id);
    if (!levelOrder.includes(item.level)) errors.push(`Invalid level in ${item.id}.`);
    if (!domainNames[item.domain]) errors.push(`Invalid domain in ${item.id}.`);
    if (![1, 2, 3].includes(item.difficulty)) errors.push(`Invalid difficulty in ${item.id}.`);
    if (["choice", "listening"].includes(item.type) && !item.options?.includes(item.answer)) {
      errors.push(`Answer is not present in options for ${item.id}.`);
    }
    if (item.type === "listening" && !item.audioText && !item.audioSrc) {
      errors.push(`Listening item ${item.id} has no audio source.`);
    }
  });

  levelOrder.forEach((level) => {
    const levelItems = itemBank.filter((item) => item.level === level);
    if (levelItems.length !== 30) errors.push(`${level} must contain 30 items.`);
    Object.keys(domainNames).forEach((domain) => {
      const domainItems = levelItems.filter((item) => item.domain === domain);
      if (domainItems.length !== 10) errors.push(`${level}/${domain} must contain 10 items.`);
      const expected = { 1: 3, 2: 4, 3: 3 };
      Object.keys(expected).forEach((difficulty) => {
        const actual = domainItems.filter(
          (item) => item.difficulty === Number(difficulty)
        ).length;
        if (actual !== expected[difficulty]) {
          errors.push(
            `${level}/${domain}/difficulty ${difficulty}: expected ${expected[difficulty]}, received ${actual}.`
          );
        }
      });
    });
  });

  if (errors.length) throw new Error(`Invalid English Placement bank:\n${errors.join("\n")}`);
  return true;
}

function createInitialSession(seed = Date.now()) {
  return {
    version: 8,
    phase: "self-report",
    seed,
    queue: [],
    currentIndex: 0,
    responses: [],
    probeLevel: null,
    adaptiveBlockIndex: 0,
    adaptivePath: [],
    confirmationPair: null,
    selfReport: null,
    selfReportGroup: null,
    lane: null,
    totalQuestions: 0,
    startStats: null,
    startInconsistent: false,
    soundReady: false,
    soundCheckPlayed: false,
    audioPlays: {},
    flags: { audioError: false },
    result: null,
    incomplete: null,
    navigationHistory: [],
    navigationFuture: [],
    startedAt: null,
  };
}

function snapshotSessionForNavigation(session) {
  const snapshot = { ...session };
  delete snapshot.navigationHistory;
  delete snapshot.navigationFuture;
  return snapshot;
}

function mergeAudioPlayCounts(previousCounts = {}, currentCounts = {}) {
  const merged = { ...previousCounts };
  Object.entries(currentCounts).forEach(([itemId, count]) => {
    merged[itemId] = Math.max(merged[itemId] ?? 0, count ?? 0);
  });
  return merged;
}

function safeLoadSession(storageKey, itemMap) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed?.version !== 8 ||
      ["result", "incomplete", "self-report"].includes(parsed?.phase)
    ) return null;
    const allIds = [...(parsed.queue ?? []), ...(parsed.responses ?? []).map((item) => item.itemId)];
    if (allIds.some((id) => !itemMap.has(id))) return null;
    return {
      ...parsed,
      navigationHistory: Array.isArray(parsed.navigationHistory)
        ? parsed.navigationHistory
        : [],
      navigationFuture: Array.isArray(parsed.navigationFuture)
        ? parsed.navigationFuture
        : [],
    };
  } catch {
    return null;
  }
}

function saveSession(storageKey, session) {
  if (typeof window === "undefined") return;
  try {
    if (["self-report", "result", "incomplete"].includes(session.phase)) {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    }
  } catch {
    // Storage can be unavailable in private mode. The test still works in memory.
  }
}

function buildResponse({ session, item, answer, correct, skipped, answerTimeMs }) {
  const audioPlays = session.audioPlays[item.id] ?? 0;
  const tooFastThreshold =
    item.domain === "reading" ? 2500 : item.domain === "listening" ? 1200 : 700;
  const tooFast =
    !skipped &&
    (answerTimeMs < tooFastThreshold ||
      (item.type === "listening" && audioPlays === 0));

  return {
    itemId: item.id,
    level: item.level,
    difficulty: item.difficulty,
    domain: item.domain,
    type: item.type,
    stage: session.phase,
    blockIndex: session.phase === "adaptive" ? session.adaptiveBlockIndex : null,
    correct,
    skipped,
    answer,
    answerTimeMs,
    audioPlays,
    tooFast,
    answeredAt: new Date().toISOString(),
  };
}

function transitionAfterQueue({ session, responses }) {
  if (session.phase === "screen") {
    const decision = evaluateInitialLane({ lane: session.lane, responses });
    return {
      ...session,
      phase: "result",
      queue: [],
      currentIndex: 0,
      responses,
      result: buildPlacementResult({
        placementLevel: decision.placementLevel,
        responses,
        session,
        confidence: decision.confidence,
      }),
    };
  }

  return { ...session, responses };
}

function advanceSession({ session, response }) {
  const responses = [...session.responses, response];
  const hasNextInQueue = session.currentIndex + 1 < session.queue.length;

  if (hasNextInQueue) {
    return {
      ...session,
      responses,
      currentIndex: session.currentIndex + 1,
    };
  }

  return transitionAfterQueue({ session, responses });
}

function isCorrectAnswer(item, answer) {
  if (item.type === "sequence") {
    return (
      Array.isArray(answer) &&
      Array.isArray(item.answer) &&
      answer.length === item.answer.length &&
      answer.every((token, index) => token === item.answer[index])
    );
  }

  if (item.type === "text") {
    const accepted = Array.isArray(item.answer) ? item.answer : [item.answer];
    return accepted.some((candidate) => normalizeText(candidate) === normalizeText(answer));
  }

  return answer === item.answer;
}

function optionLabel(option) {
  return typeof option === "string" ? option : option?.text ?? "";
}

export function getPlacementSectionProgress(session) {
  const responses = session.responses ?? [];
  const activeStage = session.phase === "screen" ? "screen" : null;
  const visibleSections = PLACEMENT_SECTIONS;

  return visibleSections.map(({ stage, total }) => {
    const partNumber = PLACEMENT_SECTIONS.findIndex((section) => section.stage === stage) + 1;
    const completed = responses.filter((response) => response.stage === stage).length;
    const current = Math.min(total, completed + (activeStage === stage ? 1 : 0));

    return {
      stage,
      partNumber,
      total,
      current,
      percent: total ? (current / total) * 100 : 0,
      isActive: activeStage === stage,
      isComplete: completed >= total,
    };
  });
}

function PlacementSectionProgress({ session, t, variant = "test" }) {
  const sections = getPlacementSectionProgress(session);
  const progressGroupLabel =
    sections.length === 1 ? t.sectionProgressFirst : t.sectionProgressRemaining;

  return (
    <div
      className={`english-section-progress english-section-progress-${variant} english-section-progress-count-${sections.length}`}
      aria-label={progressGroupLabel}
    >
      {sections.map((section) => {
        const stateClass = section.isActive
          ? "is-active"
          : section.isComplete
            ? "is-complete"
            : "is-upcoming";
        const progressLabel = t.sectionProgressPart
          .replace("{part}", String(section.partNumber))
          .replace("{current}", String(section.current))
          .replace("{total}", String(section.total));

        return (
          <div
            key={section.stage}
            className={`english-section-progress-item ${stateClass}`}
          >
            <span className="english-section-progress-number" aria-hidden="true">
              {section.partNumber}
            </span>
            <span
              className="english-section-progress-track"
              role="progressbar"
              aria-label={progressLabel}
              aria-valuemin={0}
              aria-valuemax={section.total}
              aria-valuenow={section.current}
            >
              <span style={{ width: `${section.percent}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function EnglishDiagnostic({
  locale = "ru",
  studentAge,
  storageKey = "english-placement-v7",
  attemptSeed = undefined,
  itemBank = englishPlacementItems,
  onHome = () => {},
  onProgress = undefined,
  onComplete = undefined,
}) {
  const t = copy[locale] ?? copy.ru;
  const selfReportText = SELF_REPORT_COPY[locale] ?? SELF_REPORT_COPY.ru;
  const itemMap = useMemo(
    () => new Map(itemBank.map((item) => [item.id, item])),
    [itemBank]
  );
  const [session, setSession] = useState(() => {
    const map = new Map(itemBank.map((item) => [item.id, item]));
    return (
      safeLoadSession(storageKey, map) ??
      createInitialSession(attemptSeed ?? Date.now())
    );
  });
  const [choiceDraft, setChoiceDraft] = useState("");
  const [textDraft, setTextDraft] = useState("");
  const [sequenceDraft, setSequenceDraft] = useState([]);
  const [selfReportDraft, setSelfReportDraft] = useState("read");
  const [message, setMessage] = useState("");
  const [soundProblemOpen, setSoundProblemOpen] = useState(false);
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const questionStartedAtRef = useRef(0);
  const completionReportedRef = useRef(false);
  const messageTimerRef = useRef(null);

  useEffect(() => {
    validateEnglishPlacementBank(itemBank);
  }, [itemBank]);

  useEffect(() => {
    saveSession(storageKey, session);
  }, [storageKey, session]);

  const currentItem = session.queue.length
    ? itemMap.get(session.queue[session.currentIndex])
    : null;

  useEffect(() => {
    if (currentItem) questionStartedAtRef.current = Date.now();
  }, [currentItem]);

  useEffect(() => {
    if (
      session.phase !== "result" ||
      !session.result ||
      completionReportedRef.current
    ) return;
    completionReportedRef.current = true;
    onComplete?.(session.result);
  }, [session.phase, session.result, onComplete]);

  useEffect(
    () => () => {
      if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    },
    []
  );

  const shuffledOptions = currentItem?.options
    ? seededShuffle(currentItem.options, session.seed, `options-${currentItem.id}`)
    : [];

  const partNumber = session.phase === "confirm" ? 2 : 1;
  const questionNumber = session.responses.length + 1;
  const questionTotal = session.totalQuestions || START_TOTAL;
  const currentPartTitle = session.phase === "confirm" ? t.parts.confirm : t.parts.start;
  const currentDomain = currentItem ? localText(domainNames[currentItem.domain], locale) : "";
  const currentInstruction = currentItem ? localText(currentItem.instruction, locale) : "";
  const currentPrompt = currentItem ? localText(currentItem.prompt, locale) : "";
  const audioPlayCount = currentItem ? session.audioPlays[currentItem.id] ?? 0 : 0;
  const navigationHistory = session.navigationHistory ?? [];
  const previousNavigationEntry = navigationHistory[navigationHistory.length - 1] ?? null;
  const canGoToPreviousQuestion = Boolean(
    previousNavigationEntry &&
      previousNavigationEntry.before?.phase === session.phase
  );

  function showSavedMessage() {
    setMessage(t.saved);
    if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current);
    messageTimerRef.current = window.setTimeout(() => setMessage(""), 700);
  }

  function resetAnswerDrafts() {
    setChoiceDraft("");
    setTextDraft("");
    setSequenceDraft([]);
    setMessage("");
  }

  function hydrateAnswerDraft(response) {
    setChoiceDraft("");
    setTextDraft("");
    setSequenceDraft([]);
    setMessage("");

    if (!response || response.skipped || response.answer == null) return;
    const item = itemMap.get(response.itemId);
    if (!item) return;

    if (item.type === "text") {
      setTextDraft(String(response.answer));
    } else if (item.type === "sequence") {
      setSequenceDraft(Array.isArray(response.answer) ? [...response.answer] : []);
    } else {
      setChoiceDraft(String(response.answer));
    }
  }

  function goToPreviousQuestion() {
    if (!canGoToPreviousQuestion || !previousNavigationEntry) return;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const restored = previousNavigationEntry.before;
    const nextSession = {
      ...restored,
      soundReady: Boolean(restored.soundReady || session.soundReady),
      soundCheckPlayed: Boolean(restored.soundCheckPlayed || session.soundCheckPlayed),
      audioPlays: mergeAudioPlayCounts(restored.audioPlays, session.audioPlays),
      flags: {
        ...restored.flags,
        audioError: Boolean(restored.flags?.audioError || session.flags?.audioError),
      },
      navigationHistory: navigationHistory.slice(0, -1),
      navigationFuture: [
        previousNavigationEntry,
        ...(session.navigationFuture ?? []),
      ],
    };

    hydrateAnswerDraft(previousNavigationEntry.response);
    setSession(nextSession);
    onProgress?.({
      status: "in_progress",
      answeredCount: nextSession.responses.length,
      responses: nextSession.responses,
      phase: nextSession.phase,
      navigation: "back",
    });
  }

  function beginTest(selfReport) {
    const lane = getEnglishPlacementLane({ age: studentAge, selfReport });
    const seed = attemptSeed ?? session.seed;
    completionReportedRef.current = false;
    resetAnswerDrafts();
    if (lane.kind === "directKids") {
      const directSession = {
        ...createInitialSession(seed),
        phase: "result",
        selfReport,
        selfReportGroup: getSelfReportGroup(selfReport),
        lane,
        result: buildPlacementResult({
          placementLevel: "preA1",
          responses: [],
          session: { flags: { audioError: false }, totalQuestions: 0 },
          confidence: "high",
          completionType: "SELF_REPORT_KIDS",
        }),
      };
      setSession(directSession);
      return;
    }
    const laneItems = buildLaneItems({ itemBank, lane, seed });
    setSession({
      ...createInitialSession(seed),
      phase: "screen",
      queue: laneItems.map((item) => item.id),
      selfReport,
      selfReportGroup: getSelfReportGroup(selfReport),
      lane,
      totalQuestions: START_TOTAL,
      startedAt: new Date().toISOString(),
    });
  }

  function resetTest() {
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
    completionReportedRef.current = false;
    resetAnswerDrafts();
    setSession(createInitialSession(attemptSeed ?? Date.now()));
  }

  function exitTest() {
    setExitConfirmationOpen(false);
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const incompleteSession = {
      ...session,
      phase: "incomplete",
      queue: [],
      currentIndex: 0,
      result: null,
      incomplete: {
        reasonCode: "STUDENT_EXITED_BEFORE_COMPLETION",
        answeredCount: session.responses.length,
        totalQuestions: session.totalQuestions || START_TOTAL,
        endedAt: new Date().toISOString(),
      },
      navigationHistory: [],
      navigationFuture: [],
    };
    resetAnswerDrafts();
    completionReportedRef.current = false;
    setSession(incompleteSession);
    onProgress?.({
      status: "incomplete",
      phase: "incomplete",
      reasonCode: incompleteSession.incomplete.reasonCode,
      answeredCount: incompleteSession.responses.length,
      responses: incompleteSession.responses,
    });
  }

  function playSpeech(text, { test = false } = {}) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSoundProblemOpen(true);
      setSession((current) => ({
        ...current,
        flags: { ...current.flags, audioError: true },
      }));
      return false;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";
      utterance.rate = test ? 0.9 : 0.92;
      utterance.onerror = () => {
        setSoundProblemOpen(true);
        setSession((current) => ({
          ...current,
          flags: { ...current.flags, audioError: true },
        }));
      };
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      setSoundProblemOpen(true);
      setSession((current) => ({
        ...current,
        flags: { ...current.flags, audioError: true },
      }));
      return false;
    }
  }

  function runSoundCheck() {
    const success = playSpeech(
      "This is a sound check. If you can hear me, press the button below.",
      { test: true }
    );
    if (success) {
      setSession((current) => ({ ...current, soundCheckPlayed: true }));
    }
  }

  function confirmSound() {
    setSoundProblemOpen(false);
    setSession((current) => ({ ...current, soundReady: true }));
  }

  function continueWithAudioError() {
    setSoundProblemOpen(false);
    setSession((current) => ({
      ...current,
      soundReady: true,
      flags: { ...current.flags, audioError: true },
    }));
  }

  function playCurrentAudio() {
    if (!currentItem || currentItem.type !== "listening" || audioPlayCount >= 2) return;

    let success = false;
    if (currentItem.audioSrc && typeof window !== "undefined") {
      try {
        const audio = new Audio(currentItem.audioSrc);
        audio.onerror = () => {
          setSoundProblemOpen(true);
          setSession((current) => ({
            ...current,
            flags: { ...current.flags, audioError: true },
          }));
        };
        void audio.play();
        success = true;
      } catch {
        success = false;
      }
    } else {
      success = playSpeech(currentItem.audioText);
    }

    if (success) {
      setSession((current) => ({
        ...current,
        audioPlays: {
          ...current.audioPlays,
          [currentItem.id]: (current.audioPlays[currentItem.id] ?? 0) + 1,
        },
      }));
    }
  }

  function currentAnswer() {
    if (!currentItem) return null;
    if (currentItem.type === "text") return textDraft;
    if (currentItem.type === "sequence") return sequenceDraft;
    return choiceDraft;
  }

  function answerIsComplete() {
    if (!currentItem) return false;
    if (currentItem.type === "text") return textDraft.trim().length > 0;
    if (currentItem.type === "sequence") {
      return sequenceDraft.length === currentItem.answer.length;
    }
    return choiceDraft.length > 0;
  }

  function submitAnswer({ skipped = false } = {}) {
    if (!currentItem) return;
    if (!skipped && !answerIsComplete()) {
      setMessage(t.empty);
      return;
    }

    const answer = skipped ? null : currentAnswer();
    const correct = skipped ? false : isCorrectAnswer(currentItem, answer);
    const answerTimeMs = elapsedSince(questionStartedAtRef.current);
    const response = buildResponse({
      session,
      item: currentItem,
      answer,
      correct,
      skipped,
      answerTimeMs,
    });
    const sessionBeforeAnswer = snapshotSessionForNavigation(session);
    const currentFutureEntry = (session.navigationFuture ?? [])[0] ?? null;
    const isRevisitedQuestion = currentFutureEntry?.response?.itemId === currentItem.id;
    const canKeepFutureAnswers = isRevisitedQuestion;
    const advancedSession = advanceSession({
      session: sessionBeforeAnswer,
      response,
    });
    const remainsInCurrentSection = advancedSession.phase === session.phase;
    let navigationFuture = canKeepFutureAnswers
      ? (session.navigationFuture ?? []).slice(1)
      : [];

    if (remainsInCurrentSection && navigationFuture.length) {
      const nextItemId = advancedSession.queue[advancedSession.currentIndex];
      if (
        navigationFuture[0]?.response?.itemId !== nextItemId ||
        navigationFuture[0]?.before?.phase !== advancedSession.phase
      ) {
        navigationFuture = [];
      }
    }

    const nextSession = {
      ...advancedSession,
      navigationHistory: remainsInCurrentSection
        ? [
            ...(session.navigationHistory ?? []),
            { before: sessionBeforeAnswer, response },
          ]
        : [],
      navigationFuture: remainsInCurrentSection ? navigationFuture : [],
    };

    resetAnswerDrafts();
    const nextFutureEntry = nextSession.navigationFuture[0] ?? null;
    if (
      nextFutureEntry &&
      nextFutureEntry.response?.itemId ===
        nextSession.queue[nextSession.currentIndex]
    ) {
      hydrateAnswerDraft(nextFutureEntry.response);
    }
    setSession(nextSession);
    onProgress?.({
      status:
        nextSession.phase === "result"
          ? "complete"
          : "in_progress",
      answeredCount: nextSession.responses.length,
      response,
      responses: nextSession.responses,
      phase: nextSession.phase,
      revised: isRevisitedQuestion,
    });
    if (
      nextSession.phase === "result" &&
      nextSession.result &&
      !completionReportedRef.current
    ) {
      completionReportedRef.current = true;
      onComplete?.(nextSession.result);
    }
    if (remainsInCurrentSection) showSavedMessage();
  }

  function addSequenceToken(token) {
    if (!currentItem || sequenceDraft.length >= currentItem.answer.length) return;
    if (sequenceDraft.includes(token)) return;
    setSequenceDraft((current) => [...current, token]);
  }

  if (session.phase === "self-report") {
    const selfReportIndex = Math.max(
      0,
      SELF_REPORT_OPTIONS.findIndex((option) => option.value === selfReportDraft)
    );
    const selectedSelfReport = SELF_REPORT_OPTIONS[selfReportIndex];
    return (
      <section className="math-diagnostic-screen english-placement-screen english-self-report-screen">
        <div className="diagnostic-result-card placement-start-card english-self-report-card">
          <p className="diagnostic-eyebrow">{t.eyebrow}</p>
          <h1>{selfReportText.title}</h1>
          <p>{selfReportText.text}</p>
          <div className="english-level-picker">
            <div
              className="english-level-art"
              aria-hidden="true"
              style={{ backgroundImage: `url("${placementLevelArt[selectedSelfReport.value]}")` }}
            />
            <div className="english-level-picker-copy" aria-live="polite">
              <span>{locale === "ru" ? "Выбранное описание" : "Tanlangan tavsif"}</span>
              <strong>{selfReportText.options[selectedSelfReport.value]}</strong>
            </div>
            <div
              className="english-level-range-wrap"
              style={{ "--level-progress": `${(selfReportIndex / (SELF_REPORT_OPTIONS.length - 1)) * 100}%` }}
            >
              <div className="english-level-range-labels" aria-hidden="true">
                <span>{locale === "ru" ? "Начинаю" : "Boshlayman"}</span>
                <span>{locale === "ru" ? "Свободно" : "Erkin"}</span>
              </div>
              <div className="english-level-track">
                <input
                  className="english-level-range"
                  type="range"
                  min="0"
                  max={SELF_REPORT_OPTIONS.length - 1}
                  step="1"
                  value={selfReportIndex}
                  onChange={(event) =>
                    setSelfReportDraft(SELF_REPORT_OPTIONS[Number(event.target.value)].value)
                  }
                  aria-label={selfReportText.title}
                  aria-valuetext={selfReportText.options[selectedSelfReport.value]}
                />
                <div className="english-level-stops" aria-hidden="true">
                  {SELF_REPORT_OPTIONS.map((option, index) => (
                    <span
                      key={option.value}
                      className={
                        index === selfReportIndex
                          ? "is-current"
                          : index < selfReportIndex
                            ? "is-passed"
                            : ""
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="diagnostic-actions english-self-report-actions">
            <PlatformButton
              className="orange-button"
              onClick={() => beginTest(selectedSelfReport.value)}
            >
              {selfReportText.continue}
            </PlatformButton>
          </div>
        </div>
      </section>
    );
  }

  if (session.phase === "incomplete" && session.incomplete) {
    const incompleteProgress = t.incompleteProgress
      .replace("{count}", String(session.incomplete.answeredCount))
      .replace("{total}", String(session.incomplete.totalQuestions));

    return (
      <section className="math-diagnostic-screen english-placement-screen english-placement-result-screen">
        <div className="diagnostic-result-card english-placement-incomplete-card">
          <p className="diagnostic-eyebrow">{t.incompleteEyebrow}</p>
          <h1>{t.incompleteTitle}</h1>
          <p className="english-incomplete-text">{t.incompleteText}</p>
          <strong className="english-incomplete-progress">{incompleteProgress}</strong>
          <p className="english-incomplete-retry">{t.incompleteRetry}</p>
          <div className="diagnostic-actions english-incomplete-actions">
            <PlatformButton variant="secondary" onClick={onHome}>
              {t.courses}
            </PlatformButton>
            <PlatformButton onClick={resetTest}>{t.retake}</PlatformButton>
          </div>
        </div>
      </section>
    );
  }

  if (session.phase === "result" && session.result) {
    const result = session.result;
    const resultTotal = result.totalQuestions ?? result.responses?.length ?? PLACEMENT_TOTAL;
    const strengths = Object.entries(result.skillStats).filter(
      ([, stat]) => stat.total > 0 && stat.accuracy >= 0.7
    );
    const improvements = Object.entries(result.skillStats).filter(
      ([, stat]) => stat.total > 0 && stat.accuracy < 0.55
    );
    const technicalFlag =
      result.flags.startInconsistent ||
      result.flags.inconsistency ||
      result.flags.audioError ||
      result.flags.tooFastCount >= 4;

    return (
      <section className="math-diagnostic-screen english-placement-screen english-placement-result-screen">
        <div className="diagnostic-result-card english-placement-result-card">
          <p className="diagnostic-eyebrow">{t.resultEyebrow}</p>
          <h1>{t.resultTitle}</h1>
          <div className="english-result-summary">
            <div className="result-grade english-result-level">
              <b>{RESULT_LEVEL_LABEL[result.placementLevel]}</b>
              <span>{localText(levelDefinitions[result.placementLevel].label, locale)}</span>
            </div>
            <div className="english-result-details">
              <strong>
                {t.recommended}: {result.recommendedCourse}
              </strong>
              <p className="result-score">
                {t.confidence}: {result.confidence === "high" ? t.high : t.medium}
              </p>
              {result.completionType === "SELF_REPORT_KIDS" ? (
                <p className="result-score">{locale === "uz" ? "Test talab qilinmadi" : "Тест не требуется"}</p>
              ) : (
                <>
                  <p className="result-score result-correct">
                    {t.correctAnswers
                      .replace("{score}", String(result.score))
                      .replace("{total}", String(resultTotal))}
                  </p>
                  <p>
                    {t.answered
                      .replace("{count}", String(result.answeredCount))
                      .replace("{total}", String(resultTotal))}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="result-columns">
            <article>
              <h2>{t.strong}</h2>
              {strengths.length ? (
                strengths.map(([domain, stat]) => (
                  <p key={domain}>
                    ✓ {localText(domainNames[domain], locale)} — {Math.round(stat.accuracy * 100)}%
                  </p>
                ))
              ) : (
                <p>{t.noStrong}</p>
              )}
            </article>
            <article>
              <h2>{t.improve}</h2>
              {improvements.length ? (
                improvements.map(([domain, stat]) => (
                  <p key={domain}>
                    • {localText(domainNames[domain], locale)} — {Math.round(stat.accuracy * 100)}%
                  </p>
                ))
              ) : (
                <p>{t.noImprove}</p>
              )}
            </article>
          </div>

          {(result.borderlineWith ||
            result.placementLevel === "B2" ||
            technicalFlag) && (
            <div className="english-result-notes">
              {result.borderlineWith && (
                <p className="result-note placement-borderline">
                  {t.borderline
                    .replace("{level}", RESULT_LEVEL_LABEL[result.borderlineWith])
                    .replace("{current}", RESULT_LEVEL_LABEL[result.placementLevel])}
                </p>
              )}
              {result.placementLevel === "B2" && <p className="result-note">{t.b2Note}</p>}
              {technicalFlag && <p className="result-note">{t.technicalFlag}</p>}
            </div>
          )}

          <div className="diagnostic-actions english-result-actions">
            <PlatformButton variant="secondary" onClick={resetTest}>
              {t.retake}
            </PlatformButton>
            <PlatformButton onClick={onHome}>
              {t.courses}
            </PlatformButton>
          </div>
        </div>
      </section>
    );
  }

  if (!currentItem) {
    return null;
  }

  const needsSoundCheck = currentItem.type === "listening" && !session.soundReady;

  return (
    <section className="math-diagnostic-screen english-placement-screen">
      <div className="diagnostic-shell">
        <PlacementSectionProgress session={session} t={t} />
        <PlatformButton
          className="finish-test-button"
          onClick={() => setExitConfirmationOpen(true)}
          title={t.exitHint}
        >
          {t.exit}
        </PlatformButton>

        <aside className="diagnostic-side">
          <p className="diagnostic-eyebrow">{t.eyebrow}</p>
          <h1>
            {t.part} <b>{partNumber}</b> / {session.phase === "confirm" ? 2 : 1}
          </h1>
          <strong>{currentPartTitle}</strong>
          <p className="diagnostic-question-count">
            {t.question} {questionNumber} / {questionTotal}
          </p>
          <p className="diagnostic-exit-note">{t.exitHint}</p>
        </aside>

        <article className="diagnostic-card">
          {needsSoundCheck ? (
            <div className="sound-check-card">
              <div className="skill-tag">
                <span>{t.checking}</span>
                {localText(domainNames.listening, locale)}
              </div>
              <h2>{t.soundTitle}</h2>
              <p>{t.soundText}</p>
              <div className="diagnostic-actions">
                <PlatformButton
                  className="english-question-back"
                  variant="secondary"
                  onClick={goToPreviousQuestion}
                  disabled={!canGoToPreviousQuestion}
                  title={t.previousHint}
                  aria-label={t.previousHint}
                >
                  ← {t.previous}
                </PlatformButton>
                <PlatformButton variant="secondary" onClick={runSoundCheck}>
                  🔊 {t.testSound}
                </PlatformButton>
                <PlatformButton
                  disabled={!session.soundCheckPlayed}
                  onClick={confirmSound}
                >
                  {t.soundWorks}
                </PlatformButton>
              </div>
              <button type="button" className="builder-reset" onClick={() => setSoundProblemOpen(true)}>
                {t.soundProblem}
              </button>
            </div>
          ) : (
            <>
              <div className="skill-tag">
                <span>{t.checking}</span>
                {currentDomain}
              </div>
              <p className="placement-instruction">{currentInstruction}</p>
              <h2>{currentPrompt}</h2>

              {currentItem.type === "listening" && (
                <div className="listening-task">
                  <PlatformButton
                    className="listen-button"
                    onClick={playCurrentAudio}
                    disabled={audioPlayCount >= 2}
                  >
                    🔊 {audioPlayCount === 0 ? t.listen : t.replay}
                  </PlatformButton>
                  <p>
                    {audioPlayCount >= 2
                      ? t.audioLimit
                      : t.playsLeft.replace("{count}", String(2 - audioPlayCount))}
                  </p>
                </div>
              )}

              {(currentItem.type === "choice" || currentItem.type === "listening") && (
                <div className="choice-task english-choice-task">
                  {shuffledOptions.map((option) => {
                    const label = optionLabel(option);
                    return (
                      <button
                        key={label}
                        type="button"
                        className={choiceDraft === label ? "selected" : ""}
                        onClick={() => setChoiceDraft(label)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentItem.type === "text" && (
                <div className="written-task">
                  <label>
                    <input
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={textDraft}
                      onChange={(event) => setTextDraft(event.target.value)}
                      placeholder={t.writePlaceholder}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") submitAnswer();
                      }}
                    />
                  </label>
                </div>
              )}

              {currentItem.type === "sequence" && (
                <div className="builder-task">
                  <p>{t.build}</p>
                  <div className="built-answer">
                    {sequenceDraft.length ? (
                      sequenceDraft.map((token, index) => (
                        <button
                          key={`${token}-${index}`}
                          type="button"
                          onClick={() =>
                            setSequenceDraft((current) =>
                              current.filter((_, tokenIndex) => tokenIndex !== index)
                            )
                          }
                        >
                          {token}
                        </button>
                      ))
                    ) : (
                      <span>{t.build}</span>
                    )}
                  </div>
                  <div className="token-pool">
                    {seededShuffle(
                      currentItem.tokens,
                      session.seed,
                      `tokens-${currentItem.id}`
                    ).map((token) => (
                      <button
                        key={token}
                        type="button"
                        disabled={sequenceDraft.includes(token)}
                        onClick={() => addSequenceToken(token)}
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="builder-reset" onClick={() => setSequenceDraft([])}>
                    {t.reset}
                  </button>
                </div>
              )}

              {message && (
                <p className="diagnostic-message" role="status" aria-live="polite">
                  {message}
                </p>
              )}

              <div className="diagnostic-navigation english-diagnostic-navigation">
                <PlatformButton
                  className="english-question-back"
                  variant="secondary"
                  onClick={goToPreviousQuestion}
                  disabled={!canGoToPreviousQuestion}
                  title={t.previousHint}
                  aria-label={t.previousHint}
                >
                  ← {t.previous}
                </PlatformButton>
                <PlatformButton variant="secondary" onClick={() => submitAnswer({ skipped: true })}>
                  {t.dontKnow}
                </PlatformButton>
                <PlatformButton className="diagnostic-submit" onClick={() => submitAnswer()}>
                  {t.answer} →
                </PlatformButton>
              </div>
            </>
          )}
        </article>

        {soundProblemOpen && (
          <div className="finish-overlay" role="dialog" aria-modal="true">
            <section className="finish-dialog">
              <p>{t.soundProblem}</p>
              <h2>{t.audioErrorText}</h2>
              <div>
                <PlatformButton variant="secondary" onClick={() => setSoundProblemOpen(false)}>
                  {t.testSound}
                </PlatformButton>
                <PlatformButton onClick={continueWithAudioError}>
                  {t.continueWithError}
                </PlatformButton>
              </div>
            </section>
          </div>
        )}

        {exitConfirmationOpen && (
          <div className="finish-overlay" role="dialog" aria-modal="true" aria-labelledby="finish-test-title">
            <section className="finish-dialog">
              <p>{t.exit}</p>
              <h2 id="finish-test-title">{t.exitConfirmTitle}</h2>
              <span>{t.exitHint}</span>
              <div>
                <PlatformButton variant="secondary" onClick={() => setExitConfirmationOpen(false)}>
                  {t.cancel}
                </PlatformButton>
                <PlatformButton onClick={exitTest}>{t.exit}</PlatformButton>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
