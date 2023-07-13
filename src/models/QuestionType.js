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

module.exports = mongoose.model('QuestionType', oSchema, 'question_types');
