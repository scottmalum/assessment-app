const router = require("express").Router();
const {
  addAdmin,
  updateAdmin,
  getSystemAdmin,
  getInstitutionAdmin
} = require("../controllers/user");
const { protect } = require("../middleware/auth");

router.post("/add", addAdmin);
router.post("/update", protect, updateAdmin);
router.post("/institution/single", protect, getInstitutionAdmin);
router.post("/system/single", protect, getSystemAdmin);

module.exports = router;
