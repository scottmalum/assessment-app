const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const _ = require("lodash");

const oSchema = new mongoose.Schema({
        schoolRegistrationNumber: String,
        jambRegistrationNumber: String,
        school: String,
        programme: String,
        faculty: String,
        department: String,
        course: String,
        level: Number,
        class: String,
        admissionDate: Date,
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
module.exports = mongoose.model('CandidateSchool', oSchema, 'candidate_schools');
