const mongoose = require("mongoose");

const cloudAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  provider: { type: String, enum: ["AWS", "OCI", "DEMO"], required: true },
  accountName: { type: String, required: true },
  accountIdentifier: { type: String },
  status: { type: String, enum: ["CONNECTED", "DISCONNECTED", "SYNCING", "ERROR", "DISABLED"], default: "DISCONNECTED" },
  region: { type: String },
  lastSyncAt: { type: Date },
  lastSuccessfulSyncAt: { type: Date },
  lastSyncStatus: { type: String },
  lastSyncError: { type: String }
}, { timestamps: true });

cloudAccountSchema.index({ userId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model("CloudAccount", cloudAccountSchema);
