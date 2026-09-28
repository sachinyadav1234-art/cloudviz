const Resource = require("../models/Resource");
const HealthScore = require("../models/HealthScore");
const { success } = require("../utils/response");

async function listRegions(req, res, next) {
  try {
    const resources = await Resource.find({ userId: req.user.id, isActive: true }).lean();
    const byRegion = {};

    for (const r of resources) {
      const key = r.region || "Unknown";
      if (!byRegion[key]) byRegion[key] = { region: key, resourceIds: [], count: 0, providers: {} };
      byRegion[key].resourceIds.push(r._id);
      byRegion[key].count++;
      byRegion[key].providers[r.provider] = (byRegion[key].providers[r.provider] || 0) + 1;
    }

    const result = [];
    for (const data of Object.values(byRegion)) {
      const health = await HealthScore.aggregate([
        { $match: { resourceId: { $in: data.resourceIds } } },
        { $sort: { timestamp: -1 } },
        { $group: { _id: "$resourceId", overallScore: { $first: "$overallScore" } } }
      ]);
      const scores = health.map(h => h.overallScore).filter(v => v != null);
      const avgHealth = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

      result.push({ region: data.region, resourceCount: data.count, providers: data.providers, avgHealth });
    }

    return success(res, { regions: result });
  } catch (err) { next(err); }
}

module.exports = { listRegions };
