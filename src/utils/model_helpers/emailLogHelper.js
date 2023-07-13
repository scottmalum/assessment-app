
const fs = require("fs");
const _ = require("lodash");
const generator = require("generate-password");
const strings = require("locutus/php/strings");
const EmailLog = require("../../models/EmailLog");
const utils = require("..");
const time = new Date(Date.now()).toLocaleString();



module.exports = {
  createEmailLog: async (data) => {
    const create = await EmailLog.create(data);
    return create;
  },

  getEmailLog: async (data) => {
    const v = await EmailLog.findOne(data);
    return v;
  },
};