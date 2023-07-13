const router = require('express').Router();
const { mail } = require("../controllers/communication");
const { protect } = require("../middleware/auth");

router.post("/mail", protect, mail);

module.exports = router;
