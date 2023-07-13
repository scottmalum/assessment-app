const fs = require("fs");
const _ = require("lodash");
const generator = require("generate-password");
const moment = require("moment");
const strings = require("locutus/php/strings");
const Candidate = require("../../models/Candidate");
const CandidateType = require("../../models/CandidateType");
const CandidateDocument = require("../../models/CandidateDocument");
const User = require("../../models/User");
const utils = require("../");
const { is_null } = require("locutus/php/var");
const Institution = require("../../models/Institution");
const InstitutionDocumentType = require("../../models/InstitutionDocumentType");
const time = new Date(Date.now()).toLocaleString();

async function generateCandidateCode(append = "", prepend = "") {
  let code = generator.generate({
    length: 5,
    numbers: true,
    symbols: false,
    uppercase: true,
    lowercase: false,
  });
  if (!_.isEmpty(append)) code = append + code;
  if (!_.isEmpty(prepend)) code = code + prepend;
  const v = await Candidate.findOne({
    candidateCode: code,
  });
  if (v) {
    await generateCandidateCode();
  }
  return code;
}

module.exports = {
  generateCode: async (append = "", prepend = "") => {
    return await generateCandidateCode(append, prepend);
  },

  createCandidate: async (data) => {
    if(_.isArray(data) && data.length > 1) return Candidate.insertMany(data);
    return Candidate.create(data);
  },

  getCandidates: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v = Candidate.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "institutions",
          localField: "institutionId",
          foreignField: "_id",
          as: "candidate_institution",
        },
      },
      { $unwind: "$candidate_institution" },
      {
        $lookup: {
          from: "candidate_types",
          localField: "candidateTypeId",
          foreignField: "_id",
          as: "candidate_type",
        },
      },
      { $unwind: "$candidate_type" },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "candidate_creator",
        },
      },
      { $unwind: "$candidate_creator" },
      {
        $project: {
          __v: 0,
          status: 0,
          createdAt: 0,
          updatedAt: 0,
          firstLogin: 0,
          passwordResets: 0,
          password: 0,
          "candidate_institution.address": 0,
          "candidate_institution._id": 0,
          "candidate_institution.institutionConfig": 0,
          "candidate_institution.logo": 0,
          "candidate_institution.businessId": 0,
          "candidate_institution.modules": 0,
          "candidate_creator.password": 0,
          "candidate_creator.passwordResets": 0,
          "candidate_creator._id": 0,
          "candidate_creator.firstLogin": 0,
          "candidate_creator.userPermission": 0,
          "candidate_creator.isSystemAdmin": 0,
          "candidate_creator.isInstitutionAdmin": 0,
          "candidate_creator.isLmsAdmin": 0,
          "candidate_creator.createdAt": 0,
          "candidate_creator.updatedAt": 0,
        },
      },
    ]);
    return Candidate.aggregatePaginate(v, options, function (err, results) {
      if (err) {
        console.log(err);
      } else {
        return results;
      }
    });
  },

  getCandidate: async (where) => {
    return Candidate.findOne(where).populate({path: 'institutionId'}).lean();
  },

  uploadCandidates: async (data) => {
    return Candidate.insertMany(data);
  },

  findUpdate: async ({ filter: filter, update: update, options: options }) => {
    let res;
    let result;
    let check = await Candidate.findOne(filter);
    if (!check || is_null(check)) {
      return { result: false, message: "Candidate provided do not exist" };
    } else {
      res = await Candidate.findOneAndUpdate(filter, update, options);
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },

  uploadCandidateDocuments: async ({
                           filter: filter,
                           create: create,
                           update: update,
                           options: options,
                         }) => {
    let res;
    let c = await CandidateDocument.findOne(filter);
    if (!c) {
      res = await CandidateDocument.create(create);
    } else {
      res = await CandidateDocument.findOneAndUpdate(filter, update, options);
    }
    return res.toObject();
  },

  getCandidateDocuments: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v = CandidateDocument.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "institutions",
          localField: "institutionId",
          foreignField: "_id",
          as: "institution",
        },
      },
      { $unwind: "$institution" },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "application",
        },
      },
      { $unwind: "$application" },
      {
        $lookup: {
          from: "candidates",
          localField: "candidateId",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      {
        $project: {
          __v: 0,
          "institution.address": 0,
          "institution._id": 0,
          "institution.institutionConfig": 0,
          "institution.logo": 0,
          "institution.businessId": 0,
          "institution.modules": 0,
          "institution.createdAt": 0,
          "institution.updatedAt": 0,
          "application.createdAt": 0,
          "application.updatedAt": 0,
          "candidate.password": 0,
          "candidate.passwordResets": 0,
          "candidate._id": 0,
          "candidate.firstLogin": 0,
          "candidate.userPermission": 0,
          "candidate.isSystemAdmin": 0,
          "candidate.isInstitutionAdmin": 0,
          "candidate.isLmsAdmin": 0,
          "candidate.createdAt": 0,
          "candidate.updatedAt": 0,
        },
      },
    ]);
    return CandidateDocument.aggregatePaginate(v, options, function (err, results) {
      if (err) {
        console.log(err);
      } else {
        return results;
      }
    });
  },





};
