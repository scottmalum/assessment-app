const mongoose = require('mongoose');

const oSchema = new mongoose.Schema(
  {
    deletedModel: {
      type: String,
      required: true,
    },
    deletedData: Object,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeletedData", oSchema, 'deleted_data');
