const mongoose = require('mongoose');

const oSchema = new mongoose.Schema({
        name: String,
    }
);

module.exports = mongoose.model('CandidateType', oSchema, 'candidate_types');
