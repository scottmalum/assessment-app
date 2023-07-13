const ErrorResponse = require("../utils/errorResponse");
require("dotenv").config();
const asyncHandler = require("../middleware/async");
const { validate } = require("validate.js");
const utils = require("../utils");
const helper = require("../utils/model_helpers");
const _ = require("lodash");
const logger = require("../utils/logger");
let appRoot = require("app-root-path");
let emailTemplate = require(`${appRoot}/src/utils/emailTemplate`);
const {parseInt} = require("lodash");
const Joi = require("joi");
const time = new Date(Date.now()).toLocaleString();
let subjectPascal = "Token";
let subjectContainer = "tokenData";
let subjectHelperCreate = helper.TokenHelper.createToken;
let subjectHelperGet = helper.TokenHelper.getToken;
let subjectHelperUpdate = helper.TokenHelper.findUpdate;

/**
 * @desc add
 * @route POST /api/v2/token/add
 * @access PUBLIC
 */
exports.add = asyncHandler(async (req, res, next) => {
  try{
    let { token, data, expireAt } = req.body;
    if (!token) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "token is required",
        errorCode: "MEN01",
        statusCode: 400
      });
    }
    if (!data) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "token data is required",
        errorCode: "MEN01",
        statusCode: 400
      });
    }
    let subjectContainer = { token, data, expireAt }
    let add_token = await subjectHelperCreate(subjectContainer);
    if(add_token){
      await logger.filecheck(
          `INFO: Token: at ${time} with data ${JSON.stringify(
              add_token
          )} \n`
      );
      return utils.send_json_response({
        res,
        data: add_token,
        msg: "Token added successfully",
        statusCode: 201
      });
    }else{
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Token not created`,
        errorCode: "TOK01",
        statusCode: 500
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Token create failed with error ${error.message}`,
      errorCode: "TOK02",
      statusCode: 500
    });
  }
});

/**
 * @desc getToken
 * @route POST /api/v2/token/single
 * @access PUBLIC
 */
exports.getToken = asyncHandler(async (req, res, next) => {
  try{
    const { token } = req.body;
    if (!token) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Token is not provided",
        errorCode: "TOK03",
        statusCode: 400
      });
    }
    let where = {token};
    const obj = await subjectHelperGet(where);
    if(!_.isEmpty(obj)) {
      await logger.filecheck(
          `INFO: Token fetched successfully with data ${JSON.stringify(
              obj
          )} \n`
      );
      return utils.send_json_response({
        res,
        data: obj,
        msg: "Token successfully fetched",
        statusCode: 200
      });
    }else{
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  `No record!`,
        errorCode: "TOK04",
        statusCode: 404
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg:  `Token fetch failed with error ${error.message}`,
      errorCode: "TOK05",
      statusCode: 500
    });
  }
});

/**
 * @desc isActive
 * @route POST /api/v2/token/status
 * @access PUBLIC
 */
exports.isActive = asyncHandler(async (req, res, next) => {
  try{
    const { token } = req.body;
    if (!token) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Token is not provided",
        errorCode: "TOK03",
        statusCode: 400
      });
    }
    const obj = await helper.TokenHelper.tokenIsActive(token);
    if(!_.isEmpty(obj)) {
      await logger.filecheck(
          `INFO: Token status is ${JSON.stringify(
              obj
          )} \n`
      );
      return utils.send_json_response({
        res,
        data: true,
        msg: "Token is active",
        statusCode: 200
      });
    }else{
      return utils.send_json_error_response({
        res,
        data: false,
        msg:  `Token is not active or expired!`,
        errorCode: "TOK04",
        statusCode: 404
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg:  `Token status check failed with error ${error.message}`,
      errorCode: "TOK05",
      statusCode: 500
    });
  }
});

/**
 * @desc disable
 * @route POST /api/v2/token/disable
 * @access PUBLIC
 */
exports.disable = asyncHandler(async (req, res, next) => {
  try{
    const { token } = req.body;
    if (!token) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Token is not provided",
        errorCode: "TOK03",
        statusCode: 400
      });
    }
    const obj = await helper.TokenHelper.disableToken(token);
    if(!_.isEmpty(obj)) {
      await logger.filecheck(
          `INFO: Token disabled \n`
      );
      return utils.send_json_response({
        res,
        data: obj,
        msg: "Token is disabled",
        statusCode: 200
      });
    }else{
      return utils.send_json_error_response({
        res,
        data: false,
        msg:  `Token not disabled!`,
        errorCode: "TOK04",
        statusCode: 404
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg:  `Token disability failed with error ${error.message}`,
      errorCode: "TOK05",
      statusCode: 500
    });
  }
});

/**
 * @desc Token
 * @route POST /api/v2/token/update
 * @access PUBLIC
 */
exports.update = asyncHandler(async (req, res) => {
  let validationSchema;
  try {
    validationSchema = Joi.object({
      token: Joi.string().required(),
      expired: Joi.number(),
      data: Joi.any().allow(null,''),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} update validation failed with error: ${error.details[0].message}`,
        errorCode: "TOK06",
        statusCode: 406
      });
    let {token, expired, data} = req.body;
    const subjectContainer = _.isEmpty(data) ? {expired} : {expired, data};
    const update = await subjectHelperUpdate({
      filter: {
        token,
      },
      update: {
        $set: subjectContainer,
      },
      options: { upsert: true, new: true },
    });
    if (!update.result)
      return utils.send_json_error_response({
        res,
        data: update.result,
        msg: update.message,
        errorCode: "TOK07",
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
      errorCode: "TOK08",
      statusCode: 500
    });
  }
});

/**
 * @desc Token
 * @route POST /api/v2/token/delete
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
        errorCode: "TOK09",
        statusCode: 502
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subjectPascal} delete failed with error ${error.message}`,
      errorCode: "TOK10",
      statusCode: 500
    });
  }
});





