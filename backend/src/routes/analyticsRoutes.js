const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/analyticsController");

router.use(authenticate);
router.get("/comparison", ctrl.comparison);
router.get("/anomalies", ctrl.anomalies);

module.exports = router;
