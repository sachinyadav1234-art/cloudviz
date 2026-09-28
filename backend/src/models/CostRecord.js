const mongoose = require("mongoose");

const costRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  cloudAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CloudAccount" },
  provider: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
  serviceName: { type: String },
  region: { type: String },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  costType: { type: String, enum: ["COMPUTE", "STORAGE", "NETWORK", "OTHER", "TOTAL"], default: "TOTAL" },
  source: { type: String, enum: ["AWS_BILLING_API", "OCI_USAGE_API", "DEMO_DATA", "MANUAL"], default: "DEMO_DATA" },
  isEstimated: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("CostRecord", costRecordSchema);
