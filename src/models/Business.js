const mongoose = require('mongoose');

const oSchema = new mongoose.Schema({
        name: {
            type: String,
            trim: true,
            unique: true,
        },
        email: {
            type: String,
            trim: true,
            unique: true,
        },
        phone: {
            type: String,
            trim: true,
            unique: true,
        },
        address: String,
    }
);

module.exports = mongoose.model('Business', oSchema, 'businesses');
