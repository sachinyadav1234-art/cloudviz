const Resource = require("../models/Resource");
const Metric = require("../models/Metric");
const HealthScore = require("../models/HealthScore");
const Alert = require("../models/Alert");
const Anomaly = require("../models/Anomaly");
const Recommendation = require("../models/Recommendation");
const { success, failure } = require("../utils/response");

async function listResources(req, res, next) {
  try {
    const { provider, region, status, search, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.id, isActive: true };
    if (provider) filter.provider = provider;
    if (region) filter.region = region;
    if (status) filter.status = status;
    if (search) filter.resourceName = { $regex: search, $options: "i" };

    const total = await Resource.countDocuments(filter);
    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Attach latest metric + health per resource
    const resourceIds = resources.map(r => r._id);
    const latestMetrics = await Metric.aggregate([
      { $match: { resourceId: { $in: resourceIds } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$resourceId", cpuUsage: { $first: "$cpuUsage" }, memoryUsage: { $first: "$memoryUsage" }, storageUsage: { $first: "$storageUsage" } } }
    ]);
    const latestHealth = await HealthScore.aggregate([
      { $match: { resourceId: { $in: resourceIds } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$resourceId", overallScore: { $first: "$overallScore" }, classification: { $first: "$classification" } } }
    ]);
    const metricMap = Object.fromEntries(latestMetrics.map(m => [String(m._id), m]));
    const healthMap = Object.fromEntries(latestHealth.map(h => [String(h._id), h]));

    const enriched = resources.map(r => ({
      ...r,
      latestMetric: metricMap[String(r._id)] || null,
      health: healthMap[String(r._id)] || null
    }));

    return success(res, {
      resources: enriched,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
}

async function getResource(req, res, next) {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!resource) return failure(res, "NOT_FOUND", "Resource not found", 404);

    const [health, alerts, anomalies, recommendations] = await Promise.all([
      HealthScore.findOne({ resourceId: resource._id }).sort({ timestamp: -1 }),
      Alert.find({ resourceId: resource._id }).sort({ createdAt: -1 }).limit(10),
      Anomaly.find({ resourceId: resource._id }).sort({ createdAt: -1 }).limit(10),
      Recommendation.find({ resourceId: resource._id }).sort({ createdAt: -1 }).limit(10)
    ]);

    return success(res, { resource, health, alerts, anomalies, recommendations });
  } catch (err) { next(err); }
}

async function getResourceMetrics(req, res, next) {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resource) return failure(res, "NOT_FOUND", "Resource not found", 404);

    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await Metric.find({ resourceId: resource._id, timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .lean();

    return success(res, { metrics });
  } catch (err) { next(err); }
}

module.exports = { listResources, getResource, getResourceMetrics };
