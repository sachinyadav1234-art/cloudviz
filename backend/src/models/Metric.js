const mongoose = require("mongoose");

const metricSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  provider: { type: String, enum: ["AWS", "OCI", "DEMO"], required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  cpuUsage: { type: Number, default: null },
  memoryUsage: { type: Number, default: null },
  storageUsage: { type: Number, default: null },
  networkIn: { type: Number, default: null },
  networkOut: { type: Number, default: null },
  status: { type: String },
  source: { type: String, enum: ["AWS_CLOUDWATCH", "OCI_MONITORING", "DEMO_GENERATOR"], default: "DEMO_GENERATOR" }
}, { timestamps: { createdAt: true, updatedAt: false } });

metricSchema.index({ resourceId: 1, timestamp: -1 });

module.exports = mongoose.model("Metric", metricSchema);
