const mongoose = require('mongoose');

const lmsSubjectSchema = new mongoose.Schema({
        name: {
            type: String,
            unique: true
        },
        code: String,
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

module.exports = mongoose.model('LmsSubject', lmsSubjectSchema, 'lms_subjects');
