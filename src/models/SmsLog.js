const mongoose = require('mongoose');

const oSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
    },
    requestData: Object,
    responseData: Object,
    smsLogStatus: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("SmsLog", oSchema, 'sms_logs');
