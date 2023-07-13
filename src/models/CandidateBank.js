const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const _ = require("lodash");

const oSchema = new mongoose.Schema({
    accountName: String,
    accountNumber: String,
    grade: String,
    accountType: String,
    cbnCode: String,
    bvn: String,
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
module.exports = mongoose.model('CandidateBank', oSchema, 'candidate_banks');
