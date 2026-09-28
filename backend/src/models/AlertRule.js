const mongoose = require("mongoose");

const alertRuleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  metricType: { type: String, enum: ["cpuUsage", "memoryUsage", "storageUsage"], required: true },
  operator: { type: String, enum: [">", "<", ">=", "<=", "=="], default: ">" },
  threshold: { type: Number, required: true },
  severity: { type: String, enum: ["INFO", "WARNING", "CRITICAL"], default: "WARNING" },
  isEnabled: { type: Boolean, default: true },
  notificationEnabled: { type: Boolean, default: true },
  cooldownMinutes: { type: Number, default: 15 }
}, { timestamps: true });

module.exports = mongoose.model("AlertRule", alertRuleSchema);
