const Metric = require("../models/Metric");
const Recommendation = require("../models/Recommendation");

const MIN_OBSERVATIONS = 10;
const UNDER_UTIL_THRESHOLD = 20;
const OVER_UTIL_THRESHOLD = 85;
const STORAGE_PRESSURE_THRESHOLD = 90;

async function evaluateResourceForRecommendations(resource) {
  const history = await Metric.find({ resourceId: resource._id })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

  if (history.length < MIN_OBSERVATIONS) return [];

  const cpuValues = history.map(h => h.cpuUsage).filter(v => v !== null);
  const storageValues = history.map(h => h.storageUsage).filter(v => v !== null);
  if (cpuValues.length === 0) return [];

  const avgCpu = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
  const peakCpu = Math.max(...cpuValues);
  const created = [];

  const existingOpen = await Recommendation.find({ resourceId: resource._id, status: "OPEN" });
  const hasOpenOfType = (type) => existingOpen.some(r => r.type === type);

  if (avgCpu < UNDER_UTIL_THRESHOLD && !hasOpenOfType("UNDER_UTILIZATION")) {
    created.push(await Recommendation.create({
      userId: resource.userId,
      resourceId: resource._id,
      provider: resource.provider,
      type: "UNDER_UTILIZATION",
      title: "Persistent Compute Under-Utilization",
      observation: `Average CPU remained at ${avgCpu.toFixed(1)}% (peak ${peakCpu.toFixed(1)}%) across the last ${cpuValues.length} observations.`,
      recommendation: "Review compute resource sizing; consider a smaller instance type.",
      reason: "The resource appears persistently under-utilized relative to its allocated capacity.",
      evidence: { averageCpu: avgCpu, peakCpu, observations: cpuValues.length },
      confidence: cpuValues.length >= 30 ? "HIGH" : "MEDIUM",
      potentialImpact: "Possible reduction in allocated compute capacity and cost."
    }));
  }

  if (avgCpu > OVER_UTIL_THRESHOLD && !hasOpenOfType("OVER_UTILIZATION")) {
    created.push(await Recommendation.create({
      userId: resource.userId,
      resourceId: resource._id,
      provider: resource.provider,
      type: "OVER_UTILIZATION",
      title: "Sustained High CPU Utilization",
      observation: `Average CPU is ${avgCpu.toFixed(1)}% (peak ${peakCpu.toFixed(1)}%) across the last ${cpuValues.length} observations.`,
      recommendation: "Consider increasing compute capacity or distributing the workload.",
      reason: "Sustained high utilization increases the risk of performance degradation.",
      evidence: { averageCpu: avgCpu, peakCpu, observations: cpuValues.length },
      confidence: cpuValues.length >= 30 ? "HIGH" : "MEDIUM",
      potentialImpact: "Improved reliability under peak load."
    }));
  }

  if (storageValues.length > 0) {
    const avgStorage = storageValues.reduce((a, b) => a + b, 0) / storageValues.length;
    if (avgStorage > STORAGE_PRESSURE_THRESHOLD && !hasOpenOfType("STORAGE_PRESSURE")) {
      created.push(await Recommendation.create({
        userId: resource.userId,
        resourceId: resource._id,
        provider: resource.provider,
        type: "STORAGE_PRESSURE",
        title: "Storage Approaching Capacity",
        observation: `Average storage utilization is ${avgStorage.toFixed(1)}% over recent observations.`,
        recommendation: "Review allocated storage capacity or archive unused data.",
        reason: "Storage utilization is approaching the configured pressure threshold.",
        evidence: { averageStorage: avgStorage, observations: storageValues.length },
        confidence: "HIGH",
        potentialImpact: "Avoids running out of storage capacity."
      }));
    }
  }

  return created;
}

module.exports = { evaluateResourceForRecommendations };
