
const fs = require("fs");
const _ = require("lodash");
const generator = require("generate-password");
const strings = require("locutus/php/strings");
const SmsLog = require("../../models/SmsLog");
const utils = require("..");
const time = new Date(Date.now()).toLocaleString();



module.exports = {
  createSmsLog: async (data) => {
    const create = await SmsLog.create(data);
    return create;
  },

  getSmsLog: async (data) => {
    const v = await SmsLog.findOne(data);
    return v;
  },
};