const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  provider: { type: String },
  type: { type: String, enum: ["UNDER_UTILIZATION", "OVER_UTILIZATION", "STORAGE_PRESSURE", "ANOMALY_REVIEW", "WORKLOAD_IMBALANCE"], required: true },
  title: { type: String, required: true },
  observation: { type: String },
  recommendation: { type: String },
  reason: { type: String },
  evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
  confidence: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
  potentialImpact: { type: String },
  status: { type: String, enum: ["OPEN", "ACKNOWLEDGED", "DISMISSED", "APPLIED", "MONITORING"], default: "OPEN" },
  algorithmVersion: { type: String, default: "v1" }
}, { timestamps: true });

recommendationSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Recommendation", recommendationSchema);
