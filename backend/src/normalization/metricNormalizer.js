/**
 * Converts provider-specific metric responses into the CloudViz canonical model.
 * Canonical shape:
 * { cpuUsage, memoryUsage, storageUsage, networkIn, networkOut, status, timestamp }
 * Missing values must be null, never fabricated.
 */

function clamp(value, min, max) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
}

function normalizeFromAWS(raw) {
  return {
    cpuUsage: clamp(raw.CPUUtilization ?? null, 0, 100),
    memoryUsage: clamp(raw.MemoryUtilization ?? null, 0, 100),
    storageUsage: clamp(raw.DiskUtilization ?? null, 0, 100),
    networkIn: raw.NetworkIn ?? null,
    networkOut: raw.NetworkOut ?? null,
    status: raw.InstanceState || "unknown",
    timestamp: raw.Timestamp ? new Date(raw.Timestamp) : new Date()
  };
}

function normalizeFromOCI(raw) {
  return {
    cpuUsage: clamp(raw.CpuUtilization ?? null, 0, 100),
    memoryUsage: clamp(raw.MemoryUtilization ?? null, 0, 100),
    storageUsage: clamp(raw.DiskUtilization ?? null, 0, 100),
    networkIn: raw.NetworksBytesIn ?? null,
    networkOut: raw.NetworksBytesOut ?? null,
    status: raw.lifecycleState || "unknown",
    timestamp: raw.timestamp ? new Date(raw.timestamp) : new Date()
  };
}

function normalizeFromDemo(raw) {
  // Demo generator already emits canonical field names.
  return {
    cpuUsage: clamp(raw.cpuUsage ?? null, 0, 100),
    memoryUsage: clamp(raw.memoryUsage ?? null, 0, 100),
    storageUsage: clamp(raw.storageUsage ?? null, 0, 100),
    networkIn: raw.networkIn ?? null,
    networkOut: raw.networkOut ?? null,
    status: raw.status || "running",
    timestamp: raw.timestamp ? new Date(raw.timestamp) : new Date()
  };
}

function normalizeMetric(provider, raw) {
  switch (provider) {
    case "AWS": return normalizeFromAWS(raw);
    case "OCI": return normalizeFromOCI(raw);
    case "DEMO": return normalizeFromDemo(raw);
    default: throw new Error(`Unsupported provider for normalization: ${provider}`);
  }
}

function validateMetric(metric) {
  const fields = ["cpuUsage", "memoryUsage", "storageUsage"];
  for (const field of fields) {
    const v = metric[field];
    if (v !== null && (v < 0 || v > 100)) return { valid: false, reason: `${field} out of range: ${v}` };
  }
  if (metric.networkIn !== null && metric.networkIn < 0) return { valid: false, reason: "networkIn negative" };
  if (metric.networkOut !== null && metric.networkOut < 0) return { valid: false, reason: "networkOut negative" };
  return { valid: true };
}

module.exports = { normalizeMetric, validateMetric };
