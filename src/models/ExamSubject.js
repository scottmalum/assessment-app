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
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Exam",
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "InstitutionSubject",
        },
        subjectMark: Number,
        subjectNumberOfQuestions: Number,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);
oSchema.index({ "examId": 1, "subjectId": 1}, { "unique": true });

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('ExamSubject', oSchema, 'exam_subjects');
