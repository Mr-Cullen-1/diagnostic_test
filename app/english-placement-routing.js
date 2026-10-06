export const SELF_REPORT_OPTIONS = [
  { value: "zero", group: "low" },
  { value: "words", group: "low" },
  { value: "read", group: "moderate" },
  { value: "simpleTalk", group: "moderate" },
  { value: "hesitantTalk", group: "high" },
  { value: "fluent", group: "high" },
];

export function getSelfReportGroup(value) {
  return SELF_REPORT_OPTIONS.find((option) => option.value === value)?.group ?? null;
}

function isChild(age) {
  return Number(age) >= 8 && Number(age) <= 10;
}

export function getEnglishPlacementLane({ age, selfReport }) {
  const group = getSelfReportGroup(selfReport);
  if (!group) throw new Error("A valid English self-report is required.");

  if (isChild(age) && group === "low") {
    return {
      kind: "directKids",
      lower: "preA1",
      target: "preA1",
      stretch: null,
      fallback: "preA1",
      zeroScoreFallback: "preA1",
    };
  }

  if (isChild(age) && group === "moderate") {
    return {
      kind: "childModerate",
      lower: "preA1",
      target: "Foundation",
      stretch: "A1",
      fallback: "preA1",
      zeroScoreFallback: "preA1",
    };
  }

  if (isChild(age)) {
    return {
      kind: "childHigh",
      lower: "Foundation",
      target: "A1",
      stretch: "A2",
      fallback: "preA1",
      zeroScoreFallback: "preA1",
    };
  }

  if (group === "low") {
    return {
      kind: "lowOlder",
      lower: "Foundation",
      target: "A1",
      stretch: "A2",
      fallback: "Foundation",
      zeroScoreFallback: "Foundation",
    };
  }

  if (Number(age) >= 11 && Number(age) <= 15 && group === "moderate") {
    return {
      kind: "teenModerate",
      lower: "A1",
      target: "A2",
      stretch: "B1",
      fallback: "Foundation",
      zeroScoreFallback: "Foundation",
    };
  }

  return {
    kind: "upper",
    lower: "A2",
    target: "B1",
    stretch: "B2",
    fallback: "A1",
    zeroScoreFallback: "Foundation",
  };
}

export function getLaneTestPlan(lane) {
  if (lane.kind === "directKids") return [];
  return [
    { level: lane.lower, count: 6 },
    { level: lane.target, count: 6 },
    { level: lane.stretch, count: 3 },
  ];
}

function correctCount(responses, level) {
  return responses.filter((response) => response.level === level && response.correct).length;
}

export function evaluateInitialLane({ lane, responses }) {
  const lowerCorrect = correctCount(responses, lane.lower);
  const targetCorrect = correctCount(responses, lane.target);
  const stretchCorrect = lane.stretch ? correctCount(responses, lane.stretch) : 0;
  const totalCorrect = responses.filter((response) => response.correct).length;

  const passedEasy = lowerCorrect >= 4;
  const passedMedium = targetCorrect >= 4;
  const passedHard = stretchCorrect >= 1;
  const passedAllTiers = passedEasy && passedMedium && passedHard;
  const placementLevel = totalCorrect === 0
    ? lane.zeroScoreFallback
    : passedAllTiers
      ? lane.target
      : passedEasy
        ? lane.lower
        : lane.fallback;

  return {
    placementLevel,
    confidence: passedAllTiers ? "high" : "medium",
    lowerCorrect,
    targetCorrect,
    stretchCorrect,
    totalCorrect,
    passedEasy,
    passedMedium,
    passedHard,
    passedAllTiers,
  };
}
