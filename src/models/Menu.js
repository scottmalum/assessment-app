const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const oSchema = new mongoose.Schema({
        menuHeaderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "MenuHeader",
        },
        /*menuPath: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        target: {
            type: String,
        },
        route: {
            type: mongoose.Schema.Types.Mixed,
        },
        href: {
            type: String,
            trim: true,
        },
        icon: {
            type: String,
            trim: true,
        },*/
        forSystemAdmin: {
            type: Number,
            default: 0,
        },
        forInstitutionAdmin: {
            type: Number,
            default: 0,
        },
        menuObject: Array
    }
);

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Menu', oSchema, 'menus');
