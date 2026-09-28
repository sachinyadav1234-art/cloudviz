const path = require("path");
const dotenv = require("dotenv");

// Explicitly load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Fallback for default environment resolution
dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "dev_only_insecure_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  demoMode: (process.env.DEMO_MODE || "true").toLowerCase() === "true",
  monitoringCron: process.env.MONITORING_CRON || "*/5 * * * *",
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "ap-south-1",
    enableCostExplorer: (process.env.AWS_ENABLE_COST_EXPLORER || "false").toLowerCase() === "true"
  },
  oci: {
    tenancy: process.env.OCI_TENANCY || "",
    userId: process.env.OCI_USER_ID || "",
    fingerprint: process.env.OCI_FINGERPRINT || "",
    privateKeyPath: process.env.OCI_PRIVATE_KEY_PATH || "",
    region: process.env.OCI_REGION || ""
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: (process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    fromEmail: process.env.ALERT_FROM_EMAIL || "CloudViz Alerts <alerts@example.com>"
  }
};
