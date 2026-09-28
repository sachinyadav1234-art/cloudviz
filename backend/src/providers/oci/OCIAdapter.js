const fs = require("fs");
const env = require("../../config/env");
const logger = require("../../utils/logger");

/**
 * OCIAdapter - Live Oracle Cloud Infrastructure integration.
 *
 * Activates automatically once OCI_TENANCY / OCI_USER_ID / OCI_FINGERPRINT /
 * OCI_PRIVATE_KEY_PATH are set in .env. Uses the "oci-sdk" npm package (added to
 * package.json).
 *
 * Requires only a READ-ONLY OCI IAM policy, e.g.:
 *   Allow group CloudVizReaders to read instance-family in tenancy
 *   Allow group CloudVizReaders to read metrics in tenancy
 *
 * This class implements the same adapter contract as DemoAdapter/AWSAdapter, so it
 * plugs directly into the existing sync pipeline (syncService.js) with no other changes.
 */
class OCIAdapter {
  constructor() {
    this.configured = Boolean(
      env.oci.tenancy && env.oci.userId && env.oci.fingerprint && env.oci.privateKeyPath
    );
  }

  _requireSdk() {
    try {
      return require("oci-sdk");
    } catch (err) {
      throw new Error('oci-sdk is not installed. Run "npm install oci-sdk" in backend/ to activate live OCI monitoring.');
    }
  }

  _getProvider(oci) {
    if (!fs.existsSync(env.oci.privateKeyPath)) {
      throw new Error(`OCI_PRIVATE_KEY_PATH does not point to a readable file: ${env.oci.privateKeyPath}`);
    }
    return new oci.common.SimpleAuthenticationDetailsProvider(
      env.oci.tenancy,
      env.oci.userId,
      env.oci.fingerprint,
      fs.readFileSync(env.oci.privateKeyPath, "utf8"),
      null,
      env.oci.region ? oci.common.Region.fromRegionId(env.oci.region) : undefined
    );
  }

  async testConnection() {
    if (!this.configured) {
      return { success: false, message: "OCI credentials not configured. Set OCI_TENANCY, OCI_USER_ID, OCI_FINGERPRINT, OCI_PRIVATE_KEY_PATH in backend/.env." };
    }
    try {
      const oci = this._requireSdk();
      const provider = this._getProvider(oci);
      const identityClient = new oci.identity.IdentityClient({ authenticationDetailsProvider: provider });
      const result = await identityClient.getTenancy({ tenancyId: env.oci.tenancy });
      return { success: true, message: `Connected to tenancy ${result.tenancy.name}` };
    } catch (err) {
      logger.error(`OCI testConnection failed: ${err.message}`);
      return { success: false, message: `OCI connection failed: ${err.message}` };
    }
  }

  async getRegions() {
    if (!this.configured) return [];
    try {
      const oci = this._requireSdk();
      const provider = this._getProvider(oci);
      const identityClient = new oci.identity.IdentityClient({ authenticationDetailsProvider: provider });
      const result = await identityClient.listRegionSubscriptions({ tenancyId: env.oci.tenancy });
      return (result.items || []).map(r => r.regionName);
    } catch (err) {
      logger.error(`OCI getRegions failed: ${err.message}`);
      return [env.oci.region].filter(Boolean);
    }
  }

  async getResources() {
    if (!this.configured) throw new Error("OCI credentials not configured");
    const oci = this._requireSdk();
    const provider = this._getProvider(oci);
    const computeClient = new oci.core.ComputeClient({ authenticationDetailsProvider: provider });

    const result = await computeClient.listInstances({ compartmentId: env.oci.tenancy });
    return (result.items || []).map(instance => ({
      id: instance.id,
      displayName: instance.displayName,
      shape: instance.shape,
      lifecycleState: instance.lifecycleState,
      region: instance.region || env.oci.region
    }));
  }

  async getMetrics(rawResource) {
    if (!this.configured) throw new Error("OCI credentials not configured");
    const oci = this._requireSdk();
    const provider = this._getProvider(oci);
    const monitoringClient = new oci.monitoring.MonitoringClient({ authenticationDetailsProvider: provider });

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 10 * 60 * 1000);

    const query = (metricName) => ({
      compartmentId: env.oci.tenancy,
      summarizeMetricsDataDetails: {
        namespace: "oci_computeagent",
        query: `${metricName}[1m]{resourceId = "${rawResource.id}"}.mean()`,
        startTime,
        endTime
      }
    });

    const readLatest = (result) => {
      const points = result?.items?.[0]?.aggregatedDatapoints;
      if (!points || points.length === 0) return null;
      return points[points.length - 1].value;
    };

    let cpu = null, memory = null, disk = null;
    try { cpu = readLatest(await monitoringClient.summarizeMetricsData(query("CpuUtilization"))); } catch (e) { logger.warn(`OCI CPU metric unavailable: ${e.message}`); }
    try { memory = readLatest(await monitoringClient.summarizeMetricsData(query("MemoryUtilization"))); } catch (e) { logger.warn(`OCI memory metric unavailable: ${e.message}`); }
    try { disk = readLatest(await monitoringClient.summarizeMetricsData(query("DiskUtilization"))); } catch (e) { logger.warn(`OCI disk metric unavailable: ${e.message}`); }

    return {
      CpuUtilization: cpu,
      MemoryUtilization: memory,
      DiskUtilization: disk,
      NetworksBytesIn: null,
      NetworksBytesOut: null,
      lifecycleState: rawResource.lifecycleState,
      timestamp: endTime
    };
  }

  async getCostData() {
    if (!this.configured) throw new Error("OCI credentials not configured");
    const oci = this._requireSdk();
    const provider = this._getProvider(oci);
    const usageClient = new oci.usageapi.UsageapiClient({ authenticationDetailsProvider: provider });

    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);

    const result = await usageClient.requestSummarizedUsages({
      requestSummarizedUsagesDetails: {
        tenantId: env.oci.tenancy,
        timeUsageStarted: start,
        timeUsageEnded: end,
        granularity: "MONTHLY"
      }
    });

    const total = (result.usageAggregation?.items || []).reduce((sum, item) => sum + (item.computedAmount || 0), 0);
    if (!total) return [];

    return [{
      provider: "OCI",
      amount: Math.round(total * 100) / 100,
      currency: "USD",
      isEstimated: false,
      source: "OCI_USAGE_API"
    }];
  }
}

module.exports = OCIAdapter;
