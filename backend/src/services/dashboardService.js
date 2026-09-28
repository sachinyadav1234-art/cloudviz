const Resource = require("../models/Resource");
const HealthScore = require("../models/HealthScore");
const Alert = require("../models/Alert");
const Recommendation = require("../models/Recommendation");
const Metric = require("../models/Metric");

async function getOverview(userId) {
  const resources = await Resource.find({ userId, isActive: true }).lean();
  const resourceIds = resources.map(r => r._id);

  const latestHealthByResource = await HealthScore.aggregate([
    { $match: { resourceId: { $in: resourceIds } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: "$resourceId", classification: { $first: "$classification" }, overallScore: { $first: "$overallScore" } } }
  ]);

  const counts = { healthy: 0, warning: 0, critical: 0, excellent: 0 };
  for (const h of latestHealthByResource) {
    if (h.classification === "EXCELLENT") counts.excellent++;
    else if (h.classification === "HEALTHY") counts.healthy++;
    else if (h.classification === "WARNING") counts.warning++;
    else if (h.classification === "CRITICAL") counts.critical++;
  }

  const providers = {};
  for (const r of resources) {
    providers[r.provider] = (providers[r.provider] || 0) + 1;
  }

  const latestMetrics = await Metric.aggregate([
    { $match: { resourceId: { $in: resourceIds } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: "$resourceId", cpuUsage: { $first: "$cpuUsage" }, memoryUsage: { $first: "$memoryUsage" } } }
  ]);
  const cpuValues = latestMetrics.map(m => m.cpuUsage).filter(v => v !== null && v !== undefined);
  const memValues = latestMetrics.map(m => m.memoryUsage).filter(v => v !== null && v !== undefined);
  const averageCpu = cpuValues.length ? Math.round(cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length) : null;
  const averageMemory = memValues.length ? Math.round(memValues.reduce((a, b) => a + b, 0) / memValues.length) : null;

  const activeAlerts = await Alert.countDocuments({ userId, status: "ACTIVE" });
  const openRecommendations = await Recommendation.countDocuments({ userId, status: "OPEN" });

  return {
    resources: {
      total: resources.length,
      excellent: counts.excellent,
      healthy: counts.healthy,
      warning: counts.warning,
      critical: counts.critical
    },
    providers,
    averageCpu,
    averageMemory,
    activeAlerts,
    openRecommendations
  };
}

module.exports = { getOverview };
