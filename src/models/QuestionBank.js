const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const _ = require("lodash");

const oSchema = new mongoose.Schema({
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Institution",
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "InstitutionSubject",
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "InstitutionSubjectTopic",
        },
        subTopicId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "InstitutionSubTopic",
        },
        questionType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QuestionType",
        },
        question: String,
        options: Array,
        answer: {
            type: mongoose.Schema.Types.Mixed
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);
oSchema.index({ "subTopicId": 1, "question": 1}, { "unique": true });

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('QuestionBank', oSchema, 'question_bank');
