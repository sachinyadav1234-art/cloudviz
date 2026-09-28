const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  alertRuleId: { type: mongoose.Schema.Types.ObjectId, ref: "AlertRule" },
  provider: { type: String },
  metricType: { type: String, required: true },
  severity: { type: String, enum: ["INFO", "WARNING", "CRITICAL"], default: "WARNING" },
  currentValue: { type: Number },
  threshold: { type: Number },
  status: { type: String, enum: ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"], default: "ACTIVE" },
  firstDetectedAt: { type: Date, default: Date.now },
  lastDetectedAt: { type: Date, default: Date.now },
  acknowledgedAt: { type: Date },
  resolvedAt: { type: Date },
  occurrenceCount: { type: Number, default: 1 },
  message: { type: String }
}, { timestamps: true });

alertSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);
