const AlertRule = require("../models/AlertRule");
const Alert = require("../models/Alert");
const { createNotification } = require("./notificationService");

const DEFAULT_RULES = [
  { metricType: "cpuUsage", operator: ">", threshold: 80, severity: "WARNING" },
  { metricType: "memoryUsage", operator: ">", threshold: 85, severity: "WARNING" },
  { metricType: "storageUsage", operator: ">", threshold: 90, severity: "CRITICAL" }
];

async function ensureDefaultRules(userId) {
  const existing = await AlertRule.countDocuments({ userId });
  if (existing === 0) {
    await AlertRule.insertMany(DEFAULT_RULES.map(r => ({ ...r, userId })));
  }
}

function violates(value, operator, threshold) {
  if (value === null || value === undefined) return false;
  switch (operator) {
    case ">": return value > threshold;
    case "<": return value < threshold;
    case ">=": return value >= threshold;
    case "<=": return value <= threshold;
    case "==": return value === threshold;
    default: return false;
  }
}

async function evaluateAlertsForResource(resource, metric) {
  const rules = await AlertRule.find({ userId: resource.userId, isEnabled: true });
  const results = [];

  for (const rule of rules) {
    const value = metric[rule.metricType];
    if (!violates(value, rule.operator, rule.threshold)) continue;

    // Deduplication: update existing active alert for same resource+metric instead of creating a new one.
    let alert = await Alert.findOne({ resourceId: resource._id, metricType: rule.metricType, status: "ACTIVE" });

    if (alert) {
      alert.currentValue = value;
      alert.lastDetectedAt = new Date();
      alert.occurrenceCount += 1;
      await alert.save();
    } else {
      alert = await Alert.create({
        userId: resource.userId,
        resourceId: resource._id,
        alertRuleId: rule._id,
        provider: resource.provider,
        metricType: rule.metricType,
        severity: rule.severity,
        currentValue: value,
        threshold: rule.threshold,
        status: "ACTIVE",
        message: `${resource.resourceName}: ${rule.metricType} is ${value}% (threshold ${rule.operator} ${rule.threshold}%)`
      });

      await createNotification({
        userId: resource.userId,
        type: "ALERT",
        title: `${rule.severity} alert: ${resource.resourceName}`,
        message: alert.message,
        relatedResourceId: resource._id,
        relatedAlertId: alert._id,
        channel: "EMAIL"
      });
    }
    results.push(alert);
  }

  // Auto-resolve alerts whose metric has recovered below threshold
  const activeAlerts = await Alert.find({ resourceId: resource._id, status: "ACTIVE" });
  for (const alert of activeAlerts) {
    const rule = rules.find(r => r.metricType === alert.metricType);
    const value = metric[alert.metricType];
    if (rule && !violates(value, rule.operator, rule.threshold)) {
      alert.status = "RESOLVED";
      alert.resolvedAt = new Date();
      await alert.save();
      await createNotification({
        userId: resource.userId,
        type: "RECOVERY",
        title: `Recovered: ${resource.resourceName}`,
        message: `${alert.metricType} returned to normal (${value}%)`,
        relatedResourceId: resource._id,
        relatedAlertId: alert._id,
        channel: "IN_APP"
      });
    }
  }

  return results;
}

module.exports = { ensureDefaultRules, evaluateAlertsForResource };
