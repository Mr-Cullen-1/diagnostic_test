"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PlatformButton from "./platform-button";
import {
  domainNames,
  englishTestItemsKidsA1,
  levelDefinitions,
  levelOrder,
  localText,
} from "./english-test-items-kids-a1";
import { englishTestItemsA2B1 } from "./english-test-items-a2-b1(1)";
import { englishTestItemsB2 } from "./english-test-items-b2";

export const englishPlacementItems = [
  ...englishTestItemsKidsA1,
  ...englishTestItemsA2B1,
  ...englishTestItemsB2,
];

export const PLACEMENT_TOTAL = 40;
export const START_TOTAL = 14;
export const ADAPTIVE_TOTAL = 16;
export const CONFIRM_TOTAL = 10;

const LEVEL_INDEX = Object.fromEntries(levelOrder.map((level, index) => [level, index]));
const LEVEL_LABEL = {
  preA1: "Pre-A1",
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
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
    introText: "Тест сам подберёт сложность. Всего 40 заданий в трёх частях.",
    introNote: "Уровень и школьный класс выбирать не нужно — система определит точку старта по ответам.",
    start: "Начать тест",
    resume: "Продолжить тест",
    exit: "Завершить тест",
    exitHint: "Все незаданные задания будут засчитаны как неверные, после чего появится результат.",
    exitConfirmTitle: "Завершить тест?",
    cancel: "Продолжить тест",
    part: "Блок",
    ofParts: "из 3",
    question: "Задание",
    ofQuestions: "из 40",
    parts: {
      start: "Стартовая проверка",
      adaptive: "Адаптивная проверка",
      confirm: "Подтверждение границы",
    },
    checking: "Проверяем",
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
    answered: "Отвечено: {count} из 40",
    b2Note: "B2 здесь — рекомендация точки старта курса, а не официальный сертификат CEFR.",
    preA1NoAge: "После уточнения возраста: Kids до 10 лет включительно или A1 Foundation для старших учеников.",
    retake: "Пройти заново",
    courses: "К выбору курса",
    technicalFlag: "В попытке есть технический или противоречивый сигнал, поэтому уверенность снижена.",
  },
  uz: {
    eyebrow: "Ingliz tili · moslashuvchan Placement",
    introTitle: "Qaysi kursdan boshlash yaxshiroq ekanini bilib oling",
    introText: "Test qiyinlikni o‘zi moslaydi. Uch qismda jami 40 ta topshiriq bor.",
    introNote: "Daraja va maktab sinfini tanlash shart emas — tizim boshlash nuqtasini javoblar asosida aniqlaydi.",
    start: "Testni boshlash",
    resume: "Testni davom ettirish",
    exit: "Testni yakunlash",
    exitHint: "Javob berilmagan barcha topshiriqlar noto‘g‘ri deb hisoblanadi, so‘ng natija ko‘rsatiladi.",
    exitConfirmTitle: "Testni yakunlaysizmi?",
    cancel: "Testni davom ettirish",
    part: "Blok",
    ofParts: "/ 3",
    question: "Topshiriq",
    ofQuestions: "/ 40",
    parts: {
      start: "Boshlang‘ich tekshiruv",
      adaptive: "Moslashuvchan tekshiruv",
      confirm: "Chegarani tasdiqlash",
    },
    checking: "Tekshirilmoqda",
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
    answered: "Javob berildi: {count} / 40",
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

function highestSupportedAtOrBelow(responses, ceilingLevel) {
  const { supported } = getSupportedLevels(responses);
  const ceilingRank = LEVEL_INDEX[ceilingLevel];
  const eligible = supported.filter((level) => LEVEL_INDEX[level] <= ceilingRank);
  return (
    eligible.sort((left, right) => LEVEL_INDEX[right] - LEVEL_INDEX[left])[0] ??
    "preA1"
  );
}

function routeCourse(placementLevel, studentAge) {
  if (placementLevel !== "preA1") return placementLevel;
  if (Number.isFinite(studentAge)) {
    return studentAge <= 10 ? "Kids" : "A1 Foundation";
  }
  return "Pre-A1 route";
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
    const safeCeiling = oneLevelDown(lower);
    placementLevel = highestSupportedAtOrBelow(responses, safeCeiling);
    confidence = "medium";
    reasonCode = "PAIR_TOO_HIGH_RECALCULATED";
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
    reasonCode,
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

  if (itemBank.length !== 150) errors.push(`Expected 150 items, received ${itemBank.length}.`);

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

  const startItems = itemBank.filter((item) => Number.isInteger(item.startOrder));
  if (startItems.length !== START_TOTAL) errors.push("Start stage must contain exactly 14 tagged items.");
  const orders = startItems.map((item) => item.startOrder).sort((a, b) => a - b);
  if (orders.some((order, index) => order !== index + 1)) {
    errors.push("startOrder values must be exactly 1..14.");
  }

  if (errors.length) throw new Error(`Invalid English Placement bank:\n${errors.join("\n")}`);
  return true;
}

function getStartPlan(itemBank) {
  return itemBank
    .filter((item) => Number.isInteger(item.startOrder))
    .sort((left, right) => left.startOrder - right.startOrder);
}

function createInitialSession(seed = Date.now()) {
  return {
    version: 3,
    phase: "intro",
    seed,
    queue: [],
    currentIndex: 0,
    responses: [],
    probeLevel: null,
    adaptiveBlockIndex: 0,
    adaptivePath: [],
    confirmationPair: null,
    startStats: null,
    startInconsistent: false,
    soundReady: false,
    soundCheckPlayed: false,
    audioPlays: {},
    flags: { audioError: false },
    result: null,
    startedAt: null,
  };
}

function safeLoadSession(storageKey, itemMap) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 3 || parsed?.phase === "result") return null;
    const allIds = [...(parsed.queue ?? []), ...(parsed.responses ?? []).map((item) => item.itemId)];
    if (allIds.some((id) => !itemMap.has(id))) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(storageKey, session) {
  if (typeof window === "undefined") return;
  try {
    if (session.phase === "intro" || session.phase === "result") {
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

function transitionAfterQueue({ session, responses, itemBank, studentAge }) {
  const usedIds = responses.map((response) => response.itemId);

  if (session.phase === "start") {
    const start = getStartProbe(responses.filter((response) => response.stage === "start"));
    const blockItems = buildAdaptiveBlock({
      itemBank,
      usedIds,
      probeLevel: start.probeLevel,
      blockIndex: 0,
      seed: session.seed,
    });
    return {
      ...session,
      phase: "adaptive",
      queue: blockItems.map((item) => item.id),
      currentIndex: 0,
      responses,
      probeLevel: start.probeLevel,
      adaptiveBlockIndex: 0,
      startStats: start.startStats,
      startInconsistent: start.inconsistent,
    };
  }

  if (session.phase === "adaptive") {
    const blockResponses = responses.filter(
      (response) =>
        response.stage === "adaptive" &&
        response.blockIndex === session.adaptiveBlockIndex
    );
    const correctCount = blockResponses.filter((response) => response.correct).length;
    const blockResult = classifyAdaptiveBlock(correctCount);
    const pathEntry = `${LEVEL_LABEL[session.probeLevel]}:${blockResult}`;
    const adaptivePath = [...session.adaptivePath, pathEntry];
    const nextProbe = updateProbeAfterBlock(session.probeLevel, blockResult);

    if (session.adaptiveBlockIndex < 3) {
      const nextBlockIndex = session.adaptiveBlockIndex + 1;
      const blockItems = buildAdaptiveBlock({
        itemBank,
        usedIds,
        probeLevel: nextProbe,
        blockIndex: nextBlockIndex,
        seed: session.seed,
      });
      return {
        ...session,
        queue: blockItems.map((item) => item.id),
        currentIndex: 0,
        responses,
        probeLevel: nextProbe,
        adaptiveBlockIndex: nextBlockIndex,
        adaptivePath,
      };
    }

    const first30 = responses.slice(0, START_TOTAL + ADAPTIVE_TOTAL);
    const confirmation = getConfirmationPair(first30);
    const confirmItems = buildConfirmationItems({
      itemBank,
      usedIds,
      pair: confirmation.pair,
      seed: session.seed,
    });

    return {
      ...session,
      phase: "confirm",
      queue: confirmItems.map((item) => item.id),
      currentIndex: 0,
      responses,
      probeLevel: nextProbe,
      adaptivePath,
      confirmationPair: confirmation.pair,
    };
  }

  if (session.phase === "confirm") {
    const result = decideFinalResult({
      responses,
      confirmationPair: session.confirmationPair,
      adaptivePath: session.adaptivePath,
      startStats: session.startStats,
      startInconsistent: session.startInconsistent,
      studentAge,
      attemptFlags: session.flags,
    });
    return {
      ...session,
      phase: "result",
      queue: [],
      currentIndex: 0,
      responses,
      result,
    };
  }

  return { ...session, responses };
}

function advanceSession({ session, response, itemBank, studentAge }) {
  const responses = [...session.responses, response];
  const hasNextInQueue = session.currentIndex + 1 < session.queue.length;

  if (hasNextInQueue) {
    return {
      ...session,
      responses,
      currentIndex: session.currentIndex + 1,
    };
  }

  return transitionAfterQueue({ session, responses, itemBank, studentAge });
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

export default function EnglishDiagnostic({
  locale = "ru",
  studentAge,
  storageKey = "english-placement-v3",
  attemptSeed = undefined,
  itemBank = englishPlacementItems,
  onHome = () => {},
  onProgress = undefined,
  onComplete = undefined,
}) {
  const t = copy[locale] ?? copy.ru;
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
    questionStartedAtRef.current = Date.now();
  }, [currentItem?.id]);

  useEffect(() => {
    if (session.phase !== "result" || !session.result || completionReportedRef.current) return;
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

  const partNumber = session.phase === "start" ? 1 : session.phase === "adaptive" ? 2 : 3;
  const questionNumber = session.responses.length + 1;
  const currentDomain = currentItem ? localText(domainNames[currentItem.domain], locale) : "";
  const currentInstruction = currentItem ? localText(currentItem.instruction, locale) : "";
  const currentPrompt = currentItem ? localText(currentItem.prompt, locale) : "";
  const audioPlayCount = currentItem ? session.audioPlays[currentItem.id] ?? 0 : 0;

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

  function beginTest() {
    const seed = attemptSeed ?? Date.now();
    const startItems = getStartPlan(itemBank);
    completionReportedRef.current = false;
    resetAnswerDrafts();
    setSession({
      ...createInitialSession(seed),
      phase: "start",
      queue: startItems.map((item) => item.id),
      startedAt: new Date().toISOString(),
    });
  }

  function resetTest() {
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
    completionReportedRef.current = false;
    resetAnswerDrafts();
    setSession(createInitialSession(attemptSeed ?? Date.now()));
  }

  function completeExitedSession() {
    let nextSession = session;
    let skippedCount = 0;

    while (nextSession.phase !== "result" && skippedCount < PLACEMENT_TOTAL) {
      const nextItem = itemMap.get(nextSession.queue[nextSession.currentIndex]);
      if (!nextItem) {
        throw new Error("English Placement cannot finish because the current item is missing.");
      }

      const skippedResponse = buildResponse({
        session: nextSession,
        item: nextItem,
        answer: null,
        correct: false,
        skipped: true,
        answerTimeMs: 0,
      });
      nextSession = advanceSession({
        session: nextSession,
        response: skippedResponse,
        itemBank,
        studentAge,
      });
      skippedCount += 1;
    }

    if (nextSession.phase !== "result") {
      throw new Error("English Placement did not reach a final result after exit.");
    }

    return nextSession;
  }

  function exitTest() {
    setExitConfirmationOpen(false);
    const completedSession = completeExitedSession();
    resetAnswerDrafts();
    completionReportedRef.current = false;
    setSession(completedSession);
    onProgress?.({
      status: "complete",
      answeredCount: completedSession.responses.length,
      responses: completedSession.responses,
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
    const nextSession = advanceSession({
      session,
      response,
      itemBank,
      studentAge,
    });

    resetAnswerDrafts();
    setSession(nextSession);
    onProgress?.({
      status: nextSession.phase === "result" ? "complete" : "in_progress",
      answeredCount: nextSession.responses.length,
      response,
      phase: nextSession.phase,
    });
    if (nextSession.phase === "result" && nextSession.result && !completionReportedRef.current) {
      completionReportedRef.current = true;
      onComplete?.(nextSession.result);
    }
    showSavedMessage();
  }

  function addSequenceToken(token) {
    if (!currentItem || sequenceDraft.length >= currentItem.answer.length) return;
    if (sequenceDraft.includes(token)) return;
    setSequenceDraft((current) => [...current, token]);
  }

  if (session.phase === "intro") {
    return (
      <section className="math-diagnostic-screen english-placement-screen">
        <div className="diagnostic-result-card placement-start-card">
          <p className="diagnostic-eyebrow">{t.eyebrow}</p>
          <h1>{t.introTitle}</h1>
          <p>{t.introText}</p>
          <p className="result-note">{t.introNote}</p>
          <PlatformButton onClick={beginTest}>
            {t.start}
          </PlatformButton>
        </div>
      </section>
    );
  }

  if (session.phase === "result" && session.result) {
    const result = session.result;
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
      <section className="math-diagnostic-screen english-placement-screen">
        <div className="diagnostic-result-card">
          <p className="diagnostic-eyebrow">{t.resultEyebrow}</p>
          <h1>{t.resultTitle}</h1>
          <div className="result-grade english-result-level">
            <b>{LEVEL_LABEL[result.placementLevel]}</b>
            <span>{localText(levelDefinitions[result.placementLevel].label, locale)}</span>
          </div>
          <strong>
            {t.recommended}: {result.recommendedCourse}
          </strong>
          <p className="result-score">
            {t.confidence}: {result.confidence === "high" ? t.high : t.medium}
          </p>
          <p className="result-score result-correct">
            {t.correctAnswers
              .replace("{score}", String(result.score))
              .replace("{total}", String(PLACEMENT_TOTAL))}
          </p>
          <p>{t.answered.replace("{count}", result.answeredCount)}</p>

          {result.borderlineWith && (
            <p className="result-note placement-borderline">
              {t.borderline
                .replace("{level}", LEVEL_LABEL[result.borderlineWith])
                .replace("{current}", LEVEL_LABEL[result.placementLevel])}
            </p>
          )}

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

          {result.placementLevel === "B2" && <p className="result-note">{t.b2Note}</p>}
          {result.placementLevel === "preA1" && !Number.isFinite(studentAge) && (
            <p className="result-note">{t.preA1NoAge}</p>
          )}
          {technicalFlag && <p className="result-note">{t.technicalFlag}</p>}

          <div className="diagnostic-actions">
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
            {t.part} <b>{partNumber}</b> {t.ofParts}
          </h1>
          <strong>{t.parts[session.phase]}</strong>
          <p className="diagnostic-question-count">
            {t.question} {questionNumber} {t.ofQuestions}
          </p>
          <div className="diagnostic-progress">
            <span style={{ width: `${(questionNumber / PLACEMENT_TOTAL) * 100}%` }} />
          </div>
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
