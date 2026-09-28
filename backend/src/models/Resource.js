const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  cloudAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CloudAccount", required: true, index: true },
  provider: { type: String, enum: ["AWS", "OCI", "DEMO"], required: true },
  resourceId: { type: String, required: true },
  resourceName: { type: String, required: true },
  resourceType: { type: String, enum: ["COMPUTE", "STORAGE", "NETWORK"], required: true },
  region: { type: String },
  status: { type: String, enum: ["RUNNING", "STOPPED", "ERROR", "UNKNOWN"], default: "UNKNOWN" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true },
  lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

resourceSchema.index({ cloudAccountId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model("Resource", resourceSchema);
