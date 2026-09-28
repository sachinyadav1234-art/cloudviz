const Metric = require("../models/Metric");
const Anomaly = require("../models/Anomaly");

const BASELINE_WINDOW = 12; // last 12 readings (~1 hour at 5-min intervals)
const DEVIATION_THRESHOLD_STD = 2.5; // z-score-like threshold

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
function stdDev(values, avg) {
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

async function detectAnomaliesForResource(resource, latestMetric) {
  const history = await Metric.find({ resourceId: resource._id, cpuUsage: { $ne: null } })
    .sort({ timestamp: -1 })
    .limit(BASELINE_WINDOW)
    .lean();

  if (history.length < 5) return null; // not enough baseline data yet

  const values = history.map(h => h.cpuUsage);
  const baseline = mean(values);
  const sd = stdDev(values, baseline) || 1;
  const current = latestMetric.cpuUsage;
  if (current === null || current === undefined) return null;

  const deviation = Math.abs(current - baseline) / sd;

  if (deviation >= DEVIATION_THRESHOLD_STD) {
    const severity = deviation >= 4 ? "HIGH" : deviation >= 3 ? "MEDIUM" : "LOW";
    const confidence = Math.min(99, Math.round(50 + deviation * 10));

    const anomaly = await Anomaly.create({
      userId: resource.userId,
      resourceId: resource._id,
      provider: resource.provider,
      metricType: "cpuUsage",
      currentValue: current,
      baselineValue: Math.round(baseline * 10) / 10,
      deviation: Math.round(deviation * 100) / 100,
      severity,
      detectionMethod: "STANDARD_DEVIATION",
      confidence,
      status: "ACTIVE"
    });
    return anomaly;
  }
  return null;
}

module.exports = { detectAnomaliesForResource };
