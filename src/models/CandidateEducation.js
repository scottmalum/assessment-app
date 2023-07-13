const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const _ = require("lodash");

const oSchema = new mongoose.Schema({
        qualification: String,
        school: String,
        grade: String,
        yearFrom: {
            type: Number,
            default: 0,
        },
        yearTo: {
            type: Number,
            default: 0,
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
module.exports = mongoose.model('CandidateEducation', oSchema, 'candidate_educations');
