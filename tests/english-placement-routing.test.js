import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateInitialLane,
  getEnglishPlacementLane,
} from "../app/english-placement-routing.js";

function responses(level, correct, total = 6) {
  return Array.from({ length: total }, (_, index) => ({
    level,
    correct: index < correct,
  }));
}

function laneResponses(lane, { easy, medium, hard }) {
  return [
    ...responses(lane.lower, easy, 6),
    ...responses(lane.target, medium, 6),
    ...responses(lane.stretch, hard, 3),
  ];
}

test("8–10 with low confidence receives Kids immediately", () => {
  const lane = getEnglishPlacementLane({ age: 10, selfReport: "zero" });
  assert.equal(lane.kind, "directKids");
});

test("Foundation requires the 4/6, 4/6, 1/3 gate for moderate children", () => {
  const lane = getEnglishPlacementLane({ age: 9, selfReport: "read" });

  assert.equal(
    evaluateInitialLane({
      lane,
      responses: laneResponses(lane, { easy: 4, medium: 4, hard: 1 }),
    }).placementLevel,
    "Foundation"
  );

  assert.equal(
    evaluateInitialLane({
      lane,
      responses: laneResponses(lane, { easy: 4, medium: 4, hard: 0 }),
    }).placementLevel,
    "preA1"
  );
});

test("hard questions validate the middle level but cannot award the hard level", () => {
  const lane = getEnglishPlacementLane({ age: 14, selfReport: "zero" });
  const decision = evaluateInitialLane({
    lane,
    responses: laneResponses(lane, { easy: 6, medium: 6, hard: 3 }),
  });

  assert.equal(decision.placementLevel, "A1");
  assert.equal(decision.placementLevel !== lane.stretch, true);
});

test("failure in the easy tier applies the route's capped fallback", () => {
  const childHigh = getEnglishPlacementLane({ age: 10, selfReport: "fluent" });
  const childDecision = evaluateInitialLane({
    lane: childHigh,
    responses: laneResponses(childHigh, { easy: 3, medium: 6, hard: 3 }),
  });
  assert.equal(childDecision.placementLevel, "preA1");

  const olderLow = getEnglishPlacementLane({ age: 14, selfReport: "words" });
  const olderDecision = evaluateInitialLane({
    lane: olderLow,
    responses: laneResponses(olderLow, { easy: 3, medium: 6, hard: 3 }),
  });
  assert.equal(olderDecision.placementLevel, "Foundation");
});

test("a completed zero-score attempt overrides a high self-report safely", () => {
  const upperLane = getEnglishPlacementLane({ age: 12, selfReport: "fluent" });
  const olderDecision = evaluateInitialLane({
    lane: upperLane,
    responses: laneResponses(upperLane, { easy: 0, medium: 0, hard: 0 }),
  });
  assert.equal(olderDecision.placementLevel, "Foundation");

  const childLane = getEnglishPlacementLane({ age: 10, selfReport: "fluent" });
  const childDecision = evaluateInitialLane({
    lane: childLane,
    responses: laneResponses(childLane, { easy: 0, medium: 0, hard: 0 }),
  });
  assert.equal(childDecision.placementLevel, "preA1");
});

test("students older than 10 can never be placed into Kids", () => {
  for (const selfReport of ["zero", "words", "read", "simpleTalk", "hesitantTalk", "fluent"]) {
    const lane = getEnglishPlacementLane({ age: 11, selfReport });
    const decision = evaluateInitialLane({
      lane,
      responses: laneResponses(lane, { easy: 0, medium: 0, hard: 0 }),
    });
    assert.notEqual(decision.placementLevel, "preA1", selfReport);
  }
});

test("the fifth self-report option uses the high-confidence route capped at B1", () => {
  const lane = getEnglishPlacementLane({ age: 14, selfReport: "hesitantTalk" });
  const decision = evaluateInitialLane({
    lane,
    responses: laneResponses(lane, { easy: 6, medium: 6, hard: 3 }),
  });

  assert.deepEqual([lane.lower, lane.target, lane.stretch], ["A2", "B1", "B2"]);
  assert.equal(decision.placementLevel, "B1");
});
