const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const _ = require("lodash");
const generator = require("generate-password");
const utils = require("../utils");

const UserSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        middleName: {
            type: String,
            trim: true,
        },
        userName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
        },
        firstLogin: {
            type: Number,
            default: 1,
            enum: [0, 1, 2],
        },
        userPermission: Array,
        status: {
            type: Number,
            default: 1,
        },
        isSystemAdmin: {
            type: Number,
            default: 0,
        },
        isInstitutionAdmin: {
            type: Number,
            default: 0,
        },
        isLmsAdmin: {
            type: Number,
            default: 0,
        },
        passwordResets: Array,
        candidateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Candidate",
        },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);
UserSchema.index({ "email": 1, "institutionId": 1}, { "unique": true });
UserSchema.index({ "phone": 1, "institutionId": 1}, { "unique": true });
UserSchema.pre("save", function (next) {
    /**
     * if password is not provided, put this bcrypt code for 'password'
     */
    if (!this.password || _.isEmpty(this.password)) {
        let pw = generator.generate({
            length: 12,
            numbers: true,
            uppercase: true,
            lowercase: true,
            symbols: true,
        });
        this.password = utils.hashPassword(pw);
    }
    if(this.password) this.passwordResets.push(this.password);
    this.firstName =
        !_.isEmpty(this.firstName) && this.firstName != null
            ? this.firstName.toUpperCase()
            : "";
    this.lastName =
        !_.isEmpty(this.lastName) && this.lastName != null
            ? this.lastName.toUpperCase()
            : "";
    this.middleName =
        !_.isEmpty(this.middleName) && this.middleName != null
            ? this.middleName.toUpperCase()
            : "";
    this.userName = this.lastName.toLowerCase() + "." + this.firstName.toLowerCase();
    next();
});

UserSchema.pre("updateOne", function () {
    /**
     * here we have access to the query object not the data object because mongoose will query the doc before updating
     * so u can only modify the query object so as to fetch the correct data for the update
     */
    this.set({ firstName: this._update.$set.firstName.toUpperCase() });
    this.set({ lastName: this._update.$set.lastName.toUpperCase() });
    this.set({ middleName: this._update.$set.middleName.toUpperCase() });
    this.set({ userName: this._update.$set.firstName.toUpperCase() });
    this.set({ email: this._update.$set.email.toLowerCase() });
    let u = this._update.$set.lastName + "." + this._update.$set.firstName;
    this.set({ userName: u.toLowerCase() });
});

/* UserSchema.virtual("userName").get(function () {
  let name = "";
  if (parseInt(this.userType) == 1)
    name = this.lastName + " " + this.firstName + " " + this.middleName;
  else name = this.companyName;
  return name;
}); */

/* UserSchema.set("toObject", { virtuals: true });
UserSchema.set("toJSON", { virtuals: true }); */

UserSchema.plugin(mongoosePaginate);
UserSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('User', UserSchema, 'users');
