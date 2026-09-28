const { getOverview } = require("../services/dashboardService");
const { success } = require("../utils/response");

async function overview(req, res, next) {
  try {
    const data = await getOverview(req.user.id);
    return success(res, data);
  } catch (err) { next(err); }
}

module.exports = { overview };
