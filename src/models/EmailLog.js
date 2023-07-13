const mongoose = require('mongoose');

const oSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    requestData: Object,
    responseData: Object,
    emailLogStatus: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("EmailLog", oSchema, 'email_logs');
