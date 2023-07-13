const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const utils = require("../utils");
const helper = require("../utils/model_helpers");
const _ = require("lodash");
const logger = require("../utils/logger");
const { parseInt } = require("lodash");
const time = new Date(Date.now()).toLocaleString();
const Joi = require("joi");
const communication = require("./communication");
const next = require("locutus/php/array/next");
const generator = require("generate-password");
require("dotenv").config();
let appRoot = require("app-root-path");
let emailTemplate = require(`${appRoot}/src/utils/emailTemplate`);


/**
 * @desc Question
 * @route POST /api/v1/question/add
 * @access PUBLIC
 */
exports.add = asyncHandler(async (req, res, next) => {
    let validationSchema;
    try {
        /**
         * validate request body
         * @type {Joi.ObjectSchema<any>}
         */
        validationSchema = Joi.object({
            institutionId: Joi.string().required(),
            subjectId: Joi.string().required(),
            topicId: Joi.string().required(),
            subTopicId: Joi.string().required(),
            questionTypeId: Joi.string().required(),
            question: Joi.string().required(),
            options: Joi.any(),
            answer: Joi.any(),
        });
        const { error } = validationSchema.validate(req.body);
        if (error)
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `Question create validation failed with error: ${error.details[0].message}`,
                errorCode: "QUE01",
                statusCode: 406,
            });
        let createdBy = req.user.id || null;
        let {
            institutionId,
            subjectId,
            topicId,
            subTopicId,
            questionTypeId,
            question,
            options,
            answer,
        } = req.body;
        if(!await utils.isValidObjectId(institutionId))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "Institution ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        if(!await utils.isValidObjectId(subjectId))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "Subject ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        if(!await utils.isValidObjectId(topicId))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "Topic ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        if(!await utils.isValidObjectId(subTopicId))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "SubTopic ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        if(!await utils.isValidObjectId(questionTypeId))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "Question-type ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        let questionContainer = {
            institutionId,
            subjectId,
            topicId,
            subTopicId,
            questionTypeId,
            question,
            options,
            answer,
            createdBy
        };
        const create = await helper.QuestionHelper.createQuestion(questionContainer);
        await logger.filecheck(
            `INFO: Question, created at ${time} by ${createdBy} with data ${JSON.stringify(
                create
            )} \n`
        );
        return utils.send_json_response({
            res,
            data: create,
            msg: `Question successfully created .`,
            statusCode: 201
        });
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `Question create failed with error ${error.message}`,
            errorCode: "QUE02",
            statusCode: 500,
        });
    }
});

/**
 * @desc Question
 * @route GET /api/v1/question/list
 * @access Application
 */
exports.list = asyncHandler(async (req, res, next) => {
    try {
        /**
         * build query options for mongoose-paginate
         */
        const queryOptions = await utils.buildQueryOptions(req.query);
        if (typeof queryOptions === "string") {
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${queryOptions} is not valid!`,
                errorCode: "QUE03",
                statusCode: 400,
            });
        }
        /**
         * fetch paginated data using queryOptions
         */
        const ObjectId = require("mongoose").Types.ObjectId;
        let where = {};
        if (!_.isEmpty(req.body.question) && req.body.question) {
            where.question = {
                $regex: ".*" + req.body.question + ".*",
                $options: "i",
            };
        }
        if (!_.isEmpty(req.body.institutionId) && req.body.institutionId && await utils.isValidObjectId(req.body.institutionId)) {
            where.institutionId = new ObjectId(req.body.institutionId);
        }
        if (!_.isEmpty(req.body.subjectId) && req.body.subjectId && await utils.isValidObjectId(req.body.subjectId)) {
            where.subjectId = new ObjectId(req.body.subjectId);
        }
        if (!_.isEmpty(req.body.topicId) && req.body.topicId && await utils.isValidObjectId(req.body.topicId)) {
            where.topicId = new ObjectId(req.body.topicId);
        }
        if (!_.isEmpty(req.body.subTopicId) && req.body.subTopicId && await utils.isValidObjectId(req.body.subTopicId)) {
            where.subTopicId = new ObjectId(req.body.subTopicId);
        }
        if (!_.isEmpty(req.body.questionTypeId) && req.body.questionTypeId && await utils.isValidObjectId(req.body.questionTypeId)) {
            where.questionTypeId = new ObjectId(req.body.questionTypeId);
        }
        const objWithoutMeta = await helper.QuestionHelper.getQuestions({
            where,
            queryOptions,
        });
        if (objWithoutMeta.data && !_.isEmpty(objWithoutMeta.data)) {
            /**
             * build response data meta for pagination
             */
            let url = req.protocol + "://" + req.get("host") + req.originalUrl;
            const obj = await utils.buildResponseMeta({ url, obj: objWithoutMeta });
            await logger.filecheck(
                `INFO: Question list by:, at ${time} with data ${JSON.stringify(
                    obj
                )} \n`
            );
            return utils.send_json_response({
                res,
                data: obj,
                msg: `Question list successfully fetched`,
                statusCode: 200
            });
        } else {
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `No record!`,
                errorCode: "QUE04",
                statusCode: 404,
            });
        }
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `Question list failed with error ${error.message}`,
            errorCode: "QUE05",
            statusCode: 500,
        });
    }
});

/**
 * @desc Question
 * @route POST /api/v1/question/update
 * @access PUBLIC
 */
exports.update = asyncHandler(async (req, res) => {
    //let createdBy = req.user.id;
    let validationSchema;
    try {
        validationSchema = Joi.object({
            institutionId: Joi.string(),
            subjectId: Joi.string(),
            topicId: Joi.string(),
            subTopicId: Joi.string(),
            questionTypeId: Joi.string(),
            question: Joi.string(),
            options: Joi.any(),
            answer: Joi.any(),
            id: Joi.string().required(),
        });
        const { error } = validationSchema.validate(req.body);
        if (error)
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `Question update validation failed with error: ${error.details[0].message}`,
                errorCode: "QUE06",
                statusCode: 406,
            });
        const {
            institutionId,
            subjectId,
            topicId,
            subTopicId,
            questionTypeId,
            question,
            options,
            answer,
            id,
        } = req.body;
        const data = {
            institutionId,
            subjectId,
            topicId,
            subTopicId,
            questionTypeId,
            question,
            options,
            answer,
        };
        const ObjectId = require("mongoose").Types.ObjectId;
        if(!await utils.isValidObjectId(id))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        const update = await helper.QuestionHelper.findUpdate({
            filter: {
                _id: new ObjectId(id),
            },
            update: {
                $set: data,
            },
            options: { upsert: true, new: true },
        });
        if (!update.result)
            return utils.send_json_error_response({
                res,
                data: update.result,
                msg: update.message,
                errorCode: "QUE07",
                statusCode: 502
            });
        return utils.send_json_response({
            res,
            data: update.result,
            statusCode: 201
        });
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `Error: ${error} `,
            errorCode: "QUE08",
            statusCode: 500,
        });
    }
});

/**
 * @desc Question
 * @route POST /api/v1/question/remove
 * @access PUBLIC
 */
exports.remove = asyncHandler(async (req, res, next) => {
    try {
        let deletedBy = req.user.id;
        let { ids } = req.body;
        let model = "QuestionBank";
        const ObjectId = require("mongoose").Types.ObjectId;
        ids.map(async (d) => {
            if (await utils.isValidObjectId(d)) new ObjectId(d)
        });
        let del = await helper.backupAndDelete({
            ids,
            deletedBy,
            model,
        });
        if(del.deletedCount >= 1){
            await logger.filecheck(
                `INFO: Question deleted: by ${deletedBy} at ${time} with data ${JSON.stringify(
                    del
                )} \n`
            );
            return utils.send_json_response({
                res,
                data: del,
                msg: `Question successfully deleted`,
                statusCode: 200
            });
        }else{
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `Question delete failed`,
                errorCode: "QUE09",
                statusCode: 502
            });
        }
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `Question delete failed with error ${error.message}`,
            errorCode: "QUE10",
            statusCode: 500,
        });
    }
});

/**
 * @desc Question
 * @route POST /api/v2/question/single
 * @access PUBLIC
 */
exports.getQuestion = asyncHandler(async (req, res, next) => {
    let subject = "Question";
    try{
        let createdBy = req.user.id;
        const ObjectId = require("mongoose").Types.ObjectId;
        let {id} = req.body;
        if(!await utils.isValidObjectId(id))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        let where = {_id: new ObjectId(id)};
        const obj = await helper.QuestionHelper.getQuestion(where);
        if(!_.isEmpty(obj)) {
            await logger.filecheck(
                `INFO: ${subject} fetched successfully by: ${createdBy} with data ${JSON.stringify(
                    obj
                )} \n`
            );
            return utils.send_json_response({
                res,
                data: obj,
                msg: `${subject} successfully fetched`,
                statusCode: 200
            });
        }else{
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  `No record!`,
                errorCode: "APP34",
                statusCode: 404
            });
        }
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg:  `${subject} fetch failed with error ${error.message}`,
            errorCode: "APP35",
            statusCode: 500
        });
    }
});