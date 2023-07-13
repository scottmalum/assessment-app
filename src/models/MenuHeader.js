const mongoose = require('mongoose');

const oSchema = new mongoose.Schema({
        name: {
            type: String,
            trim: true,
            unique: true,
        },
    }
);

module.exports = mongoose.model('MenuHeader', oSchema, 'menu_headers');
