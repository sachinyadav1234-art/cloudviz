const User = require("../models/User");
const { syncAllAccountsForUser } = require("../services/syncService");
const logger = require("../utils/logger");

let running = false;

async function runMonitoringCycle() {
  if (running) {
    logger.warn("Monitoring cycle already running - skipping this tick to avoid overlap");
    return;
  }
  running = true;
  const startedAt = Date.now();
  try {
    const users = await User.find({ isActive: true }).select("_id");
    for (const user of users) {
      await syncAllAccountsForUser(user._id);
    }
    logger.info(`Monitoring cycle completed for ${users.length} user(s) in ${Date.now() - startedAt}ms`);
  } catch (err) {
    logger.error(`Monitoring cycle failed: ${err.message}`);
  } finally {
    running = false;
  }
}

module.exports = { runMonitoringCycle };
