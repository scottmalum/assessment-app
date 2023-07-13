const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

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
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Application",
        },
        applicationStageId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "ApplicationStage",
        },
        stageLevel: Number,
        permission: Array,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true }
);
oSchema.index({ "userId": 1, "applicationStageId": 1}, { "unique": true });
oSchema.index({ "userId": 1, "applicationStageId": 1, "stageLevel": 1}, { "unique": true });

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('ApplicationUserPermission', oSchema, 'application_user_permissions');
