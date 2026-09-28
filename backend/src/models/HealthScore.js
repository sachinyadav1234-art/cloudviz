const mongoose = require("mongoose");

const healthScoreSchema = new mongoose.Schema({
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now },
  overallScore: { type: Number, required: true },
  cpuScore: { type: Number },
  memoryScore: { type: Number },
  storageScore: { type: Number },
  networkScore: { type: Number },
  availabilityScore: { type: Number },
  classification: { type: String, enum: ["EXCELLENT", "HEALTHY", "WARNING", "CRITICAL"], required: true },
  calculationVersion: { type: String, default: "v1" }
}, { timestamps: { createdAt: true, updatedAt: false } });

healthScoreSchema.index({ resourceId: 1, timestamp: -1 });

module.exports = mongoose.model("HealthScore", healthScoreSchema);
