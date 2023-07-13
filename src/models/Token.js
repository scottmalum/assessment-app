const mongoose = require('mongoose');

const oSchema = new mongoose.Schema({
        token: {
            type: String,
            unique: true,
            required: true
        },
        data: mongoose.Schema.Types.Mixed,
        expired: {
            type: Number,
            default: 0
        },
        expireAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Token', oSchema, 'tokens');
