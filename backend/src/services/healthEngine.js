const HealthScore = require("../models/HealthScore");

// Transparent, documented weighted model (TRD Section 16 / PRD Module 8).
// These weights are a defensible starting point and should be validated experimentally.
const WEIGHTS = { cpu: 0.30, memory: 0.25, storage: 0.20, network: 0.10, availability: 0.15 };

function scoreFromUtilization(usage) {
  // Utilization near 50-60% is "ideal"; very high utilization degrades the score,
  // very low utilization degrades it slightly less (under-utilization is a cost issue, not a health emergency).
  if (usage === null || usage === undefined) return 70; // neutral default when metric unavailable
  if (usage <= 60) return 100 - (usage / 60) * 20; // 100 -> 80
  if (usage <= 85) return 80 - ((usage - 60) / 25) * 30; // 80 -> 50
  return Math.max(0, 50 - ((usage - 85) / 15) * 50); // 50 -> 0
}

function classify(score) {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "HEALTHY";
  if (score >= 50) return "WARNING";
  return "CRITICAL";
}

async function calculateHealth(resource, metric) {
  const cpuScore = scoreFromUtilization(metric.cpuUsage);
  const memoryScore = scoreFromUtilization(metric.memoryUsage);
  const storageScore = scoreFromUtilization(metric.storageUsage);
  const networkScore = 90; // placeholder until network thresholds are calibrated with real traffic baselines
  const availabilityScore = metric.status === "running" ? 100 : 30;

  const overallScore = Math.round(
    cpuScore * WEIGHTS.cpu +
    memoryScore * WEIGHTS.memory +
    storageScore * WEIGHTS.storage +
    networkScore * WEIGHTS.network +
    availabilityScore * WEIGHTS.availability
  );

  const classification = classify(overallScore);

  const health = await HealthScore.create({
    resourceId: resource._id,
    overallScore,
    cpuScore: Math.round(cpuScore),
    memoryScore: Math.round(memoryScore),
    storageScore: Math.round(storageScore),
    networkScore,
    availabilityScore,
    classification,
    calculationVersion: "v1"
  });

  return health;
}

module.exports = { calculateHealth, scoreFromUtilization, classify };
