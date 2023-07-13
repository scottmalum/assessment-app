const fs = require("fs");
const _ = require("lodash");
const generator = require("generate-password");
const moment = require("moment");
const strings = require("locutus/php/strings");
const QuestionBank = require("../../models/QuestionBank");
const User = require("../../models/User");
const utils = require("../");
const { is_null } = require("locutus/php/var");
const time = new Date(Date.now()).toLocaleString();

module.exports = {
    createQuestion: async (data) => {
        return QuestionBank.create(data);
    },

    getQuestions: async (params) => {
        const { where, queryOptions } = params;
        const options = {
            ...queryOptions,
        };
        const v = QuestionBank.aggregate([
            {
                $match: where,
            },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "institutions",
                    localField: "institutionId",
                    foreignField: "_id",
                    as: "question_institution",
                },
            },
            { $unwind: "$question_institution" },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "question_subject",
                },
            },
            { $unwind: "$question_subject" },
            {
                $lookup: {
                    from: "subject_topics",
                    localField: "topicId",
                    foreignField: "_id",
                    as: "question_topic",
                },
            },
            { $unwind: "$question_topic" },
            {
                $lookup: {
                    from: "sub_topics",
                    localField: "subTopicId",
                    foreignField: "_id",
                    as: "question_subtopic",
                },
            },
            { $unwind: "$question_subtopic" },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "question_creator",
                },
            },
            { $unwind: "$question_creator" },
            {
                $project: {
                    __v: 0,
                    "question_institution.address": 0,
                    "question_institution._id": 0,
                    "question_institution.institutionConfig": 0,
                    "question_institution.logo": 0,
                    "question_institution.businessId": 0,
                    "question_institution.modules": 0,
                    "question_creator.password": 0,
                    "question_creator.passwordResets": 0,
                    "question_creator._id": 0,
                    "question_creator.firstLogin": 0,
                    "question_creator.userPermission": 0,
                    "question_creator.isSystemAdmin": 0,
                    "question_creator.isInstitutionAdmin": 0,
                    "question_creator.isLmsAdmin": 0,
                    "question_creator.createdAt": 0,
                    "question_creator.updatedAt": 0,
                    "question_subject.institutionId": 0,
                    "question_subject.createdAt": 0,
                    "question_subject.updatedAt": 0,
                    "question_topic.institutionId": 0,
                    "question_topic.subjectId": 0,
                    "question_topic.createdAt": 0,
                    "question_topic.updatedAt": 0,
                    "question_subtopic.institutionId": 0,
                    "question_subtopic.subjectId": 0,
                    "question_subtopic.topicId": 0,
                    "question_subtopic.createdBy": 0,
                    "question_subtopic.createdAt": 0,
                    "question_subtopic.updatedAt": 0
                },
            },
        ]);
        return QuestionBank.aggregatePaginate(v, options, function (err, results) {
            if (err) {
                console.log(err);
            } else {
                return results;
            }
        });
    },

    getQuestion: async (where) => {
        return QuestionBank.findOne(where);
    },

    findUpdate: async ({ filter: filter, update: update, options: options }) => {
        let res;
        let result;
        let check = await QuestionBank.findOne(filter);
        if (!check || is_null(check)) {
            return { result: false, message: "QuestionType provided do not exist" };
        } else {
            res = await QuestionBank.findOneAndUpdate(filter, update, options);
        }
        result = res.toObject();
        if (result) {
            result.id = result._id;
        }
        return { result, message: "successful" };
    },
};