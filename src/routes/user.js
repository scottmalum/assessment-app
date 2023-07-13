const router = require("express").Router();
const {
  listUsers,
  addUser,
  updateUser,
  getUser
} = require("../controllers/user");
const { protect } = require("../middleware/auth");

router.post("/add", protect, addUser);
router.post("/update", protect, updateUser);
router.post("/list", protect, listUsers);
router.post("/single", protect, getUser);

module.exports = router;
