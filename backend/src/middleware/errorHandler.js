const logger = require("../utils/logger");

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
}

function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: status === 500 ? "An unexpected error occurred" : err.message
    }
  });
}

module.exports = { notFoundHandler, errorHandler };
