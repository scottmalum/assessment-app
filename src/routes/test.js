const router = require('express').Router();
const { start } = require("../controllers/test");

router.get("/start", start);

module.exports = router;
