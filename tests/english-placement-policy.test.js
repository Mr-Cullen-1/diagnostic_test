import assert from "node:assert/strict";
import test from "node:test";

import { enforceOneLevelDowngrade } from "../app/english-placement-policy.js";

const levels = ["preA1", "A1", "A2", "B1", "B2"];

test("B2 routing cannot be downgraded below B1", () => {
  assert.deepEqual(
    enforceOneLevelDowngrade({
      placementLevel: "A2",
      referenceLevel: "B2",
      levelOrder: levels,
    }),
    {
      placementLevel: "B1",
      calculatedPlacementLevel: "A2",
      floorLevel: "B1",
      applied: true,
    }
  );
});

test("a result already within one level is unchanged", () => {
  assert.equal(
    enforceOneLevelDowngrade({
      placementLevel: "B1",
      referenceLevel: "B2",
      levelOrder: levels,
    }).applied,
    false
  );
});

test("the floor follows the section-two routing level", () => {
  const cases = [
    ["B1", "preA1", "A2"],
    ["A2", "preA1", "A1"],
    ["A1", "preA1", "preA1"],
  ];

  cases.forEach(([referenceLevel, placementLevel, expected]) => {
    assert.equal(
      enforceOneLevelDowngrade({
        placementLevel,
        referenceLevel,
        levelOrder: levels,
      }).placementLevel,
      expected
    );
  });
});

test("unknown levels do not change the calculated placement", () => {
  assert.equal(
    enforceOneLevelDowngrade({
      placementLevel: "A2",
      referenceLevel: "unknown",
      levelOrder: levels,
    }).placementLevel,
    "A2"
  );
});
