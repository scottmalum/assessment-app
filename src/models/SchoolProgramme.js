const mongoose = require('mongoose');

const oSchema = new mongoose.Schema({
        name: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        }
    }
);

module.exports = mongoose.model('SchoolProgramme', oSchema, 'school_programmes');
