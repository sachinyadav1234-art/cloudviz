const Alert = require("../models/Alert");
const AlertRule = require("../models/AlertRule");
const { success, failure } = require("../utils/response");

async function listAlerts(req, res, next) {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100).populate("resourceId", "resourceName provider region");
    return success(res, { alerts });
  } catch (err) { next(err); }
}

async function listRules(req, res, next) {
  try {
    const rules = await AlertRule.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return success(res, { rules });
  } catch (err) { next(err); }
}

async function createRule(req, res, next) {
  try {
    const { metricType, operator, threshold, severity } = req.body;
    if (!metricType || !threshold) return failure(res, "VALIDATION_ERROR", "metricType and threshold are required");
    const rule = await AlertRule.create({ userId: req.user.id, metricType, operator: operator || ">", threshold, severity: severity || "WARNING" });
    return success(res, { rule }, "Alert rule created", 201);
  } catch (err) { next(err); }
}

async function acknowledge(req, res, next) {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
      { new: true }
    );
    if (!alert) return failure(res, "NOT_FOUND", "Alert not found", 404);
    return success(res, { alert });
  } catch (err) { next(err); }
}

async function resolve(req, res, next) {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: "RESOLVED", resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return failure(res, "NOT_FOUND", "Alert not found", 404);
    return success(res, { alert });
  } catch (err) { next(err); }
}

module.exports = { listAlerts, listRules, createRule, acknowledge, resolve };
