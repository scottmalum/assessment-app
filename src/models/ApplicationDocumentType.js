const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const oSchema = new mongoose.Schema({
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
        institutionDocumentTypes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "InstitutionDocumentType",
        }],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true });
oSchema.index({ "institutionId": 1, "applicationId": 1}, { "unique": true });

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('ApplicationDocumentType', oSchema, 'application_document_types');
