const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/alertController");

router.use(authenticate);
router.get("/", ctrl.listAlerts);
router.get("/rules", ctrl.listRules);
router.post("/rules", ctrl.createRule);
router.patch("/:id/acknowledge", ctrl.acknowledge);
router.patch("/:id/resolve", ctrl.resolve);

module.exports = router;
