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

let subjectPascal = "Subject";
let subjectCamel = "subject";
let subjectSmall = "subject";
let subjectContainer = "subjectData";
let subjectHelperCreate = helper.SubjectHelper.createSubject;
let subjectHelperGet = helper.SubjectHelper.getSubjects;
let subjectHelperUpdate = helper.SubjectHelper.findUpdate;

// Subject Topic
let subjectTopicPascal = "SubjectTopic";
let subjectTopicCamel = "SubjectTopic";
let subjectTopicSmall = "SubjectTopic";
let subjectTopicContainer = "SubjectTopicData";
let subjectTopicHelperCreate = helper.SubjectHelper.createSubjectTopic;
let subjectTopicHelperGet = helper.SubjectHelper.getSubjectTopics;
let subjectTopicHelperUpdate = helper.SubjectHelper.findUpdateSubjectTopic;

// SubTopic
let subTopicPascal = "SubTopic";
let subTopicCamel = "subTopic";
let subTopicSmall = "subTopic";
let subTopicContainer = {};
let subTopicHelperCreate = helper.SubjectHelper.createSubTopic;
let subTopicHelperGet = helper.SubjectHelper.getSubTopics;
let subTopicHelperUpdate = helper.SubjectHelper.findUpdateSubTopic;

/**
 * @desc Application
 * @route POST /api/v1/subject/add
 * @access PUBLIC
 */
exports.add = asyncHandler(async (req, res, next) => {
    let createdBy = req.user.id || null;
    let validationSchema;
    try {
        /**
         * validate request body
         * @type {Joi.ObjectSchema<any>}
         */
        validationSchema = Joi.object({
            name: Joi.string().min(5).max(50).required(),
            institutionId: Joi.string(),
        });
        const { error } = validationSchema.validate(req.body);
        if (error)
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${subjectPascal} create validation failed with error: ${error.details[0].message}`,
                errorCode: "SUBO1",
                statusCode: 406,
            });
        let { name, institutionId } = req.body;
        if(!await utils.isValidObjectId(institutionId))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "Institution ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        subjectContainer = {
            name,
            code: await helper.SubjectHelper.generateSubjectCode,
            createdBy,
            institutionId,
        };
        const create = await subjectHelperCreate(subjectContainer);
        await logger.filecheck(
            `INFO: ${subjectPascal}: ${name} created by ${createdBy}: at ${time} with data ${JSON.stringify(
                create
            )} \n`
        );
        return utils.send_json_response({
            res,
            data: create,
            msg: `${subjectPascal} successfully created.`,
            statusCode: 201
        });
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `${subjectPascal} create failed with error ${error.message}, code: ${error.errorCode}`,
            errorCode: "SUBO2",
            statusCode: 502,
        });
    }
});

/**
 * @desc Subject
 * @route POST /api/v1/subject/list
 * @access subject
 */
exports.list = asyncHandler(async (req, res, next) => {
    try {
        let createdBy = req.user.id || null;
        /**
         * build query options for mongoose-paginate
         */
        const queryOptions = await utils.buildQueryOptions(req.query);
        if (typeof queryOptions === "string") {
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${queryOptions} is not valid!`,
                errorCode: "SUBO3",
                statusCode: 400,
            });
        }
        /**
         * fetch paginated data using queryOptions
         */
        const ObjectId = require("mongoose").Types.ObjectId;
        let where = {};
        // use this for fields that has boolean values or 1 and 0
        if (req.body.hasOwnProperty("status")) {
            where.status = parseInt(req.body.status);
        }
        if (!_.isEmpty(req.body.name) && req.body.name) {
            where.name = {
                $regex: ".*" + req.body.name + ".*",
                $options: "i",
            };
        }
        if (!_.isEmpty(req.body.institutionId) && req.body.institutionId && await utils.isValidObjectId(req.body.institutionId)) {
            where.institutionId = new ObjectId(req.body.institutionId);
        }
        if (!_.isEmpty(req.body.createdBy) && req.body.createdBy) {
            where.createdBy = new ObjectId(req.body.createdBy);
        }
        const objWithoutMeta = await subjectHelperGet({
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
                `INFO: ${subjectPascal} list by: ${createdBy}, at ${time} with data ${JSON.stringify(
                    obj
                )} \n`
            );
            return utils.send_json_response({
                res,
                data: obj,
                msg: `${subjectPascal} list successfully fetched`,
                statusCode: 200
            });
        } else {
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `No record!`,
                errorCode: "SUBO4",
                statusCode: 400,
            });
        }
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `${subjectPascal} list failed with error ${error.message}`,
            errorCode: "SUBO5",
            statusCode: 500,
        });
    }
});

/**
 * @desc subject
 * @route POST /api/v2/subject/update
 * @access PUBLIC
 */
exports.update = asyncHandler(async (req, res) => {
    let createdBy = req.user.id;
    let validationSchema;
    try {
        validationSchema = Joi.object({
            name: Joi.string().min(5).max(50),
            id: Joi.string(),
        });
        const { error } = validationSchema.validate(req.body);
        if (error)
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${subjectPascal} update validation failed with error: ${error.details[0].message}`,
                errorCode: "SUBO6",
                statusCode: 406,
            });
        const { name, id } = req.body;
        if(!await utils.isValidObjectId(id))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        const data = { name };
        const ObjectId = require("mongoose").Types.ObjectId;
        const update = await subjectHelperUpdate({
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
                errorCode: "SUBO7",
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
            errorCode: "SUBO8",
            statusCode: 500,
        });
    }
});

/**
 * @desc subject
 * @route POST /api/v2/subject/delete
 * @access PUBLIC
 */
exports.remove = asyncHandler(async (req, res, next) => {
    try {
        let deletedBy = req.user.id;
        let { ids } = req.body;
        let model = subjectPascal;
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
                `INFO: ${subjectPascal} deleted: by ${deletedBy} at ${time} with data ${JSON.stringify(
                    del
                )} \n`
            );
            return utils.send_json_response({
                res,
                data: del,
                msg: `${subjectPascal} successfully deleted`,
                statusCode: 200
            });
        }else{
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${subjectPascal} delete failed`,
                errorCode: "SUBO9",
                statusCode: 501
            });
        }
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `${subjectPascal} delete failed with error ${error.message}`,
            errorCode: "SUB10",
            statusCode: 500,
        });
    }
});

/**
 * @desc subject getSubject
 * @route POST /api/v2/subject/single
 * @access PUBLIC
 */
exports.getSubject = asyncHandler(async (req, res, next) => {
    let subject = "Subject";
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
        const obj = await helper.SubjectHelper.getSubject(where);
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


// Subject Topic controller

/**
 * @desc Subject Topic
 * @route POST /api/v1/subject/topic/add
 * @access PUBLIC
 */
exports.addTopic = asyncHandler(async (req, res, next) => {
    let validationSchema;
    try {
        /**
         * validate request body
         * @type {Joi.ObjectSchema<any>}
         */
        validationSchema = Joi.object({
            name: Joi.string().min(5).max(50).required(),
            institutionId: Joi.string(),
            subjectId: Joi.string(),
        });
        const { error } = validationSchema.validate(req.body);
        if (error)
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${subjectTopicPascal} create validation failed with error: ${error.details[0].message}`,
                errorCode: "SUB11",
                statusCode: 406,
            });
        let createdBy = req.user.id || null;
        let { name, institutionId, subjectId } = req.body;
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
        subjectTopicContainer = {
            name,
            createdBy,
            institutionId,
            subjectId,
        };
        const create = await subjectTopicHelperCreate(subjectTopicContainer);
        await logger.filecheck(
            `INFO: ${subjectTopicPascal}: ${name} created at ${time} with data ${JSON.stringify(
                create
            )} \n`
        );
        return utils.send_json_response({
            res,
            data: create,
            msg: `${subjectTopicPascal} successfully created.`,
            statusCode: 201
        });
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `${subjectTopicPascal} create failed with error ${error.message}`,
            errorCode: "SUB12",
            statusCode: 500,
        });
    }
});

/**
 * @desc Subject Topic
 * @route POST /api/v1/subject/topic/list
 * @access users
 */
exports.listTopics = asyncHandler(async (req, res, next) => {
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
                errorCode: "SUB13",
                statusCode: 400,
            });
        }
        const ObjectId = require("mongoose").Types.ObjectId;
        let where = {};
        // use this for fields that has boolean values or 1 and 0
        if (req.body.hasOwnProperty("status")) {
            where.status = parseInt(req.body.status);
        }
        if (!_.isEmpty(req.body.institutionId) && req.body.institutionId && await utils.isValidObjectId(req.body.institutionId)) {
            where.institutionId = new ObjectId(req.body.institutionId);
        }
        if (!_.isEmpty(req.body.subjectId) && req.body.subjectId && await utils.isValidObjectId(req.body.subjectId)) {
            where.subjectId = new ObjectId(req.body.subjectId);
        }
        if (!_.isEmpty(req.body.createdBy) && req.body.createdBy) {
            where.createdBy = new ObjectId(req.body.createdBy);
        }
        /**
         * fetch paginated data using queryOptions
         */
        const objWithoutMeta = await subjectTopicHelperGet({
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
                `INFO: ${subjectTopicPascal} list by: , at ${time} with data ${JSON.stringify(
                    obj
                )} \n`
            );
            return utils.send_json_response({
                res,
                data: obj,
                msg: `${subjectTopicPascal} list successfully fetched`,
                statusCode: 200
            });
        } else {
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `No record!`,
                errorCode: "SUB14",
                statusCode: 404,
            });
        }
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `${subjectPascal} list failed with error ${error.message}`,
            errorCode: "SUB15",
            statusCode: 500,
        });
    }
});

/**
 * @desc Subject Topic
 * @route POST /api/v2/topic/update
 * @access PUBLIC
 */
exports.updateTopic = asyncHandler(async (req, res) => {
    let createdBy = req.user.id;
    let validationSchema;
    try {
        validationSchema = Joi.object({
            name: Joi.string().min(5).max(50),
            status: Joi.number().min(0).max(1),
            subjectId: Joi.string(),
            id: Joi.string(),
        });
        const { error } = validationSchema.validate(req.body);
        if (error)
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${subjectTopicPascal} update validation failed with error: ${error.details[0].message}`,
                errorCode: "SUB16",
                statusCode: 406,
            });
        const { name, status, id, subjectId } = req.body;
        if(!await utils.isValidObjectId(id))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        const data = { name, status, subjectId };
        const ObjectId = require("mongoose").Types.ObjectId;
        const update = await subjectTopicHelperUpdate({
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
                errorCode: "SUB17",
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
            errorCode: "SUB18",
            statusCode: 500,
        });
    }
});

/**
 * @desc Subject Topic
 * @route POST /api/v2/topic/delete
 * @access PUBLIC
 */
exports.removeTopic = asyncHandler(async (req, res, next) => {
    try {
        let deletedBy = req.user.id;
        let { ids } = req.body;
        let model = subjectTopicPascal;
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
                `INFO: ${subjectTopicPascal} deleted: by ${deletedBy} at ${time} with data ${JSON.stringify(
                    del
                )} \n`
            );
            return utils.send_json_response({
                res,
                data: del,
                msg: `${subjectTopicPascal} successfully deleted`,
                statusCode: 200
            });
        }else{
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${subjectPascal} delete failed`,
                errorCode: "SUB19",
                statusCode: 501
            });
        }
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `${subjectTopicPascal} delete failed with error ${error.message}`,
            errorCode: "SUB20",
            statusCode: 500,
        });
    }
});

/**
 * @desc subject getTopic
 * @route POST /api/v2/subject/topic/single
 * @access PUBLIC
 */
exports.getTopic = asyncHandler(async (req, res, next) => {
    let subject = "Subject Topic";
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
        const obj = await helper.SubjectHelper.getSubjectTopic(where);
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

// Institution SubTopic

/**
 * @desc Subject
 * @route POST /api/v1/subject/subTopic/add
 * @access PUBLIC
 */
exports.addSubTopic = asyncHandler(async (req, res, next) => {
    let validationSchema;
    try {
        /**
         * validate request body
         * @type {Joi.ObjectSchema<any>}
         */
        validationSchema = Joi.object({
            name: Joi.string().min(5).max(50).required(),
            tags: Joi.array().items(Joi.string().required()),
            institutionId: Joi.string(),
            subjectId: Joi.string(),
            topicId: Joi.string(),
        });
        const { error } = validationSchema.validate(req.body);
        if (error)
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${subTopicPascal} create validation failed with error: ${error.details[0].message}`,
                errorCode: "SUB21",
                statusCode: 406,
            });
        let createdBy = req.user.id || null;
        let { name, institutionId, subjectId, tags, topicId } = req.body;
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
        const ObjectId = require("mongoose").Types.ObjectId;
        subTopicContainer = {
            name,
            createdBy,
            institutionId,
            subjectId,
            topicId,
            tags,
        };
        const create = await subTopicHelperCreate(subTopicContainer);
        await logger.filecheck(
            `INFO: ${subTopicPascal}: ${name} created at ${time} with data ${JSON.stringify(
                create
            )} \n`
        );
        return utils.send_json_response({
            res,
            data: create,
            msg: `${subTopicPascal} successfully created.`,
            statusCode: 201
        });
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `${subTopicPascal} create failed with error ${error.message}`,
            errorCode: "SUB22",
            statusCode: 500,
        });
    }
});

/**
 * @desc subject
 * @route POST /api/v2/subject/subTopic/list
 * @access user
 */
exports.listSubTopics = asyncHandler(async (req, res, next) => {
    try {
        //let createdBy = req.user.id;
        /**
         * build query options for mongoose-paginate
         */
        const queryOptions = await utils.buildQueryOptions(req.query);
        if (typeof queryOptions === "string") {
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${queryOptions} is not valid!`,
                errorCode: "SUB23",
                statusCode: 400,
            });
        }
        /**
         * fetch paginated data using queryOptions
         */
        const ObjectId = require("mongoose").Types.ObjectId;
        let where = {};
        if (!_.isEmpty(req.body.name) && req.body.name) {
            where.name = {
                $regex: ".*" + req.body.name + ".*",
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
        if (!_.isEmpty(req.body.tags) && req.body.tags) {
            where.tags = {  $in: req.body.tags };
        }
        const objWithoutMeta = await subTopicHelperGet({
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
                `INFO: ${subTopicPascal} list by: , at ${time} with data ${JSON.stringify(
                    obj
                )} \n`
            );
            return utils.send_json_response({
                res,
                data: obj,
                msg: `${subTopicPascal} list successfully fetched`,
                statusCode: 200
            });
        } else {
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `No record!`,
                errorCode: "SUB24",
                statusCode: 404,
            });
        }
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `${subjectPascal} list failed with error ${error.message}`,
            errorCode: "SUB25",
            statusCode: 500,
        });
    }
});

/**
 * @desc Sub Topic
 * @route POST /api/v2/application/update
 * @access PUBLIC
 */
exports.updateSubTopic = asyncHandler(async (req, res) => {
    let createdBy = req.user.id;
    let validationSchema;
    try {
        validationSchema = Joi.object({
            name: Joi.string().min(5).max(50),
            tags: Joi.array().items(Joi.string()),
            subjectId: Joi.string(),
            topicId: Joi.string(),
            id: Joi.string(),
        });
        const { error } = validationSchema.validate(req.body);
        if (error)
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${subTopicPascal} update validation failed with error: ${error.details[0].message}`,
                errorCode: "SUB26",
                statusCode: 406,
            });
        const { name, id, subjectId, tags, topicId } = req.body;
        if(!await utils.isValidObjectId(id))
            return utils.send_json_error_response({
                res,
                data: [],
                msg:  "ID provided is invalid",
                errorCode: "MEN17",
                statusCode: 406
            });
        const data = { name, tags, subjectId, topicId };
        const ObjectId = require("mongoose").Types.ObjectId;
        const update = await subTopicHelperUpdate({
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
                errorCode: "SUB27",
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
            errorCode: "SUB28",
            statusCode: 500,
        });
    }
});

/**
 * @desc SubTopic
 * @route POST /api/v2/subject/subTopic/delete
 * @access PUBLIC
 */
exports.removeSubTopic = asyncHandler(async (req, res, next) => {
    try {
        let deletedBy = req.user.id;
        let { ids } = req.body;
        let model = subTopicPascal;
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
                `INFO: ${subTopicPascal} deleted: by ${deletedBy} at ${time} with data ${JSON.stringify(
                    del
                )} \n`
            );
            return utils.send_json_response({
                res,
                data: del,
                msg: `${subTopicPascal} successfully deleted`,
                statusCode: 200
            });
        }else{
            return utils.send_json_error_response({
                res,
                data: [],
                msg: `${subTopicPascal} delete failed`,
                errorCode: "SUB29",
                statusCode: 502
            });
        }
    } catch (error) {
        return utils.send_json_error_response({
            res,
            data: [],
            msg: `${subTopicPascal} delete failed with error ${error.message}`,
            errorCode: "SUB30",
            statusCode: 500,
        });
    }
});

/**
 * @desc subject getSubTopic
 * @route POST /api/v2/subject/subTopic/single
 * @access PUBLIC
 */
exports.getSubTopic = asyncHandler(async (req, res, next) => {
    let subject = "Subject SubTopic";
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
        const obj = await helper.SubjectHelper.getSubTopic(where);
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