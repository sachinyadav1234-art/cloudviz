/**
 * Convenience script: creates a demo user (if missing) and connects + syncs
 * Demo Mode immediately, so a fresh deployment has visible data right away
 * instead of waiting for someone to click through the UI.
 *
 * Usage: npm run seed:demo
 * Requires MONGODB_URI to already be set in .env.
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDatabase } = require("../config/database");
const User = require("../models/User");
const CloudAccount = require("../models/CloudAccount");
const { syncCloudAccount } = require("../services/syncService");
const logger = require("../utils/logger");

const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL || "demo@cloudviz.local";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "demopassword123";
const DEMO_NAME = "CloudViz Demo";

async function run() {
  const conn = await connectDatabase();
  if (!conn) {
    logger.error("MONGODB_URI is not set - cannot seed. Set it in backend/.env first.");
    process.exit(1);
  }

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    user = await User.create({ name: DEMO_NAME, email: DEMO_EMAIL, passwordHash });
    logger.info(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } else {
    logger.info(`Demo user already exists: ${DEMO_EMAIL}`);
  }

  let account = await CloudAccount.findOne({ userId: user._id, provider: "DEMO" });
  if (!account) {
    account = await CloudAccount.create({
      userId: user._id,
      provider: "DEMO",
      accountName: "Demo Environment",
      status: "CONNECTED"
    });
    logger.info("Created Demo Mode cloud account");
  }

  logger.info("Running initial sync (resources, metrics, health, alerts, recommendations)...");
  const job = await syncCloudAccount(account);
  logger.info(`Seed sync complete: ${job.resourcesDiscovered} resources, ${job.metricsCollected} metrics, status=${job.status}`);

  logger.info(`\nDone. Log in with:\n  Email:    ${DEMO_EMAIL}\n  Password: ${DEMO_PASSWORD}`);
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
