export function enforceOneLevelDowngrade({
  placementLevel,
  referenceLevel,
  levelOrder,
}) {
  const placementRank = levelOrder.indexOf(placementLevel);
  const referenceRank = levelOrder.indexOf(referenceLevel);

  if (placementRank < 0 || referenceRank < 0) {
    return {
      placementLevel,
      calculatedPlacementLevel: placementLevel,
      floorLevel: null,
      applied: false,
    };
  }

  const floorLevel = levelOrder[Math.max(0, referenceRank - 1)];
  const floorRank = levelOrder.indexOf(floorLevel);
  const applied = placementRank < floorRank;

  return {
    placementLevel: applied ? floorLevel : placementLevel,
    calculatedPlacementLevel: placementLevel,
    floorLevel,
    applied,
  };
}
