const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/costController");

router.use(authenticate);
router.get("/", ctrl.getCost);
router.post("/refresh", ctrl.refreshCost);

module.exports = router;
