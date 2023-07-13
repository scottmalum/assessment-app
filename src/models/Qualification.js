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

module.exports = mongoose.model('Qualification', oSchema, 'qualifications');
