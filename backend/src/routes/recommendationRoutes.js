const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/recommendationController");

router.use(authenticate);
router.get("/", ctrl.listRecommendations);
router.patch("/:id/status", ctrl.updateStatus);

module.exports = router;
