const router = require('express').Router();
const {
    addMenu,
    addInstitutionMenu,
    addUserMenu,
    getMenu,
    getInstitutionMenu,
    getUserMenu,
} = require("../controllers/menu");

const { protect } = require("../middleware/auth");

router.post('/addMenu', protect, addMenu);
router.post('/addInstitutionMenu', protect, addInstitutionMenu);
router.post("/addUserMenu", protect, addUserMenu);
router.post("/getMenu", protect, getMenu);
router.post("/getInstitutionMenu", protect, getInstitutionMenu);
router.post("/getUserMenu", protect, getUserMenu);

module.exports = router;
