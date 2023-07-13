const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const utils = require("../utils");
const helper = require("../utils/model_helpers");
const _ = require("lodash");
const generator = require("generate-password");
const logger = require("../utils/logger");
const { parseInt } = require("lodash");
const Joi = require("joi");
const next = require("locutus/php/array/next");
const emailTemplate = require("../utils/emailTemplate");
const { log } = require("locutus/php/math");
const time = new Date(Date.now()).toLocaleString();

/**
 * @desc Users
 * @route POST /api/v2/admin/add
 * @access PUBLIC
 */
exports.addAdmin = asyncHandler(async (req, res, next) => {
  let email_log_data;
  try {
    let createdBy = req.user.id || null;
    let { phone, email, lastName, firstName, middleName, institutionCode } =
      req.body;
    let { e00987TE4 } = req.query;
    if (!e00987TE4 && !institutionCode)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution must be provided to proceed`,
        errorCode: "USR01",
        statusCode: 406,
      });
    let code, institutionId;
    if (e00987TE4 && !_.isEmpty(e00987TE4)) code = e00987TE4;
    else code = institutionCode;
    const userValidationSchema = Joi.object({
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      middleName: Joi.string(),
      email: Joi.string().min(5).max(50).email().required(),
      phone: Joi.string().min(9).max(15).required(),
      institutionCode: Joi.string(),
    });
    const { error } = userValidationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution admin create failed with validation error ${error.details[0].message}`,
        errorCode: "USR02",
        statusCode: 400,
      });
    let institution = await helper.InstitutionHelper.getInstitution({
      where: { institutionCode: code },
    });
    if (_.isEmpty(institution))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution do not exist`,
        errorCode: "USR03",
        statusCode: 404,
      });
    institution = institution[0];
    institutionId = institution._id;
    const check_admin_already_created = await helper.UserHelper.getUser({
      institutionId,
      isInstitutionAdmin: 1,
    });
    if (check_admin_already_created)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution admin already created`,
        errorCode: "USR04",
        statusCode: 201,
      });
    /**
     * assemble user params for create
     */
    let pw = generator.generate({
      length: 10,
      numbers: true,
      uppercase: true,
      lowercase: true,
      symbols: false,
    });
    let pw_hashed = await utils.hashPassword(pw);
    console.log(`Generated password for user: ${pw}`);
    let user_data = {
      phone,
      email,
      lastName,
      firstName,
      middleName,
      password: pw_hashed,
      institutionId,
      isInstitutionAdmin: 1,
      firstLogin: 1,
      status: 1,
    };
    const create_user = await helper.UserHelper.createUser(user_data);
    if (create_user) {
      await logger.filecheck(
        `INFO: Institution Admin created for institution ${institutionId}: by ${createdBy} at ${time} with data ${JSON.stringify(
          create_user
        )} \n`
      );

      /**
       * begin email sending
       */
      let success = 0;
      let p;
      let emailPhone = email + " or " + phone;
      let emailParams = {
        heading: "Your Institution admin account created successfully",
        previewText: "Exam portal is good!",
        emailPhone,
        email,
        password: pw,
        message: "This exam portal is good.",
        institutionCode: code,
        institutionName: institution.name,
      };
      p = {
        to: email,
        message: emailTemplate.newUser(emailParams),
        subject: "Institution Admin Created ",
      };
      const send_email = await utils.send_email_api(p);
      if (send_email.response.Code === "02") {
        success = 1;
      }
      console.log(`*** email sent ***`);
      email_log_data = {
        email: email,
        requestData: send_email.request,
        responseData: send_email.response,
        emailLogStatus: success,
      };
      const create_email_log = await helper.EmailLogHelper.createEmailLog(
        email_log_data
      );
      console.log(`*** email-log added ***`);

      return utils.send_json_response({
        res,
        data: create_user,
        msg: "Institution Admin successfully created",
        statusCode: 201,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution Admin not created`,
        errorCode: "USR05",
        statusCode: 500,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Institution Admin create failed with error ${error.message}`,
      errorCode: "USR06",
      statusCode: 500,
    });
  }
});

/**
 * @desc Users
 * @route POST /api/v2/admin/update
 * @access PUBLIC
 */
exports.updateAdmin = asyncHandler(async (req, res, next) => {
  try {
    let createdBy = req.user.id || null;
    let { phone, email, lastName, firstName, middleName, id } = req.body;
    if (!id)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `User not provided`,
        errorCode: "USR07",
        statusCode: 406,
      });
    const validationSchema = Joi.object({
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      middleName: Joi.string(),
      email: Joi.string().min(5).max(50).email().required(),
      phone: Joi.string().min(9).max(15).required(),
      id: Joi.string(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution admin update failed with validation error ${error.details[0].message}`,
        errorCode: "USR08",
        statusCode: 400,
      });
    /**
     * assemble user params for update
     */
    console.log("begin update");
    const ObjectId = require("mongoose").Types.ObjectId;
    let user_data = {
      phone,
      email,
      lastName,
      firstName,
      middleName,
    };
    const update_user = await helper.UserHelper.findUpdate({
      filter: {
        _id: new ObjectId(id),
      },
      update: {
        $set: user_data,
      },
      options: { upsert: true, new: true },
    });
    if (!update_user.result) {
      return utils.send_json_error_response({
        res,
        data: update_user.result,
        msg: update_user.message,
        errorCode: "USR09",
        statusCode: 501,
      });
    } else {
      await logger.filecheck(
        `INFO: Institution Admin updated : by ${createdBy} at ${time} with data ${JSON.stringify(
          update_user.result
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: update_user.result,
        msg: "Institution Admin successfully updated",
        statusCode: 201,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Institution Admin update failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});

/**
 * @desc Users
 * @route POST /api/v2/user/add
 * @access PUBLIC
 */
exports.addUser = asyncHandler(async (req, res, next) => {
  let email_log_data;
  try {
    let createdBy = req.user.id || null;
    let { phone, email, lastName, firstName, middleName, institutionId } =
      req.body;
    if (!institutionId)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution must be provided to proceed`,
        errorCode: "USR10",
        statusCode: 406,
      });
    const validationSchema = Joi.object({
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      middleName: Joi.string(),
      email: Joi.string().min(5).max(50).email().required(),
      phone: Joi.string().min(9).max(15).required(),
      institutionId: Joi.string(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution user create failed with validation error ${error.details[0].message}`,
        errorCode: "USR11",
        statusCode: 400,
      });
    const ObjectId = require("mongoose").Types.ObjectId;
    let institution = await helper.InstitutionHelper.getInstitution({
      where: { _id: new ObjectId(institutionId) },
    });
    if (_.isEmpty(institution))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution do not exist`,
        errorCode: "USR12",
        statusCode: 404,
      });
    institutionId = institution._id;
    const check_user_already_created = await helper.UserHelper.getUser({
      $or: [{ email }, { phone }],
    });
    if (check_user_already_created)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution user email/phone already exist`,
        errorCode: "USR13",
        statusCode: 404,
      });
    /**
     * assemble user params for create
     */
    let pw = generator.generate({
      length: 10,
      numbers: true,
      uppercase: true,
      lowercase: true,
      symbols: false,
    });
    let pw_hashed = await utils.hashPassword(pw);
    console.log(`Generated password for user: ${pw}`);
    let user_data = {
      phone,
      email,
      lastName,
      firstName,
      middleName,
      password: pw_hashed,
      institutionId,
      firstLogin: 1,
      status: 1,
      createdBy,
    };
    const create_user = await helper.UserHelper.createUser(user_data);
    if (create_user) {
      await logger.filecheck(
        `INFO: Institution user created for institution ${institutionId}: by ${createdBy} at ${time} with data ${JSON.stringify(
          create_user
        )} \n`
      );

      /**
       * begin email sending
       */
      let success = 0;
      let p;
      let emailPhone = email + " or " + phone;
      let emailParams = {
        heading: "Your Institution user account created successfully",
        previewText: "Exam portal is good!",
        emailPhone,
        email,
        password: pw,
        message: "This exam portal is good.",
        institutionCode: institution.institutionCode,
        institutionName: institution.name,
      };
      p = {
        to: email,
        message: emailTemplate.newUser(emailParams),
        subject: "Institution User Created ",
      };
      const send_email = await utils.send_email_api(p);
      if (send_email.response.Code === "02") {
        success = 1;
      }
      console.log(`*** email sent ***`);
      email_log_data = {
        email: email,
        requestData: send_email.request,
        responseData: send_email.response,
        emailLogStatus: success,
      };
      const create_email_log = await helper.EmailLogHelper.createEmailLog(
        email_log_data
      );
      console.log(`*** email-log added ***`);

      return utils.send_json_response({
        res,
        data: create_user,
        msg: "Institution User successfully created",
        statusCode: 201,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution User not created`,
        errorCode: "USR14",
        statusCode: 502,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Institution User create failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});

/**
 * @desc Users
 * @route POST /api/v2/admin/update
 * @access PUBLIC
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
  try {
    let createdBy = req.user.id || null;
    let { phone, email, lastName, firstName, middleName, id } = req.body;
    if (!id)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `User not provided`,
        errorCode: "USR15",
        statusCode: 406,
      });
    const validationSchema = Joi.object({
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      middleName: Joi.string(),
      email: Joi.string().min(5).max(50).email().required(),
      phone: Joi.string().min(9).max(15).required(),
      id: Joi.string(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution user update failed with validation error ${error.details[0].message}`,
        errorCode: "USR17",
        statusCode: 400,
      });
    /**
     * assemble user params for update
     */
    console.log("begin update");
    const ObjectId = require("mongoose").Types.ObjectId;
    let user_data = {
      phone,
      email,
      lastName,
      firstName,
      middleName,
    };
    const update_user = await helper.UserHelper.findUpdate({
      filter: {
        _id: new ObjectId(id),
      },
      update: {
        $set: user_data,
      },
      options: { upsert: true, new: true },
    });
    if (!update_user.result) {
      return utils.send_json_error_response({
        res,
        data: update_user.result,
        msg: update_user.message,
        errorCode: "USR18",
        statusCode: 502,
      });
    } else {
      await logger.filecheck(
        `INFO: Institution user updated : by ${createdBy} at ${time} with data ${JSON.stringify(
          update_user.result
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: update_user.result,
        msg: "Institution user successfully updated",
        statusCode: 201,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Institution user update failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});

/**
 * @desc listUsers
 * @route GET /api/v2/user/list
 * @access Institution User
 */
exports.listUsers = asyncHandler(async (req, res, next) => {
  try {
    let createdBy = req.user.id;
    const ObjectId = require("mongoose").Types.ObjectId;
    if (_.isEmpty(req.query)) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Provide query params like sort, page and per_page!`,
        errorCode: "USR19",
        statusCode: 400,
      });
    }
    let phone,
      email,
      name,
      status,
      institutionId,
      isInstitutionAdmin,
      isLmsAdmin,
      isSystemAdmin,
      dateTo,
      dateFrom;
    let where = {};
    if (!_.isEmpty(req.body.isSystemAdmin) && req.body.isSystemAdmin) {
      isSystemAdmin = parseInt(req.body.isSystemAdmin);
      where.isSystemAdmin = isSystemAdmin;
    }
    if (!_.isEmpty(req.body.institutionId) && req.body.institutionId) {
      institutionId = new ObjectId(req.body.institutionId);
      where.institutionId = institutionId;
    }
    if (!_.isEmpty(req.body.isLmsAdmin) && req.body.isLmsAdmin) {
      isLmsAdmin = parseInt(req.body.isLmsAdmin);
      where.isLmsAdmin = isLmsAdmin;
    }
    if (
      !_.isEmpty(req.body.isInstitutionAdmin) &&
      req.body.isInstitutionAdmin
    ) {
      isInstitutionAdmin = parseInt(req.body.isInstitutionAdmin);
      where.isInstitutionAdmin = isInstitutionAdmin;
    }
    if (!_.isEmpty(req.body.phone) && req.body.phone) {
      phone = req.body.phone;
      where.phone = phone;
    }
    if (!_.isEmpty(req.body.email) && req.body.email) {
      email = req.body.email;
      where.email = email;
    }
    if (!_.isEmpty(req.body.name) && req.body.name) {
      name = req.body.name;
      where.userName = {
        $regex: ".*" + name + ".*",
        $options: "i",
      };
    }
    if (req.body.hasOwnProperty("status")) {
      status = req.body.status;
      where.status = parseInt(status);
    }
    if (
      !_.isEmpty(req.body.dateTo) &&
      req.body.dateTo &&
      !_.isEmpty(req.body.dateFrom) &&
      req.body.dateFrom
    ) {
      dateTo = req.body.dateTo;
      dateFrom = req.body.dateFrom;
      where.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      };
    }
    /**
     * build query options for mongoose-paginate
     */
    const queryOptions = await utils.buildQueryOptions(req.query);
    if (typeof queryOptions === "string") {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${queryOptions} is not valid!`,
        errorCode: "USR20",
        statusCode: 400,
      });
    }
    /**
     * fetch paginated data using queryOptions
     */
    const objWithoutMeta = await helper.UserHelper.getUsers({
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
        `INFO: Institution list by: ${createdBy}, at ${time} with data ${JSON.stringify(
          obj
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: obj,
        msg: "User list successfully fetched",
        statusCode: 200,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `No record!`,
        errorCode: "USR21",
        statusCode: 404,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `User list failed with error: ${error.message}, errorcode:${error.errorCode}`,
      errorCode: "USR22",
      statusCode: 500,
    });
  }
});

/**
 * @desc admin getInstitutionAdmin
 * @route POST /api/v2/admin/institution/single
 * @access PUBLIC
 */
exports.getInstitutionAdmin = asyncHandler(async (req, res, next) => {
  let subject = "Institution Admin";
  try {
    let createdBy = req.user.id;
    const ObjectId = require("mongoose").Types.ObjectId;
    let { id } = req.body;
    let where = { _id: new ObjectId(id) };
    if (!(await utils.isValidObjectId(id)))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406,
      });
    where.isInstitutionAdmin = 1;
    const obj = await helper.UserHelper.getUser(where);
    if (!_.isEmpty(obj)) {
      await logger.filecheck(
        `INFO: ${subject} fetched successfully by: ${createdBy} with data ${JSON.stringify(
          obj
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: obj,
        msg: `${subject} successfully fetched`,
        statusCode: 200,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `No record!`,
        errorCode: "USR23",
        statusCode: 404,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subject} fetch failed with error ${error.message}`,
      errorCode: "USR24",
      statusCode: 500,
    });
  }
});

/**
 * @desc admin getSystemAdmin
 * @route POST /api/v2/admin/system/single
 * @access PUBLIC
 */
exports.getSystemAdmin = asyncHandler(async (req, res, next) => {
  let subject = "System Admin";
  try {
    let createdBy = req.user.id;
    const ObjectId = require("mongoose").Types.ObjectId;
    let { id } = req.body;
    if (!(await utils.isValidObjectId(id)))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406,
      });
    let where = { _id: new ObjectId(id) };
    where.isSystemAdmin = 1;
    const obj = await helper.UserHelper.getUser(where);
    if (!_.isEmpty(obj)) {
      await logger.filecheck(
        `INFO: ${subject} fetched successfully by: ${createdBy} with data ${JSON.stringify(
          obj
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: obj,
        msg: `${subject} successfully fetched`,
        statusCode: 200,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `No record!`,
        errorCode: "USR23",
        statusCode: 404,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subject} fetch failed with error ${error.message}`,
      errorCode: "USR24",
      statusCode: 500,
    });
  }
});

/**
 * @desc user getOne
 * @route POST /api/v2/user/single
 * @access PUBLIC
 */
exports.getUser = asyncHandler(async (req, res, next) => {
  let subject = "User";
  try {
    let createdBy = req.user.id;
    const ObjectId = require("mongoose").Types.ObjectId;
    let { id } = req.body;
    if (!(await utils.isValidObjectId(id)))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406,
      });
    let where = { _id: new ObjectId(id) };
    where.isInstitutionAdmin = 0;
    where.isSystemAdmin = 0;
    const obj = await helper.UserHelper.getUser(where);
    if (!_.isEmpty(obj)) {
      await logger.filecheck(
        `INFO: ${subject} fetched successfully by: ${createdBy} with data ${JSON.stringify(
          obj
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: obj,
        msg: `${subject} successfully fetched`,
        statusCode: 200,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `No record!`,
        errorCode: "USR23",
        statusCode: 404,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subject} fetch failed with error ${error.message}`,
      errorCode: "USR24",
      statusCode: 500,
    });
  }
});
