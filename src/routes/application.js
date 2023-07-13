const router = require("express").Router();
const {
  add,
  update,
  list,
  getApplication,
  remove,
  addStage,
  updateStage,
  listStage,
  getStage,
  removeStage,
  addPermission,
  updatePermission,
  listPermission,
  removePermission,
  getPermission,
  addDocType,
  updateDocType,
  listDocType,
  removeDocType,
  getDocType,
} = require("../controllers/application");

const { protect } = require("../middleware/auth");

router.post("/add", protect, add);
router.post("/update", protect, update);
router.post("/list", protect, list);
router.post("/delete", protect, remove);
router.post("/addStage", protect, addStage);
router.post("/updateStage", protect, updateStage);
router.post("/listStage", protect, listStage);
router.post("/removeStage", protect, removeStage);
router.post("/addPermission", protect, addPermission);
router.post("/updatePermission", protect, updatePermission);
router.post("/listPermission", protect, listPermission);
router.post("/removePermission", protect, removePermission);
router.post("/addDocType", protect, addDocType);
router.post("/updateDocType", protect, updateDocType);
router.post("/listDocType", protect, listDocType);
router.post("/removeDocType", protect, removeDocType);

router.post("/single", protect, getApplication);
router.post("/stage/single", protect, getStage);
router.post("/permission/single", protect, getPermission);
router.post("/docType/single", protect, getDocType);

module.exports = router;
