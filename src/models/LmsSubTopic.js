const mongoose = require('mongoose');

const subTopicSchema = new mongoose.Schema({
        name: String,
        code: String,
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "LmsSubject",
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "LmsSubjectTopic",
        },
        tags: Array,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true });

subTopicSchema.index({ "name": 1, "topicId": 1}, { "unique": true });
subTopicSchema.index({ "code": 1, "topicId": 1}, { "unique": true });
module.exports = mongoose.model('LmsSubTopic', subTopicSchema, 'lms_sub_topics');
