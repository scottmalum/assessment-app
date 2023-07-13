const fs = require("fs");
const _ = require("lodash");
const moment = require("moment");
const strings = require("locutus/php/strings");
const Institution = require("../../models/Institution");
const CandidateType = require("../../models/CandidateType");
const Module = require("../../models/Module");
const Qualification = require("../../models/Qualification");
const Grade = require("../../models/Grade");
const Business = require("../../models/Business");
const QuestionType = require("../../models/QuestionType");
const utils = require("../");
const { is_null } = require("locutus/php/var");
const time = new Date(Date.now()).toLocaleString();

module.exports = {
  getCandidateType: async () => {
    return CandidateType.find().select("_id name");
  },
  getInstitution: async () => {
    return Institution.find().select("_id name");
  },

  getModules: async () => {
    return Module.find().select("_id name");
  },

  getQualifications: async () => {
    return Qualification.find().select("_id name");
  },

  getGrades: async () => {
    return Grade.find().select("_id name");
  },

  getBusiness: async () => {
    return Business.find().select("_id name");
  },

  getQuestionType: async () => {
    return QuestionType.find().select("_id name");
  },
};
