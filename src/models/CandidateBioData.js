const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const _ = require("lodash");

const oSchema = new mongoose.Schema(
    {
        homeState: {
            type: String,
            trim: true,
        },
        homeLga: {
            type: String,
            trim: true,
        },
        homeTown: {
            type: String,
            trim: true,
        },
        homeAddress: {
            type: String,
            trim: true,
        },
        residenceState: {
            type: String,
            trim: true,
        },
        residenceLga: {
            type: String,
            trim: true,
        },
        residenceTown: {
            type: String,
            trim: true,
        },
        residenceAddress: {
            type: String,
            trim: true,
        },
        dateOfBirth: {
            type: Date,
            trim: true,
        },
        occupation: {
            type: String,
            trim: true,
        },
        nin: {
            type: String,
            trim: true,
        },
        nationalIdCardNumber: {
            type: String,
            trim: true,
        },
        maritalStatus: {
            type: String,
            trim: true,
        },
        candidateId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Candidate",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true }
);

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('CandidateBioData', oSchema, 'candidate_bio_data');
