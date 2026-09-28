const Recommendation = require("../models/Recommendation");
const { success, failure } = require("../utils/response");

async function listRecommendations(req, res, next) {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    const recommendations = await Recommendation.find(filter).sort({ createdAt: -1 }).limit(100).populate("resourceId", "resourceName provider");
    return success(res, { recommendations });
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!["ACKNOWLEDGED", "DISMISSED", "APPLIED", "MONITORING"].includes(status)) {
      return failure(res, "VALIDATION_ERROR", "Invalid status");
    }
    const rec = await Recommendation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { new: true }
    );
    if (!rec) return failure(res, "NOT_FOUND", "Recommendation not found", 404);
    return success(res, { recommendation: rec });
  } catch (err) { next(err); }
}

module.exports = { listRecommendations, updateStatus };
