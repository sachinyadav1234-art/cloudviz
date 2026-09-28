const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  action: { type: String, required: true },
  entityType: { type: String },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
