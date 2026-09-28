const AuditLog = require("../models/AuditLog");
const logger = require("../utils/logger");

// Actions per BACKEND_SCHEMA.md Section 52. Never log passwords, tokens, or cloud secrets.
async function recordAudit({ userId, action, entityType, entityId, metadata, req }) {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      metadata: metadata || {},
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"]
    });
  } catch (err) {
    // Auditing must never break the primary request flow.
    logger.error(`Audit log write failed: ${err.message}`);
  }
}

module.exports = { recordAudit };
