const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/dashboardController");

router.use(authenticate);
router.get("/overview", ctrl.overview);

module.exports = router;
