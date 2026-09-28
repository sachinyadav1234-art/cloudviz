const CloudAccount = require("../models/CloudAccount");
const Resource = require("../models/Resource");
const Metric = require("../models/Metric");
const SyncJob = require("../models/SyncJob");
const { getAdapter } = require("../providers");
const { normalizeResource } = require("../normalization/resourceNormalizer");
const { normalizeMetric, validateMetric } = require("../normalization/metricNormalizer");
const { calculateHealth } = require("./healthEngine");
const { detectAnomaliesForResource } = require("./anomalyEngine");
const { evaluateAlertsForResource, ensureDefaultRules } = require("./alertEngine");
const { evaluateResourceForRecommendations } = require("./recommendationEngine");
const logger = require("../utils/logger");

async function syncCloudAccount(cloudAccount) {
  const startedAt = Date.now();
  const job = await SyncJob.create({ cloudAccountId: cloudAccount._id, provider: cloudAccount.provider, status: "RUNNING" });

  let resourcesDiscovered = 0, metricsCollected = 0, metricsFailed = 0;

  try {
    const adapter = getAdapter(cloudAccount.provider);
    const test = await adapter.testConnection();
    if (!test.success) {
      throw new Error(test.message);
    }

    await ensureDefaultRules(cloudAccount.userId);

    const rawResources = await adapter.getResources();

    for (const raw of rawResources) {
      const normalized = normalizeResource(cloudAccount.provider, raw);

      const resource = await Resource.findOneAndUpdate(
        { cloudAccountId: cloudAccount._id, resourceId: normalized.resourceId },
        {
          $set: {
            ...normalized,
            userId: cloudAccount.userId,
            cloudAccountId: cloudAccount._id,
            isActive: true,
            lastSeenAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      resourcesDiscovered++;

      try {
        const rawMetric = await adapter.getMetrics(raw);
        const normalizedMetric = normalizeMetric(cloudAccount.provider, rawMetric);
        const validation = validateMetric(normalizedMetric);

        if (!validation.valid) {
          logger.warn(`Rejected invalid metric for ${resource.resourceName}: ${validation.reason}`);
          metricsFailed++;
          continue;
        }

        await Metric.create({
          userId: cloudAccount.userId,
          resourceId: resource._id,
          provider: cloudAccount.provider,
          ...normalizedMetric,
          source: cloudAccount.provider === "DEMO" ? "DEMO_GENERATOR" : cloudAccount.provider === "AWS" ? "AWS_CLOUDWATCH" : "OCI_MONITORING"
        });
        metricsCollected++;

        await calculateHealth(resource, normalizedMetric);
        await detectAnomaliesForResource(resource, normalizedMetric);
        await evaluateAlertsForResource(resource, normalizedMetric);
        await evaluateResourceForRecommendations(resource);
      } catch (metricErr) {
        metricsFailed++;
        logger.error(`Metric collection failed for ${normalized.resourceId}: ${metricErr.message}`);
      }
    }

    cloudAccount.status = "CONNECTED";
    cloudAccount.lastSyncAt = new Date();
    cloudAccount.lastSuccessfulSyncAt = new Date();
    cloudAccount.lastSyncStatus = "SUCCESS";
    cloudAccount.lastSyncError = undefined;
    await cloudAccount.save();

    job.status = metricsFailed > 0 ? "PARTIAL_SUCCESS" : "SUCCESS";
  } catch (err) {
    cloudAccount.status = "ERROR";
    cloudAccount.lastSyncAt = new Date();
    cloudAccount.lastSyncStatus = "FAILED";
    cloudAccount.lastSyncError = err.message;
    await cloudAccount.save();

    job.status = "FAILED";
    job.errorMessage = err.message;
    logger.error(`Sync failed for account ${cloudAccount._id} (${cloudAccount.provider}): ${err.message}`);
  }

  job.completedAt = new Date();
  job.resourcesDiscovered = resourcesDiscovered;
  job.metricsCollected = metricsCollected;
  job.metricsFailed = metricsFailed;
  job.totalLatencyMs = Date.now() - startedAt;
  await job.save();

  return job;
}

async function syncAllAccountsForUser(userId) {
  const accounts = await CloudAccount.find({ userId, status: { $ne: "DISABLED" } });
  const jobs = [];
  for (const account of accounts) {
    // Fault isolation: one provider failing must not stop the others.
    jobs.push(await syncCloudAccount(account));
  }
  return jobs;
}

module.exports = { syncCloudAccount, syncAllAccountsForUser };
