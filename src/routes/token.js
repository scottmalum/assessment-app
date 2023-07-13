const router = require("express").Router();
const {
  add,
  getToken,
  update,
  remove,
  isActive,
  disable
} = require("../controllers/token");

const { protect } = require("../middleware/auth");

router.post("/add", add);
router.post("/single", getToken);
router.post("/status", isActive);
router.post("/disable", disable);
router.post("/update", update);
router.post("/delete", protect, remove);

module.exports = router;
