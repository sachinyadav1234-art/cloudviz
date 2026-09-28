const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["ALERT", "ANOMALY", "RECOMMENDATION", "RECOVERY", "SYSTEM"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedResourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
  relatedAlertId: { type: mongoose.Schema.Types.ObjectId, ref: "Alert" },
  relatedRecommendationId: { type: mongoose.Schema.Types.ObjectId, ref: "Recommendation" },
  channel: { type: String, enum: ["IN_APP", "EMAIL"], default: "IN_APP" },
  status: { type: String, enum: ["PENDING", "SENT", "FAILED"], default: "PENDING" },
  sentAt: { type: Date },
  readAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
