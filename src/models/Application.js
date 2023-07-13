const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const documentsRequired = {
  name: String,
  maxFileSizeInKb: {
    type: Number,
    default: 2000,
  },
  allowedExtensions: Array,
};

const oSchema = new mongoose.Schema(
  {
    name: String,
    startDate: Date,
    endDate: Date,
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Institution",
    },
    expired: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    documentsRequired,
  },
  { timestamps: true }
);

oSchema.index({ name: 1, institutionId: 1 }, { unique: true });
oSchema.plugin(mongoosePaginate);
oSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("Application", oSchema, "applications");
