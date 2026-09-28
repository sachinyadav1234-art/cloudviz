/**
 * Efficiency Engine (PRD Module 13 / TRD Section 28).
 * Experimental, documented conceptual model:
 *   Efficiency = Health Score / Normalized Cost
 * This is a research component - the exact formula must be validated experimentally
 * rather than treated as a universal truth (see PRD Section 28 note).
 */
function calculateEfficiency(avgHealth, costAmount, resourceCount) {
  if (!costAmount || costAmount <= 0 || !resourceCount) return null;
  const costPerResource = costAmount / resourceCount;
  if (costPerResource <= 0) return null;
  // Normalize so the score is comparable across providers with different cost scales.
  const raw = (avgHealth || 0) / costPerResource;
  return Math.round(raw * 1000) / 1000;
}

module.exports = { calculateEfficiency };
