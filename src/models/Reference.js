const mongoose = require('mongoose');

const topicReferenceSchema = new mongoose.Schema({
        title: String,
        url: String,
        author: String,
        fileType: String,
        fileSizeInKb: Number,
        publicationYear: Number,
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
        tags: Array,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true });

topicReferenceSchema.index({ "title": 1, "InstitutionSubTopic": 1, "author": 1}, { "unique": true });
module.exports = mongoose.model('InstitutionReference', topicReferenceSchema, 'institution_references');
