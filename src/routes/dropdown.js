const router = require("express").Router();
const {
  institutions,
  candidateTypes,
  modules,
  qualifications,
  grades,
  business,
  questionTypes,
} = require("../controllers/dropdown");

router.post("/institutions", institutions);
router.post("/candidateTypes", candidateTypes);
router.post("/modules", modules);
router.post("/qualifications", qualifications);
router.post("/grades", grades);
router.post("/business", business);
router.post("/questionTypes", questionTypes);

module.exports = router;
