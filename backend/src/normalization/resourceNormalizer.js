/**
 * Converts provider-specific resource descriptions into the CloudViz canonical resource model.
 */
function normalizeResource(provider, raw) {
  if (provider === "AWS") {
    return {
      provider: "AWS",
      resourceId: raw.InstanceId,
      resourceName: raw.Tags?.Name || raw.InstanceId,
      resourceType: "COMPUTE",
      region: raw.Region,
      status: (raw.State || "unknown").toUpperCase() === "RUNNING" ? "RUNNING" : "STOPPED",
      metadata: { instanceType: raw.InstanceType, os: raw.Platform || "Linux" }
    };
  }
  if (provider === "OCI") {
    return {
      provider: "OCI",
      resourceId: raw.id,
      resourceName: raw.displayName,
      resourceType: "COMPUTE",
      region: raw.region,
      status: (raw.lifecycleState || "unknown").toUpperCase() === "RUNNING" ? "RUNNING" : "STOPPED",
      metadata: { shape: raw.shape }
    };
  }
  if (provider === "DEMO") {
    return {
      provider: "DEMO",
      resourceId: raw.resourceId,
      resourceName: raw.resourceName,
      resourceType: raw.resourceType || "COMPUTE",
      region: raw.region,
      status: (raw.status || "running").toUpperCase() === "RUNNING" ? "RUNNING" : "STOPPED",
      metadata: raw.metadata || {}
    };
  }
  throw new Error(`Unsupported provider for resource normalization: ${provider}`);
}

module.exports = { normalizeResource };
