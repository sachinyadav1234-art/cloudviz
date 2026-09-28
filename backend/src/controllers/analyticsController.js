const Resource = require("../models/Resource");
const Metric = require("../models/Metric");
const HealthScore = require("../models/HealthScore");
const Anomaly = require("../models/Anomaly");
const CostRecord = require("../models/CostRecord");
const { calculateEfficiency } = require("../services/efficiencyEngine");
const { success } = require("../utils/response");

async function comparison(req, res, next) {
  try {
    const resources = await Resource.find({ userId: req.user.id, isActive: true }).lean();
    const byProvider = {};

    for (const r of resources) {
      if (!byProvider[r.provider]) byProvider[r.provider] = { resourceIds: [], count: 0 };
      byProvider[r.provider].resourceIds.push(r._id);
      byProvider[r.provider].count++;
    }

    const result = {};
    for (const [provider, data] of Object.entries(byProvider)) {
      const metrics = await Metric.aggregate([
        { $match: { resourceId: { $in: data.resourceIds } } },
        { $sort: { timestamp: -1 } },
        { $group: { _id: "$resourceId", cpuUsage: { $first: "$cpuUsage" }, memoryUsage: { $first: "$memoryUsage" }, storageUsage: { $first: "$storageUsage" } } }
      ]);
      const health = await HealthScore.aggregate([
        { $match: { resourceId: { $in: data.resourceIds } } },
        { $sort: { timestamp: -1 } },
        { $group: { _id: "$resourceId", overallScore: { $first: "$overallScore" } } }
      ]);

      const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
      const avgHealth = avg(health.map(h => h.overallScore).filter(v => v != null));

      // Use only the most recent cost record for this provider (costEngine.js upserts
      // one record per billing period), never sum multiple periods together here -
      // that would inflate "current cost" the more times refresh has been clicked historically.
      const latestCost = await CostRecord.findOne({ userId: req.user.id, provider }).sort({ periodStart: -1 }).lean();
      const currentCost = latestCost ? latestCost.amount : 0;
      const efficiency = calculateEfficiency(avgHealth, currentCost, data.count);

      result[provider] = {
        resourceCount: data.count,
        avgCpu: avg(metrics.map(m => m.cpuUsage).filter(v => v != null)),
        avgMemory: avg(metrics.map(m => m.memoryUsage).filter(v => v != null)),
        avgStorage: avg(metrics.map(m => m.storageUsage).filter(v => v != null)),
        avgHealth,
        efficiency
      };
    }

    return success(res, { comparison: result });
  } catch (err) { next(err); }
}

async function anomalies(req, res, next) {
  try {
    const list = await Anomaly.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).populate("resourceId", "resourceName provider");
    return success(res, { anomalies: list });
  } catch (err) { next(err); }
}

module.exports = { comparison, anomalies };
