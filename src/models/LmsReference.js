const mongoose = require('mongoose');

const topicReferenceSchema = new mongoose.Schema({
        title: String,
        url: String,
        author: String,
        fileType: String,
        fileSizeInKb: Number,
        publicationYear: Number,
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
        subTopicId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "LmsSubTopic",
        },
        tags: Array,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true });

topicReferenceSchema.index({ "title": 1, "subTopicId": 1, "author": 1}, { "unique": true });
module.exports = mongoose.model('LmsReference', topicReferenceSchema, 'lms_references');
