const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/resourceController");

router.use(authenticate);
router.get("/", ctrl.listResources);
router.get("/:id", ctrl.getResource);
router.get("/:id/metrics", ctrl.getResourceMetrics);

module.exports = router;
