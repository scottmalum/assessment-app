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
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Exam",
        },
        permission: Array,
        allExams: {
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
oSchema.index({ "userId": 1, "examId": 1}, { "unique": true });
module.exports = mongoose.model('ExamUserPermission', oSchema, 'exam_user_permissions');
