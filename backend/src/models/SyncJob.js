const mongoose = require("mongoose");

const syncJobSchema = new mongoose.Schema({
  cloudAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CloudAccount" },
  provider: { type: String },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  status: { type: String, enum: ["RUNNING", "SUCCESS", "PARTIAL_SUCCESS", "FAILED"], default: "RUNNING" },
  resourcesDiscovered: { type: Number, default: 0 },
  metricsCollected: { type: Number, default: 0 },
  metricsFailed: { type: Number, default: 0 },
  totalLatencyMs: { type: Number, default: 0 },
  errorMessage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("SyncJob", syncJobSchema);
