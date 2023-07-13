const router = require("express").Router();
const {
    add,
    list,
    update,
    remove,
    addTopic,
    listTopics,
    updateTopic,
    removeTopic,
    addSubTopic,
    listSubTopics,
    updateSubTopic,
    removeSubTopic,
    getSubject,
    getTopic,
    getSubTopic
} = require("../controllers/subject");

const { protect } = require("../middleware/auth");

router.post("/add", protect, add);
router.post("/list", protect, list);
router.post("/update", protect, update);
router.post("/remove", protect, remove);
router.post("/single", protect, getSubject);

//Topics Routes
router.post("/topic/add", protect, addTopic);
router.post("/topic/list", protect, listTopics);
router.post("/topic/update", protect, updateTopic);
router.post("/topic/remove", protect, removeTopic);
router.post("/topic/single", protect, getTopic);

//SubTopics Route
router.post("/subTopic/add", protect, addSubTopic);
router.post("/subTopic/list", protect, listSubTopics);
router.post("/subTopic/update", protect, updateSubTopic);
router.post("/subTopic/remove", protect, removeSubTopic);
router.post("/subTopic/single", protect, getSubTopic);

module.exports = router;