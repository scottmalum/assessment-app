const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const oSchema = new mongoose.Schema({
        name: String,
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Institution",
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Subject",
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "SubjectTopic",
        },
        tags: Array,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true });

oSchema.index({ "name": 1, "topicId": 1}, { "unique": true });
oSchema.index({ "code": 1, "topicId": 1}, { "unique": true });

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('SubTopic', oSchema, 'sub_topics');
