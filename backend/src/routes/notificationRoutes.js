const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/notificationController");

router.use(authenticate);
router.get("/", ctrl.listNotifications);
router.patch("/:id/read", ctrl.markRead);
router.patch("/read-all", ctrl.markAllRead);

module.exports = router;
