const mongoose = require('mongoose');

const oSchema = new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Institution",
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InstitutionSubject",
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InstitutionSubjectTopic",
        },
        subTopicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InstitutionSubTopic",
        },
        permission: Array,
        allSubjects: {
            type: Number,
            default: 0
        },
        allTopics: {
            type: Number,
            default: 0
        },
        allSubTopics: {
            type: Number,
            default: 0
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true }
);
oSchema.index({ "userId": 1, "subjectId": 1, "topicId": 1, "subTopicId": 1}, { "unique": true });
module.exports = mongoose.model('QuestionUserPermission', oSchema, 'question_user_permissions');
