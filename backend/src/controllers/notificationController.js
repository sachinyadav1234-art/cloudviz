const Notification = require("../models/Notification");
const { success, failure } = require("../utils/response");

async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, readAt: null });
    return success(res, { notifications, unreadCount });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { readAt: new Date() },
      { new: true }
    );
    if (!notification) return failure(res, "NOT_FOUND", "Notification not found", 404);
    return success(res, { notification });
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ userId: req.user.id, readAt: null }, { readAt: new Date() });
    return success(res, {}, "All notifications marked as read");
  } catch (err) { next(err); }
}

module.exports = { listNotifications, markRead, markAllRead };
