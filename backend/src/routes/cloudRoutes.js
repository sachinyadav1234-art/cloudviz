const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/cloudController");

router.use(authenticate);
router.get("/", ctrl.listAccounts);
router.post("/", ctrl.connectAccount);
router.post("/:id/test", ctrl.testAccount);
router.post("/:id/sync", ctrl.syncAccount);
router.delete("/:id", ctrl.deleteAccount);

module.exports = router;
