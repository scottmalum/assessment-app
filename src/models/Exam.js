const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const _ = require("lodash");

const config = {
    shuffleQuestions: {
        type: Boolean,
        default: true,
    },
    shuffleAnswers: {
        type: Boolean,
        default: true,
    },
    enablePreview: {
        type: Boolean,
        default: true,
    },
    showResultOnFinish: {
        type: Boolean,
        default: true,
    },
    showReferenceOnFinish: {
        type: Boolean,
        default: true,
    },
    showStrengthWeaknessOnFinish: {
        type: Boolean,
        default: true,
    },
    showQuestionTopics: {
        type: Boolean,
        default: true,
    },
};

const oSchema = new mongoose.Schema({
        name: String,
        code: String,
        date: Date,
        durationInMinutes: Number,
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Institution",
        },
        config,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);
oSchema.index({ "name": 1, "institutionId": 1}, { "unique": true });
oSchema.index({ "code": 1, "institutionId": 1}, { "unique": true });

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('Exam', oSchema, 'exams');
