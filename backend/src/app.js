const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

const authRoutes = require("./routes/authRoutes");
const cloudRoutes = require("./routes/cloudRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const alertRoutes = require("./routes/alertRoutes");
const costRoutes = require("./routes/costRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const regionRoutes = require("./routes/regionRoutes");

const app = express();

// Render, Vercel, and most PaaS platforms sit the app behind a single reverse proxy hop.
// Without this, express-rate-limit cannot correctly identify per-client IPs behind that
// proxy (req.ip would resolve to the proxy's IP for every request, rate-limiting everyone
// as one client) and modern express-rate-limit versions throw a validation error if a
// X-Forwarded-For header appears while trust proxy is misconfigured.
if (env.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(cors({ origin: env.clientUrl.split(",").map(s => s.trim()), credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use("/api", apiLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "cloudviz-backend", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/cloud-accounts", cloudRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/cost", costRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/regions", regionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
