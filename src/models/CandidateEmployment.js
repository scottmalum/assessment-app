const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const _ = require("lodash");

const oSchema = new mongoose.Schema({
        employmentNumber: String,
        dateOfFirstAppointment: Date,
        ministry: String,
        department: String,
        salaryStructure: String,
        gradeLevel: String,
        step: Number,
        designation: String,
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
)

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('CandidateEmployment', oSchema, 'candidate_employments');
