const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/regionController");

router.use(authenticate);
router.get("/", ctrl.listRegions);

module.exports = router;
