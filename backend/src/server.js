const app = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");
const { connectDatabase } = require("./config/database");
const { startScheduler, stopScheduler } = require("./jobs/scheduler");

async function start() {
  await connectDatabase();

  const server = app.listen(env.port, "0.0.0.0", () => {
    logger.info(`CloudViz backend listening on port ${env.port} (${env.nodeEnv})`);
    logger.info(`Demo Mode: ${env.demoMode ? "ENABLED" : "DISABLED"}`);
  });

  startScheduler();

  const shutdown = (signal) => {
    logger.info(`${signal} received - shutting down gracefully`);
    stopScheduler();
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  logger.error(`Failed to start CloudViz backend: ${err.message}`);
  process.exit(1);
});
