const mongoose = require('mongoose');

const lmsSubjectTopicSchema = new mongoose.Schema({
        name: String,
        code: String,
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "LmsSubject",
        },
        status: {
            type: Number,
            default: 1,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true });

lmsSubjectTopicSchema.index({ "name": 1, "subjectId": 1}, { "unique": true });
lmsSubjectTopicSchema.index({ "code": 1, "subjectId": 1}, { "unique": true });
module.exports = mongoose.model('LmsSubjectTopic', lmsSubjectTopicSchema, 'lms_subject_topics');
