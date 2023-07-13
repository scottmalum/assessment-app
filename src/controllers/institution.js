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
const Institution = require("../models/Institution");
require("dotenv").config();
let appRoot = require("app-root-path");
let emailTemplate = require(`${appRoot}/src/utils/emailTemplate`);
const path = require("path");

let subjectPascal = "Institution";
let subjectCamel = "institution";
let subjectSmall = "institution";
let subjectContainer = "institutionData";
let subjectHelperCreate = helper.InstitutionHelper.createInstitution;
let subjectHelperGet = helper.InstitutionHelper.getInstitutions;
let subjectHelperUpdate = helper.InstitutionHelper.findUpdate;

/**
 * @desc Institution
 * @route POST /api/v2/institution/add
 * @access PUBLIC
 * @param ?e00987TE4=code this is the token,frontend pass it as token to /add
 */
exports.setup = asyncHandler(async (req, res, next) => {
  let sender;
  let validationSchema;
  try {
    /**
     * validate request body
     * @type {Joi.ObjectSchema<any>}
     */
    validationSchema = Joi.object({
      email: Joi.string().min(5).max(50).email().required(),
      url: Joi.string().required(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} setup validation failed with error: ${error.details[0].message}`,
        errorCode: "INS01",
        statusCode: 406,
      });
    let { email, url } = req.body;
    let token = await helper.TokenHelper.createToken({ data: { email, url } });
    let instManagerCreate_URL = url + "?e00987TE4=" + token.token;

    // console.log(`*** begin email sending ***`);
    // let subject = "Institution Email Verification";
    // let emailParams = {
    //   heading: `"Email verified"`,
    //   previewText:
    //       "Exam Portal is awesome!",
    //   message:
    //       `welcome to ${process.env.APP_NAME}, your requested to setup an institution. kindly click on the link below to setup your institution. ${instManagerCreate_URL}`,
    //   url: instManagerCreate_URL,
    //   url_text: "Setup Institution",
    // };
    // let template = emailTemplate.forgotPassword(emailParams);
    // let p = {
    //   to: email,
    //   message: template,
    //   subject,
    // };
    // let success;
    // sender = await utils.send_email_api(p);
    // if (sender.response.Code === "02") {
    //   success = 1;
    // }
    // let email_log_data = {
    //   email,
    //   requestData: sender.request,
    //   responseData: sender.response,
    //   emailLogStatus: success,
    // };
    // await helper.EmailLogHelper.createEmailLog(email_log_data);
    // console.log(`*** emailLog created ***`);

    await logger.filecheck(
      `INFO: ${subjectPascal}: setup link sent at ${time}  \n`
    );
    return utils.send_json_response({
      res,
      data: { instManagerCreate_URL },
      msg: `${subjectPascal} setup link sent to your email.`,
      statusCode: 201,
    });
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subjectPascal} setup failed with error ${error.message}`,
      errorCode: "INS02",
      statusCode: 500,
    });
  }
});

/**
 * @desc Institution
 * @route POST /api/v2/institution/add
 * @access PUBLIC
 * @param token
 */
exports.add = asyncHandler(async (req, res, next) => {
  let sender, createdBy;
  let validationSchema;
  try {
    /**
     * validate request body
     * @type {Joi.ObjectSchema<any>}
     */
    validationSchema = Joi.object({
      name: Joi.string().min(5).max(50).required(),
      phone: Joi.string().min(11).max(15),
      address: Joi.string().min(10).max(100).required(),
      password: Joi.string(),
      token: Joi.string(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} create validation failed with error: ${error.details[0].message}`,
        errorCode: "INS01",
        statusCode: 406,
      });
    if (req.user) createdBy = req.user.id || null;
    let { name, phone, address, password, token } = req.body;
    if (!(await utils.passwordPolicyPassed(password))) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Password should contain a letter, number, upper, lower, special character and greater than 8!`,
        errorCode: "AUTH09",
        statusCode: 406,
      });
    }
    let process_token = await helper.TokenHelper.processToken({
      token,
      dataColumn: "email",
    });
    if (_.isEmpty(process_token.result) || process_token.message !== "success")
      return utils.send_json_error_response({
        res,
        data: [],
        msg: process_token.message,
        errorCode: "AUTH10",
        statusCode: 406,
      });
    let institutionCode =
      await helper.InstitutionHelper.generateInstitutionCode();
    let email = process_token.result.data.email;
    let url = process_token.result.data.url;
    const check_user = await helper.UserHelper.getUser({
      $or: [{ email }, { phone }],
    });
    const check_institution = await helper.InstitutionHelper.getInstitution({
      $or: [{ email }, { phone }],
    });
    if (check_institution)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Email and/or phone cannot be used to create another institution`,
        errorCode: "USR04",
        statusCode: 201,
      });
    if (check_user)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Email and/or phone cannot be used to create another user`,
        errorCode: "USR04",
        statusCode: 201,
      });
    let subjectContainer = {
      name,
      phone,
      email,
      address,
      institutionCode,
      createdBy,
    };
    const create = await subjectHelperCreate(subjectContainer);
    if (!create)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "Institution create failed",
        errorCode: "AUTH10",
        statusCode: 502,
      });
    await logger.filecheck(
      `INFO: ${subjectPascal}: ${name} created at ${time} with data ${JSON.stringify(
        create
      )} \n`
    );
    let pw_hashed = await utils.hashPassword(password);
    let nameArr = await utils.parseNameToFirstLastMiddle({
      name,
      firstNamePad: "Institution",
      middleNamePad: "",
    });
    let lastName = nameArr.lastName;
    let firstName = nameArr.firstName;
    let middleName = nameArr.middleName;
    let user_data = {
      phone,
      email,
      lastName,
      firstName,
      middleName,
      password: pw_hashed,
      institutionId: create._id,
      isInstitutionAdmin: 1,
      firstLogin: 2,
      status: 1,
    };
    const create_user = await helper.UserHelper.createUser(user_data);
    if (create_user) {
      await logger.filecheck(
        `INFO: Institution Admin created for institution ${name}: at ${time} with data ${JSON.stringify(
          create_user
        )} \n`
      );
      // console.log(`*** begin email sending ***`);
      // let p;
      // let emailPhone = email + " or " + phone;
      // let emailParams = {
      //   heading: "Your Institution admin account created successfully",
      //   previewText: "Exam portal is good!",
      //   emailPhone,
      //   email,
      //   password,
      //   message:
      //     "Use the details provided to login to the account as the Institution Admin to configure the institution and add staffs.",
      //   institutionCode,
      //   institutionName: name,
      //   url,
      //   url_text: "Portal Login",
      // };
      // p = {
      //   to: email,
      //   message: emailTemplate.newUser(emailParams),
      //   subject: "Institution Admin Created ",
      // };
      // let success;
      // sender = await utils.send_email_api(p);
      // if (sender.response.Code === "02") {
      //   success = 1;
      // }
      // let email_log_data = {
      //   email,
      //   requestData: sender.request,
      //   responseData: sender.response,
      //   emailLogStatus: success,
      // };
      // await helper.EmailLogHelper.createEmailLog(email_log_data);
      // console.log(`*** emailLog created ***`);
    }
    // disable token
    await helper.TokenHelper.disableToken(token);
    return utils.send_json_response({
      res,
      data: create,
      msg: `${subjectPascal} successfully created, check your mail for login details.`,
      statusCode: 201,
    });
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subjectPascal} create failed with error ${error.message}`,
      errorCode: "INS02",
      statusCode: 500,
    });
  }
});

/**
 * @desc Institution
 * @route GET /api/v2/institution/list
 * @access Institution Admin
 */
exports.list = asyncHandler(async (req, res, next) => {
  try {
    let createdBy = req.user.id;
    /**
     * build query options for mongoose-paginate
     */
    const queryOptions = await utils.buildQueryOptions(req.query);

    if (typeof queryOptions === "string") {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${queryOptions} is not valid!`,
        errorCode: "INS03",
        statusCode: 400,
      });
    }
    /**
     * fetch paginated data using queryOptions
     */
    let where = {};
    if (!_.isEmpty(req.body.name) && req.body.name) {
      where.name = {
        $regex: ".*" + req.body.name + ".*",
        $options: "i",
      };
    }
    if (!_.isEmpty(req.body.institutionCode) && req.body.institutionCode) {
      where.institutionCode = req.body.institutionCode;
    }
    if (!_.isEmpty(req.body.email) && req.body.email) {
      where.email = req.body.email;
    }
    if (!_.isEmpty(req.body.phone) && req.body.phone) {
      where.phone = req.body.phone;
    }
    const objWithoutMeta = await helper.InstitutionHelper.getInstitutions({
      where,
      queryOptions,
    });
    if (objWithoutMeta.data && !_.isEmpty(objWithoutMeta.data)) {
      /**
       * build logoUrl into result-set
       */
      let rr = [];
      for (let i of objWithoutMeta.data) {
        let r = await helper.imageUrl({
          id: i._id,
          type: "institution",
          req,
        });
        i.logoUrl = r.result.href;
        rr.push(i);
      }
      objWithoutMeta.data = rr;

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
        statusCode: 200,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `No record!`,
        errorCode: "INS03",
        statusCode: 404,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subjectPascal} list failed with error ${error.message}`,
      errorCode: "INS05",
      statusCode: 500,
    });
  }
});

/**
 * @desc Institution
 * @route POST /api/v2/institution/update
 * @access PUBLIC
 */
exports.update = asyncHandler(async (req, res) => {
  let createdBy = req.user.id;
  let validationSchema;
  try {
    validationSchema = Joi.object({
      name: Joi.string().min(5).max(50).required(),
      phone: Joi.string().min(11).max(15),
      address: Joi.string().min(10).max(100).required(),
      businessId: Joi.string(),
      institutionConfig: Joi.any(),
      modules: Joi.any(),
      id: Joi.string(),
    });
    const { error } = validationSchema.validate(req.body);
    console.log("error", error);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} update validation failed with error: ${error.details[0].message}`,
        errorCode: "INS06",
        statusCode: 500,
      });
    console.log("begin update");
    let { name, phone, address, modules, institutionConfig, id } = req.body;
    const data = { name, phone, address, modules, institutionConfig };
    const ObjectId = require("mongoose").Types.ObjectId;
    if (!(await utils.isValidObjectId(id)))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406,
      });
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
        errorCode: "INS06",
        statusCode: 500,
      });
    return utils.send_json_response({
      res,
      data: update.result,
      statusCode: 201,
    });
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Error: ${error} `,
      errorCode: "INS07",
      statusCode: 500,
    });
  }
});

/**
 * @desc Institution
 * @route POST /api/v2/institution/logo
 * @access PUBLIC
 */
exports.logo = asyncHandler(async (req, res) => {
  let createdBy = req.user.id;
  let validationSchema;
  try {
    validationSchema = Joi.object({
      id: Joi.string(),
    });
    const { error } = validationSchema.validate(req.body);
    const { id } = req.body;
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} logo upload validation failed with error: ${error.details[0].message}`,
        errorCode: "INS06",
        statusCode: 400,
      });
    if (!(await utils.isValidObjectId(id)))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406,
      });
    console.log("begin update");
    let fileName = "";
    if (req.file) {
      const filePath = path.normalize(req.file.path);
      fileName = path.basename(filePath).toLocaleLowerCase();
      const data = { logo: fileName };
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
          errorCode: "INS06",
          statusCode: 500,
        });
      let r = await helper.imageUrl({
        id,
        type: "institution",
        req,
      });
      update.result.logoUrl = r.result.href || null;
      return utils.send_json_response({
        res,
        data: update.result,
        statusCode: 201,
      });
    } else {
      await logger.filecheck(
        `INFO: ${subjectPascal} update by: ${createdBy}, at ${time} failed: file not uploaded \n`
      );
      return utils.send_json_error_response({
        res,
        data: {},
        msg: `File not uploaded`,
        errorCode: "INS06",
        statusCode: 400,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Error: ${error} `,
      errorCode: "INS07",
      statusCode: 500,
    });
  }
});

/**
 * @desc Institution
 * @route POST /api/v2/institution/logo
 * @access PUBLIC
 */
exports.logoUrl = asyncHandler(async (req, res, next) => {
  let validationSchema;
  try {
    /**
     * validate request body
     * @type {Joi.ObjectSchema<any>}
     */
    validationSchema = Joi.object({
      id: Joi.string().required(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} logoUrl validation failed with error: ${error.details[0].message}`,
        errorCode: "INS01",
        statusCode: 406,
      });
    let { id } = req.body;
    if (!(await utils.isValidObjectId(id)))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406,
      });
    //return res.sendFile(`${appRoot}/public/uploads/institutions/${code}/logo/${logo}`)
    let r = await helper.imageUrl({
      id,
      type: "institution",
      req,
    });
    if (r.result)
      return utils.send_json_response({
        res,
        data: { url: r.result.href },
        msg: `Institution Logo fetched successfully.`,
        statusCode: 200,
      });
    return utils.send_json_error_response({
      res,
      data: [],
      msg: r.message,
      errorCode: "INS02",
      statusCode: 404,
    });
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Institution logoUrl fetch failed with error ${error.message}`,
      errorCode: "INS02",
      statusCode: 500,
    });
  }
});

/**
 * @desc Institution
 * @route POST /api/v2/institution/delete
 * @access PUBLIC
 */
exports.remove = asyncHandler(async (req, res, next) => {
  try {
    let deletedBy = req.user.id;
    let { ids } = req.body;
    let model = subjectPascal;
    const ObjectId = require("mongoose").Types.ObjectId;
    ids.map(async (d) => {
      if (await utils.isValidObjectId(d)) new ObjectId(d);
    });
    let del = await helper.backupAndDelete({
      ids,
      deletedBy,
      model,
    });
    if (del.deletedCount >= 1) {
      await logger.filecheck(
        `INFO: ${subjectPascal} deleted: by ${deletedBy} at ${time} with data ${JSON.stringify(
          del
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: del,
        msg: `${subjectPascal} successfully deleted`,
        statusCode: 200,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} delete failed`,
        errorCode: "INS08",
        statusCode: 502,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subjectPascal} delete failed with error ${error.message}`,
      errorCode: "INS09",
      statusCode: 500,
    });
  }
});

/**
 * @desc Institution
 * @route POST /api/v2/institution/single
 * @access PUBLIC
 */
exports.getInstitution = asyncHandler(async (req, res, next) => {
  let subject = "Institution";
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
    let obj = await helper.InstitutionHelper.getInstitution(where);
    if (!_.isEmpty(obj)) {
      let r = await helper.imageUrl({
        id,
        type: "institution",
        req,
      });
      obj.logoUrl = r.result.href || null;
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
        errorCode: "APP34",
        statusCode: 404,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subject} fetch failed with error ${error.message}`,
      errorCode: "APP35",
      statusCode: 500,
    });
  }
});

/**
 * @desc InstitutionDocumentType
 * @route POST /api/v2/institution/addDocType
 * @access Institution admin
 */
exports.addDocType = asyncHandler(async (req, res, next) => {
  let createdBy = req.user.id || null;
  let validationSchema;
  try {
    /**
     * validate request body
     * @type {Joi.ObjectSchema<any>}
     */
    validationSchema = Joi.object({
      name: Joi.string().min(5).max(50).required(),
      abbr: Joi.string(),
      type: Joi.any(),
      institutionId: Joi.string(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} document type create validation failed with error: ${error.details[0].message}`,
        errorCode: "SUBO1",
        statusCode: 406,
      });
    let { name, abbr, type, institutionId } = req.body;
    if (!(await utils.isValidObjectId(institutionId)))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "Institution ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406,
      });
    subjectContainer = {
      name: name.toUpperCase(),
      abbr: abbr.toLowerCase(),
      type,
      createdBy,
      institutionId,
    };
    const create = await helper.InstitutionHelper.createInstitutionDocumentType(
      subjectContainer
    );
    await logger.filecheck(
      `INFO: ${subjectPascal}: ${name} created by ${createdBy}: at ${time} with data ${JSON.stringify(
        create
      )} \n`
    );
    return utils.send_json_response({
      res,
      data: create,
      msg: `${subjectPascal} document type successfully created.`,
      statusCode: 201,
    });
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subjectPascal} document type create failed with error ${error.message}, code: ${error.errorCode}`,
      errorCode: "SUBO2",
      statusCode: 502,
    });
  }
});

/**
 * @desc InstitutionDocumentType
 * @route POST /api/v2/institution/updateDocType
 * @access Institution admin
 */
exports.listDocType = asyncHandler(async (req, res, next) => {
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
    if (
      !_.isEmpty(req.body.institutionId) &&
      req.body.institutionId &&
      (await utils.isValidObjectId(req.body.institutionId))
    ) {
      where.institutionId = new ObjectId(req.body.institutionId);
    }
    if (!_.isEmpty(req.body.type) && req.body.type) {
      where.type = { $in: req.body.type };
    }
    if (!_.isEmpty(req.body.name) && req.body.name) {
      where.name = {
        $regex: ".*" + req.body.name + ".*",
        $options: "i",
      };
    }
    if (!_.isEmpty(req.body.abbr) && req.body.abbr) {
      where.abbr = {
        $regex: ".*" + req.body.abbr + ".*",
        $options: "i",
      };
    }
    const objWithoutMeta =
      await helper.InstitutionHelper.getInstitutionDocumentTypes({
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
        `INFO: ${subjectPascal} document type list by: ${createdBy}, at ${time} with data ${JSON.stringify(
          obj
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: obj,
        msg: `${subjectPascal} document type list successfully fetched`,
        statusCode: 200,
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
      msg: `${subjectPascal} document type list failed with error ${error.message}`,
      errorCode: "SUBO5",
      statusCode: 500,
    });
  }
});

/**
 * @desc InstitutionDocumentType
 * @route POST /api/v2/institution/updateDocType
 * @access Institution admin
 */
exports.updateDocType = asyncHandler(async (req, res) => {
  let createdBy = req.user.id;
  let validationSchema;
  try {
    validationSchema = Joi.object({
      name: Joi.string().min(5).max(50),
      abbr: Joi.string(),
      type: Joi.any(),
      id: Joi.string(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} document type update validation failed with error: ${error.details[0].message}`,
        errorCode: "SUBO6",
        statusCode: 406,
      });
    const { name, abbr, type, id } = req.body;
    if (!(await utils.isValidObjectId(id)))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: "ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406,
      });
    const data = {
      name: name.toUpperCase(),
      abbr: abbr.toLowerCase(),
      type,
      createdBy,
    };
    const ObjectId = require("mongoose").Types.ObjectId;
    const update = await helper.InstitutionHelper.updateInstitutionDocumentType(
      {
        filter: {
          _id: new ObjectId(id),
        },
        update: {
          $set: data,
        },
        options: { upsert: true, new: true },
      }
    );
    if (!update.result)
      return utils.send_json_error_response({
        res,
        data: update.result,
        msg: update.message,
        errorCode: "SUBO7",
        statusCode: 502,
      });
    return utils.send_json_response({
      res,
      data: update.result,
      statusCode: 201,
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
 * @desc InstitutionDocumentType
 * @route POST /api/v2/institution/deleteDocType
 * @access Institution admin
 */
exports.removeDocType = asyncHandler(async (req, res, next) => {
  try {
    let deletedBy = req.user.id;
    let { ids } = req.body;
    let model = "InstitutionDocumentType";
    const ObjectId = require("mongoose").Types.ObjectId;
    ids.map(async (d) => {
      if (await utils.isValidObjectId(d)) new ObjectId(d);
    });
    let del = await helper.backupAndDelete({
      ids,
      deletedBy,
      model,
    });
    if (del.deletedCount >= 1) {
      await logger.filecheck(
        `INFO: ${subjectPascal} document type deleted: by ${deletedBy} at ${time} with data ${JSON.stringify(
          del
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: del,
        msg: `${subjectPascal} document type successfully deleted`,
        statusCode: 200,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${subjectPascal} document type delete failed`,
        errorCode: "SUBO9",
        statusCode: 501,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subjectPascal} document type delete failed with error ${error.message}`,
      errorCode: "SUB10",
      statusCode: 500,
    });
  }
});

/**
 * @desc InstitutionDocumentType
 * @route POST /api/v2/institution/docType/single
 * @access PUBLIC
 */
exports.getDocType = asyncHandler(async (req, res, next) => {
  let subject = "Institution Document Type";
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
    const obj = await helper.InstitutionHelper.getInstitutionDocumentType(
      where
    );
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
        errorCode: "APP34",
        statusCode: 404,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `${subject} fetch failed with error ${error.message}`,
      errorCode: "APP35",
      statusCode: 500,
    });
  }
});
