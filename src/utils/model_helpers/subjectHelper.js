const fs = require("fs");
const _ = require("lodash");
const generator = require("generate-password");
const moment = require("moment");
const strings = require("locutus/php/strings");
const Subject = require("../../models/Subject");
const SubjectTopic = require("../../models/SubjectTopic");
const SubTopic = require("../../models/SubTopic");
const Institution = require("../../models/Institution");
const User = require("../../models/User");
const utils = require("../");
const { is_null } = require("locutus/php/var");
const Application = require("../../models/Application");
const time = new Date(Date.now()).toLocaleString();

async function generateSubjectCode(append = "", prepend = "") {
  let code = generator.generate({
    length: 5,
    numbers: true,
    symbols: false,
    uppercase: true,
    lowercase: false,
  });
  if (!_.isEmpty(append)) code = append + code;
  if (!_.isEmpty(prepend)) code = code + prepend;
  const v = await Subject.findOne({
    code: code,
  });
  if (v) {
    await generateSubjectCode();
  }
  return code;
}

module.exports = {
  generateSubjectCode: generateSubjectCode(),

  createSubject: async (data) => {
    return Subject.create(data);
  },

  getSubjects: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v = Subject.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "institutions",
          localField: "institutionId",
          foreignField: "_id",
          as: "subject_institution",
        },
      },
      { $unwind: "$subject_institution" },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "subject_creator",
        },
      },
      { $unwind: "$subject_creator" },
      {
        $project: {
          __v: 0,
          status: 0,
          "subject_institution.address": 0,
          "subject_institution._id": 0,
          "subject_institution.institutionConfig": 0,
          "subject_institution.logo": 0,
          "subject_institution.businessId": 0,
          "subject_institution.modules": 0,
          "subject_creator.password": 0,
          "subject_creator.passwordResets": 0,
          "subject_creator._id": 0,
          "subject_creator.firstLogin": 0,
          "subject_creator.userPermission": 0,
          "subject_creator.isSystemAdmin": 0,
          "subject_creator.isInstitutionAdmin": 0,
          "subject_creator.isLmsAdmin": 0,
          "subject_creator.createdAt": 0,
          "subject_creator.updatedAt": 0
        },
      },
    ]);
    return Subject.aggregatePaginate(v, options, function (err, results) {
      if (err) {
        console.log(err);
      } else {
        return results;
      }
    });
  },

  getSubject: async (where) => {
    return Subject.findOne(where).populate({ path: "institutionId" });
  },

  findUpdate: async ({ filter: filter, update: update, options: options }) => {
    let res;
    let result;
    let check = await Subject.findOne(filter);
    if (!check || is_null(check)) {
      return { result: false, message: "Subject provided do not exist" };
    } else {
      res = await Subject.findOneAndUpdate(filter, update, options);
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },

  createSubjectTopic: async (data) => {
    return SubjectTopic.create(data);
  },

  getSubjectTopics: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v = SubjectTopic.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "institutions",
          localField: "institutionId",
          foreignField: "_id",
          as: "topic_institution",
        },
      },
      { $unwind: "$topic_institution" },
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "topic_subject",
        },
      },
      { $unwind: "$topic_subject" },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "topic_creator",
        },
      },
      { $unwind: "$topic_creator" },
      {
        $project: {
          __v: 0,
          status: 0,
          "topic_institution.address": 0,
          "topic_institution._id": 0,
          "topic_institution.institutionConfig": 0,
          "topic_institution.logo": 0,
          "topic_institution.businessId": 0,
          "topic_institution.modules": 0,
          "topic_creator.password": 0,
          "topic_creator.passwordResets": 0,
          "topic_creator._id": 0,
          "topic_creator.firstLogin": 0,
          "topic_creator.userPermission": 0,
          "topic_creator.isSystemAdmin": 0,
          "topic_creator.isInstitutionAdmin": 0,
          "topic_creator.isLmsAdmin": 0,
          "topic_creator.createdAt": 0,
          "topic_creator.updatedAt": 0,
          "topic_subject.institutionId": 0,
          "topic_subject.createdAt": 0,
          "topic_subject.updatedAt": 0
        },
      },
    ]);
    return SubjectTopic.aggregatePaginate(v, options, function (err, results) {
      if (err) {
        console.log(err);
      } else {
        return results;
      }
    });
  },

  getSubjectTopic: async (where) => {
    return SubjectTopic.findOne(where)
        .populate({ path: "institutionId" })
        .populate({ path: "subjectId" });
  },

  findUpdateSubjectTopic: async ({ filter: filter, update: update, options: options }) => {
    let res;
    let result;
    let check = await SubjectTopic.findOne(filter);
    if (!check || is_null(check)) {
      return { result: false, message: "Subject provided do not exist" };
    } else {
      res = await SubjectTopic.findOneAndUpdate(
          filter,
          update,
          options
      );
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },

  createSubTopic: async (data) => {
    return SubTopic.create(data);
  },

  getSubTopics: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v = SubTopic.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "institutions",
          localField: "institutionId",
          foreignField: "_id",
          as: "subtopic_institution",
        },
      },
      { $unwind: "$subtopic_institution" },
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subtopic_subject",
        },
      },
      { $unwind: "$subtopic_subject" },
      {
        $lookup: {
          from: "subject_topics",
          localField: "topicId",
          foreignField: "_id",
          as: "subtopic_topic",
        },
      },
      { $unwind: "$subtopic_topic" },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "topic_creator",
        },
      },
      { $unwind: "$topic_creator" },
      {
        $project: {
          __v: 0,
          status: 0,
          "subtopic_institution.address": 0,
          "subtopic_institution._id": 0,
          "subtopic_institution.institutionConfig": 0,
          "subtopic_institution.logo": 0,
          "subtopic_institution.businessId": 0,
          "subtopic_institution.modules": 0,
          "subtopic_creator.password": 0,
          "subtopic_creator.passwordResets": 0,
          "subtopic_creator._id": 0,
          "subtopic_creator.firstLogin": 0,
          "subtopic_creator.userPermission": 0,
          "subtopic_creator.isSystemAdmin": 0,
          "subtopic_creator.isInstitutionAdmin": 0,
          "subtopic_creator.isLmsAdmin": 0,
          "subtopic_creator.createdAt": 0,
          "subtopic_creator.updatedAt": 0,
          "subtopic_subject.institutionId": 0,
          "subtopic_subject.createdAt": 0,
          "subtopic_subject.updatedAt": 0,
          "subtopic_topic.institutionId": 0,
          "subtopic_topic.subjectId": 0,
          "subtopic_topic.createdAt": 0,
          "subtopic_topic.updatedAt": 0
        },
      },
    ]);
    return SubTopic.aggregatePaginate(v, options, function (err, results) {
      if (err) {
        console.log(err);
      } else {
        return results;
      }
    });
  },

  getSubTopic: async (where) => {
    return SubTopic.findOne(where)
        .populate({ path: "institutionId" })
        .populate({ path: "subjectId" })
        .populate({ path: "topicId" });
  },

  findUpdateSubTopic: async ({ filter: filter, update: update, options: options }) => {
    let res;
    let result;
    let check = await SubTopic.findOne(filter);
    if (!check || is_null(check)) {
      return { result: false, message: "SubjTopic provided do not exist" };
    } else {
      res = await SubTopic.findOneAndUpdate(filter, update, options);
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },















};