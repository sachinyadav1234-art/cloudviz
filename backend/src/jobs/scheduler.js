const cron = require("node-cron");
const env = require("../config/env");
const logger = require("../utils/logger");
const { runMonitoringCycle } = require("./monitoringJob");

let task = null;

function startScheduler() {
  if (task) return task;
  task = cron.schedule(env.monitoringCron, () => {
    runMonitoringCycle();
  });
  logger.info(`Scheduler started with interval "${env.monitoringCron}"`);
  return task;
}

function stopScheduler() {
  if (task) {
    task.stop();
    logger.info("Scheduler stopped");
  }
}

module.exports = { startScheduler, stopScheduler };
