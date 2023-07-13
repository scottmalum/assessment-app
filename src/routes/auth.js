const router = require('express').Router();
const {
  login,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/auth");

router.post('/login', login);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);
router.post("/changePassword", changePassword);

module.exports = router;
