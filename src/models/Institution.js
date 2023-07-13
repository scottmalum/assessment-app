const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const _ = require("lodash");

const oSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            unique: true
        },
        institutionCode: {
            type: String,
            trim: true,
            unique: true
        },
        address: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        logo: String,
        institutionConfig: {
            enable2wa: {
                type: Number,
                default: 0
            },
            anyCanReview: {
                type: Number,
                default: 0
            },
        },
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
        },
        modules: Array,
    },
    { timestamps: true }
);
/*oSchema.index({ "email": 1, "businessId": 1}, { "unique": true });*/
oSchema.pre("save", function (next) {
    /**
     * if password is not provided, put this bcrypt code for 'password'
     */
    this.name =
        !_.isEmpty(this.name) && this.name != null
            ? this.name.toUpperCase()
            : "";
    this.email =
        !_.isEmpty(this.email) && this.email != null
            ? this.email.toLowerCase()
            : "";
    next();
});

oSchema.pre("updateOne", function () {
    /**
     * here we have access to the query object not the data object because mongoose will query the doc before updating
     * so u can only modify the query object so as to fetch the correct data for the update
     */
    this.set({ name: this._update.$set.name.toUpperCase() });
    this.set({ email: this._update.$set.email.toLowerCase() });
});

oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('Institution', oSchema, 'institutions');
