const { refreshDemoCost, getCostSummary } = require("../services/costEngine");
const CloudAccount = require("../models/CloudAccount");
const { success, failure } = require("../utils/response");

async function getCost(req, res, next) {
  try {
    const summary = await getCostSummary(req.user.id);
    return success(res, summary);
  } catch (err) { next(err); }
}

async function refreshCost(req, res, next) {
  try {
    const demoAccount = await CloudAccount.findOne({ userId: req.user.id, provider: "DEMO" });
    if (!demoAccount) return failure(res, "NO_DEMO_ACCOUNT", "Connect Demo Mode first to generate demo cost data, or configure live AWS/OCI billing.");
    const records = await refreshDemoCost(req.user.id);
    return success(res, { records }, "Cost data refreshed");
  } catch (err) { next(err); }
}

module.exports = { getCost, refreshCost };
