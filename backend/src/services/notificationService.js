const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../utils/logger");
const Notification = require("../models/Notification");
const User = require("../models/User");

let transporter = null;
function getTransporter() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.password) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.password }
    });
  }
  return transporter;
}

async function createNotification({ userId, type, title, message, relatedResourceId, relatedAlertId, relatedRecommendationId, channel }) {
  const notification = await Notification.create({
    userId, type, title, message, relatedResourceId, relatedAlertId, relatedRecommendationId,
    channel: channel || "IN_APP",
    status: "PENDING"
  });

  if (channel === "EMAIL") {
    await sendEmail(notification);
  } else {
    notification.status = "SENT";
    notification.sentAt = new Date();
    await notification.save();
  }
  return notification;
}

async function sendEmail(notification) {
  const t = getTransporter();
  if (!t) {
    // No SMTP configured - fall back to console log (Demo Email Mode, see TRD Section 30).
    logger.info(`[DEMO EMAIL] To user ${notification.userId}: ${notification.title} - ${notification.message}`);
    notification.status = "SENT";
    notification.sentAt = new Date();
    await notification.save();
    return;
  }
  try {
    const user = await User.findById(notification.userId).lean();
    if (!user) return;
    await t.sendMail({
      from: env.smtp.fromEmail,
      to: user.email,
      subject: `CloudViz — ${notification.title}`,
      text: notification.message
    });
    notification.status = "SENT";
    notification.sentAt = new Date();
    await notification.save();
  } catch (err) {
    logger.error(`Email send failed: ${err.message}`);
    notification.status = "FAILED";
    await notification.save();
  }
}

module.exports = { createNotification };
