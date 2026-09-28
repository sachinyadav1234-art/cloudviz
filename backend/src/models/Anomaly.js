const mongoose = require("mongoose");

const anomalySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  provider: { type: String },
  metricType: { type: String, required: true },
  detectedAt: { type: Date, default: Date.now },
  currentValue: { type: Number },
  baselineValue: { type: Number },
  deviation: { type: Number },
  severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
  detectionMethod: { type: String, default: "STANDARD_DEVIATION" },
  confidence: { type: Number },
  status: { type: String, enum: ["ACTIVE", "ACKNOWLEDGED", "RESOLVED", "FALSE_POSITIVE"], default: "ACTIVE" },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Anomaly", anomalySchema);
