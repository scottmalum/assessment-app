const mongoose = require('mongoose');

const oSchema = new mongoose.Schema({
        name: String,
        code: String,
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Institution",
        },
        ministryId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Ministry",
        },
        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Department",
        },
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
oSchema.index({ "name": 1, "departmentId": 1}, { "unique": true });
oSchema.index({ "code": 1, "departmentId": 1}, { "unique": true });

module.exports = mongoose.model('Unit', oSchema, 'units');
