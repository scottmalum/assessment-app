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
const fs = require("fs");
const XLSX = require("xlsx");
const path = require("path");
const appRoot = require("app-root-path");

/**
 * @desc Candidate
 * @route POST /api/v2/candidate/add
 * @access PUBLIC
 */
exports.add = asyncHandler(async (req, res, next) => {
  let email_log_data;
  try {
    let createdBy = req.user.id || null;
    let {
      title,
      firstName,
      lastName,
      middleName,
      email,
      phone,
      candidateTypeId,
      institutionId,
      gender,
    } = req.body;
    if (!institutionId)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution must be provided to proceed`,
        errorCode: "E404",
        statusCode: 400,
      });
    const validationSchema = Joi.object({
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      middleName: Joi.string(),
      email: Joi.string().min(5).max(50).email().required(),
      phone: Joi.string().min(9).max(15).required(),
      institutionId: Joi.string(),
      title: Joi.string().min(2).max(10).required(),
      candidateTypeId: Joi.string().required(),
      gender: Joi.string().max(20).min(4),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution Candidate create failed with validation error ${error.details[0].message}`,
        errorCode: "E502",
        statusCode: 406,
      });
    const ObjectId = require("mongoose").Types.ObjectId;
    if(!await utils.isValidObjectId(institutionId))
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Institution ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406
      });
    let institution = await helper.InstitutionHelper.getInstitution({ _id: new ObjectId(institutionId) });
    if (_.isEmpty(institution))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution does not exist`,
        errorCode: "E404",
        statusCode: 500,
      });
    institutionId = institution._id;
    const check_candidate_already_created =
      await helper.CandidateHelper.getCandidate({
        $or: [{ email }, { phone }],
      });
    if (check_candidate_already_created)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution Candidate email/phone already exist`,
        errorCode: "E404",
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
    let candidate_data = {
      title,
      firstName,
      lastName,
      middleName,
      candidateCode: await helper.CandidateHelper.generateCode(),
      email,
      phone,
      candidateTypeId,
      institutionId,
      gender,
      firstLogin: 1,
      status: 1,
      password: pw_hashed,
      createdBy
    };
    const create_candidate = await helper.CandidateHelper.createCandidate(
      candidate_data
    );
    if (create_candidate) {
      await logger.filecheck(
        `INFO: Institution Candidate created for institution ${institutionId}: by ${createdBy} at ${time} with data ${JSON.stringify(
          create_candidate
        )} \n`
      );

      /**
       * begin email sending
       */
        let success = 0;
        let p;
        let emailPhone = email + " or " + phone;
        let emailParams = {
          heading: "Your Candidate account created successfully",
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
          subject: "Candidate Created ",
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
        data: create_candidate,
        msg: "Institution Candidate successfully created",
        statusCode: 201
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution Candidate not created`,
        errorCode: "E501",
        statusCode: 501,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Institution Candidate create failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});


/**
 * @desc Candidate
 * @route POST /api/v2/candidate/photo
 * @access PUBLIC
 */
exports.photoUrl = asyncHandler(async (req, res, next) => {
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
        msg: `Candidate photoUrl validation failed with error: ${error.details[0].message}`,
        errorCode: "INS01",
        statusCode: 406,
      });
    let { id } = req.body;
    if(!await utils.isValidObjectId(id))
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406
      });
    let r = await helper.imageUrl({
      id,
      type: "candidate",
      req,
    });
    if(r.result)
      return utils.send_json_response({
        res,
        data: {url: r.result.href},
        msg: `Candidate photo fetched successfully.`,
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
      msg: `Candidate photo fetch failed with error ${error.message}`,
      errorCode: "INS02",
      statusCode: 500,
    });
  }
});

/**
 * @desc Candidate
 * @route POST /api/v2/candidate/addBulk
 * @access PUBLIC
 */
exports.addBulk = asyncHandler(async (req, res, next) => {
  let email_log_data;
  let bad = [];
  let good = [];
  try {
    let createdBy = req.user.id || null;
    let {
      data,
      institutionId
    } = req.body;
    const validationSchema = Joi.object({
      institutionId: Joi.string(),
      data: Joi.array().items(Joi.object({
        firstName: Joi.string().min(1).max(50).required(),
        lastName: Joi.string().min(1).max(50).required(),
        middleName: Joi.string().allow(null, ''),
        email: Joi.string().min(5).max(50).email().required(),
        phone: Joi.string().min(9).max(15).required(),
        institutionId: Joi.string(),
        title: Joi.string().min(2).max(10).required(),
        candidateTypeId: Joi.string().required(),
        gender: Joi.string().max(20).min(4),
      }))
    })
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Candidate bulk create failed with validation error ${error.details[0].message}`,
        errorCode: "E502",
        statusCode: 406,
      });
    const ObjectId = require("mongoose").Types.ObjectId;
    if(!await utils.isValidObjectId(institutionId))
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Institution ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406
      });
    let institution = await helper.InstitutionHelper.getInstitution({ _id: new ObjectId(institutionId) });
    if (_.isEmpty(institution))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution does not exist`,
        errorCode: "E404",
        statusCode: 500,
      });
    institution = institution[0];
    let iid = institution._id;
    for(let u of data){
      const check_candidate_already_created =
          await helper.CandidateHelper.getCandidate({
            $or: [{ email: u.email }, { phone: u.phone }],
          });
      if (check_candidate_already_created){
        u.reason = "User already exist!"
        bad.push(u)
      }else{
        let pw = generator.generate({
          length: 10,
          numbers: true,
          uppercase: true,
          lowercase: true,
          symbols: false,
        });
        let pw_hashed = await utils.hashPassword(pw);
        let {
          title,
          firstName,
          lastName,
          middleName,
          email,
          phone,
          candidateTypeId,
          gender,
        } = u;
        let candidate_data = {
          title,
          firstName,
          lastName,
          middleName,
          candidateCode: await helper.CandidateHelper.generateCode(),
          email,
          phone,
          candidateTypeId,
          institutionId: iid,
          gender,
          firstLogin: 1,
          status: 1,
          password: pw_hashed,
          createdBy
        };
        try{
          const create_candidate = await helper.CandidateHelper.createCandidate(
              candidate_data
          );
          if (create_candidate) {
            await logger.filecheck(
                `INFO: Institution Candidate created for institution ${institutionId}: by ${createdBy} at ${time} with data ${JSON.stringify(
                    create_candidate
                )} \n`
            );
            good.push(create_candidate)
            /**
             * begin email sending
             */
            let success = 0;
            let p;
            let emailPhone = email + " or " + phone;
            let emailParams = {
              heading: "Your Candidate account created successfully",
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
              subject: "Candidate Created ",
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
          }else{
            u.reason = "Candidate create failed!"
            bad.push(u)
          }
        }catch (e) {
          u.reason = e.message
          bad.push(u)
        }
      }
    }
    return utils.send_json_response({
      res,
      data: {success: good, error: bad},
      msg: "Candidate successfully created",
      statusCode: 201
    });
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Institution Candidate bulk create failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});

/**
 * @desc list Candidates
 * @route GET /api/v2/candidate/list
 * @access Institution User
 */
exports.list = asyncHandler(async (req, res, next) => {
  try {
    //let createdBy = req.user.id;
    if (_.isEmpty(req.query)) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Provide query params like sort, page and per_page!`,
        errorCode: "E501",
        statusCode: 200,
      });
    }
    const ObjectId = require("mongoose").Types.ObjectId;
    let where = {};
    if (!_.isEmpty(req.body.name) && req.body.name) {
      where["$or"] = [
        {
          lastName: {
            $regex: ".*" + req.body.name + ".*",
            $options: "i",
          }
        },
        {
          firstName: {
            $regex: ".*" + req.body.name + ".*",
            $options: "i",
          }
        }
      ]
    }
    if (!_.isEmpty(req.body.institutionId) && req.body.institutionId && await utils.isValidObjectId(req.body.institutionId)) {
      where.institutionId = new ObjectId(req.body.institutionId);
    }
    if (!_.isEmpty(req.body.candidateTypeId) && req.body.candidateTypeId && await utils.isValidObjectId(req.body.candidateTypeId)) {
      where.candidateTypeId = new ObjectId(req.body.candidateTypeId);
    }
    if (!_.isEmpty(req.body.email) && req.body.email) {
      where.email = (req.body.email);
    }
    if (!_.isEmpty(req.body.phone) && req.body.phone) {
      where.phone = (req.body.phone);
    }
    if (!_.isEmpty(req.body.gender) && req.body.gender) {
      where.gender = (req.body.gender);
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
        errorCode: "E501",
        statusCode: 406,
      });
    }
    /**
     * fetch paginated data using queryOptions
     */
    const objWithoutMeta = await helper.CandidateHelper.getCandidates({
      where,
      queryOptions,
    });
    if (objWithoutMeta.data && !_.isEmpty(objWithoutMeta.data)) {
      /**
       * build photoUrl into result-set
       */
      let rr = [];
      for(let i of objWithoutMeta.data){
        let r = await helper.imageUrl({
          id: i._id,
          type: "candidate",
          req,
        });
        i.photoUrl = r.result.href;
        rr.push(i)
      }
      objWithoutMeta.data = rr;
      /**
       * build response data meta for pagination
       */
      let url = req.protocol + "://" + req.get("host") + req.originalUrl;
      const obj = await utils.buildResponseMeta({ url, obj: objWithoutMeta });
      await logger.filecheck(
        `INFO: Candidates list by:, at ${time} with data ${JSON.stringify(
          obj
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: obj,
        msg: "Candidate list successfully fetched",
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `No record!`,
        errorCode: "E404",
        statusCode: 404,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Candidate list failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});

/**
 * @desc Update Candidate Details
 * @route POST /api/v2/candidate/update
 * @access PUBLIC
 */
exports.update = asyncHandler(async (req, res, next) => {
  try {
    let createdBy = req.user.id || null;
    let {
      title,
      firstName,
      lastName,
      middleName,
      email,
      phone,
      status,
      id,
    } = req.body;
    if (!id)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `User not provided`,
        errorCode: "E404",
        statusCode: 406,
      });
    const validationSchema = Joi.object({
      firstName: Joi.string().min(1).max(50),
      lastName: Joi.string().min(1).max(50),
      middleName: Joi.string(),
      email: Joi.string().min(5).max(50).email(),
      phone: Joi.string().min(9).max(15),
      status: Joi.number().min(0).max(1),
      title: Joi.string().min(2).max(10),
      id: Joi.string().required(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Candidate update failed with validation error ${error.details[0].message}`,
        errorCode: "E501",
        statusCode: 200,
      });
    /**
     * assemble user params for update
     */
    const ObjectId = require("mongoose").Types.ObjectId;
    if(!await utils.isValidObjectId(id))
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406
      });
    const record = await helper.CandidateHelper.getCandidate({ _id: id });
    if (!record) {
      return utils.send_json_error_response({
        res,
        data: {},
        msg: "Record not found",
        errorCode: "E401",
        statusCode: 404
      });
    }
    const filePath = path.normalize(req.file.path);
    const fileName = path.basename(filePath).toLocaleLowerCase();
    let candidate_data = {
      title,
      firstName,
      lastName,
      middleName,
      email,
      phone,
      status,
      photoUrl: fileName,
    };
    const update_candidate = await helper.CandidateHelper.findUpdate({
      filter: {
        _id: new ObjectId(id),
      },
      update: {
        $set: candidate_data,
      },
      options: { upsert: true, new: true },
    });
    if (!update_candidate.result) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: update_candidate.message,
        errorCode: "E401333",
        statusCode: 500
      });
    } else {
      await logger.filecheck(
        `INFO: Candidate updated : by ${createdBy} at ${time} with data ${JSON.stringify(
          update_candidate.result
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: update_candidate.result,
        msg: "Candidate successfully updated",
        statusCode: 201
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Candidate update failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});

/**
 * @desc Candidate delete
 * @route POST /api/v2/candidate/delete
 * @access PUBLIC
 */
exports.remove = asyncHandler(async (req, res, next) => {
  try {
    let deletedBy = req.user.id;
    let { ids } = req.body;
    let model = "Candidate";
    const ObjectId = require("mongoose").Types.ObjectId;
    ids.map(async (d) => {
      if (await utils.isValidObjectId(d)) new ObjectId(d)
    });
    let del = await helper.backupAndDelete({
      ids,
      deletedBy,
      model,
    });
    if (del.deletedCount >= 1) {
      await logger.filecheck(
        `INFO: Candidate deleted: by ${deletedBy} at ${time} with data ${JSON.stringify(
          del
        )} \n`
      );
      return utils.send_json_response({
        res,
        data: del,
        msg: `Candidate successfully deleted`,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Candidate delete failed`,
        errorCode: "E501",
        statusCode: 200,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Candidate delete failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 200,
    });
  }
});

/**
 * @desc Candidate
 * @route POST /api/v2/candidate/single
 * @access PUBLIC
 */
exports.getCandidate = asyncHandler(async (req, res, next) => {
  let subject = "Candidate";
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
    let obj = await helper.CandidateHelper.getCandidate(where);
    if(!_.isEmpty(obj)) {
      let r = await helper.imageUrl({
        id,
        type: "candidate",
        req,
      });
      obj.photoUrl = r.result.href || null;
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

/**
 * @desc Candidate mass upload
 * @route POST /api/v2/candidate/importCandidate
 * @access PUBLIC
 */
exports.importCandidate = asyncHandler(async (req, res, next) => {
  let email_log_data;
  try {
    let createdBy = req.user.id || null;
    let { candidateTypeId, institutionId } = req.body;
    if (!institutionId)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution must be provided to proceed`,
        errorCode: "E404",
        statusCode: 406,
      });
    const validationSchema = Joi.object({
      institutionId: Joi.string().required(),
      candidateTypeId: Joi.string().required(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution Candidate create failed with validation error ${error.details[0].message}`,
        errorCode: "E502",
        statusCode: 406,
      });
    const ObjectId = require("mongoose").Types.ObjectId;
    if(!await utils.isValidObjectId(institutionId))
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Institution ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406
      });
    if(!await utils.isValidObjectId(candidateTypeId))
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Candidate type ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406
      });
    let institution = await helper.InstitutionHelper.getInstitution({ _id: new ObjectId(institutionId) });
    if (_.isEmpty(institution))
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution does not exist`,
        errorCode: "E404",
        statusCode: 406,
      });
    institution = institution[0];
    institutionId = institution._id;
    /**
     * assemble user params for create
     */
    const filePath = path.normalize(req.file.path);
    const excel_data = await utils.excelToJson(filePath);
    let pw = generator.generate({
      length: 10,
      numbers: true,
      uppercase: true,
      lowercase: true,
      symbols: false,
    });
    let pw_hashed = await utils.hashPassword(pw);
    let candidate_data = [];
    let codes = [];

    //generate candidate codes
    for (let i = 0; i <= excel_data.length - 1; i++) {
      let code = await helper.CandidateHelper.generateCode();
      codes.push(code);
    }
    let emailData = [];
    await excel_data.forEach((element) => {
      let email = element.email
      let phone = element.phone
      let code = codes.pop();
      candidate_data.push({
        title: element.title,
        firstName: element.firstName,
        lastName: element.lastName,
        middleName: element.middleName,
        candidateCode: code,
        email,
        phone,
        candidateTypeId: candidateTypeId,
        institutionId: institutionId,
        gender: element.gender,
        password: pw_hashed,
        createdBy
      });
      /**
       * build multiple email params
       */
      let p;
      let emailPhone = email + " or " + phone;
      let emailParams = {
        heading: "Your Candidate account created successfully",
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
        subject: "Candidate Created ",
      };
      emailData.push(p);
    });
    const upload_candidates = await helper.CandidateHelper.uploadCandidates(
      candidate_data
    );
    if (upload_candidates) {
      await logger.filecheck(
        `INFO: Institution Candidate created for institution ${institutionId}: by ${createdBy} at ${time} with data ${JSON.stringify(
          upload_candidates
        )} \n`
      );
      /**
       * begin mass sending using external service
       */
      /*for (const obj of emailData) {
        let success = 0;
        const send_email = await utils.send_email_api(obj);
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
      }*/

      return utils.send_json_response({
        res,
        data: upload_candidates,
        msg: "Institution Candidates successfully Uploaded",
        statusCode: 201
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institution Candidates not Uploaded`,
        errorCode: "E501",
        statusCode: 500,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Institution Candidate Upload failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});

/**
 * @desc Upload Candidate Documents
 * @route POST /api/v2/candidate/uploadDocument
 * @access PUBLIC
 */
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  try {
    let createdBy = req.user.id || null;
    const validationSchema = Joi.object({
      candidateId: Joi.string(),
      institutionId: Joi.string(),
      applicationId: Joi.string(),
    });
    const { error } = validationSchema.validate(req.body);
    if (error)
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Candidate upload failed with validation error ${error.details[0].message}`,
        errorCode: "E501",
        statusCode: 406,
      });
    /**
     * assemble candidate params for update
     */
    let {
      candidateId,
      institutionId,
      applicationId,
    } = req.body;
    if(!await utils.isValidObjectId(institutionId))
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Institution ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406
      });
    if(!await utils.isValidObjectId(candidateId))
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Candidate ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406
      });
    if(!await utils.isValidObjectId(applicationId))
      return utils.send_json_error_response({
        res,
        data: [],
        msg:  "Application ID provided is invalid",
        errorCode: "MEN17",
        statusCode: 406
      });
    const ObjectId = require("mongoose").Types.ObjectId;
    const record = await helper.CandidateHelper.getCandidate({ _id: new ObjectId(candidateId) });
    if (!record) {
      return utils.send_json_error_response({
        res,
        data: {},
        msg: "Record not found",
        errorCode: "E401",
        statusCode: 404
      });
    }
    if(_.isEmpty(req.files)){
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Candidate documents not uploaded or empty`,
        errorCode: "E501",
        statusCode: 501,
      });
    }
    let f = []
    _.forEach(req.files, (u) => {
      f.push(u.filename)
    })
    let candidate_data = {
      candidateId,
      institutionId,
      applicationId,
      documents: f,
      createdBy
    };
    let result = await helper.CandidateHelper.uploadCandidateDocuments({
      filter: {
        institutionId: new ObjectId(institutionId),
        applicationId: new ObjectId(applicationId),
        candidateId: new ObjectId(candidateId),
      },
      create: candidate_data,
      update: { $addToSet: { documents: f } },
      options: { upsert: true, new: true },
    });
    if(result){
      await logger.filecheck(
          `INFO: Candidate documents uploaded : by ${createdBy} at ${time} with data ${JSON.stringify(
              result
          )} \n`
      );
      return utils.send_json_response({
        res,
        data: result,
        msg: "Candidate documents successfully uploaded",
        statusCode: 201
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Candidate documents not created`,
        errorCode: "E501",
        statusCode: 501,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Candidate documents failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});

/**
 * @desc list Candidate documents
 * @route GET /api/v2/candidate/listDocument
 * @access Institution User
 */
exports.listDocument = asyncHandler(async (req, res, next) => {
  try {
    //let createdBy = req.user.id;
    if (_.isEmpty(req.query)) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Provide query params like sort, page and per_page!`,
        errorCode: "E501",
        statusCode: 200,
      });
    }
    const ObjectId = require("mongoose").Types.ObjectId;
    let where = {};
    if (!_.isEmpty(req.body.institutionId) && req.body.institutionId && await utils.isValidObjectId(req.body.institutionId)) {
      where.institutionId = new ObjectId(req.body.institutionId);
    }
    if (!_.isEmpty(req.body.candidateId) && req.body.candidateId && await utils.isValidObjectId(req.body.candidateId)) {
      where.candidateId = new ObjectId(req.body.candidateId);
    }
    if (!_.isEmpty(req.body.applicationId) && req.body.applicationId && await utils.isValidObjectId(req.body.applicationId)) {
      where.applicationId = new ObjectId(req.body.applicationId);
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
        errorCode: "E501",
        statusCode: 406,
      });
    }
    /**
     * fetch paginated data using queryOptions
     */
    const objWithoutMeta = await helper.CandidateHelper.getCandidateDocuments({
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
          `INFO: Candidates documents list by:, at ${time} with data ${JSON.stringify(
              obj
          )} \n`
      );
      return utils.send_json_response({
        res,
        data: obj,
        msg: "Candidate documents list successfully fetched",
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `No record!`,
        errorCode: "E404",
        statusCode: 404,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Candidate documents list failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 500,
    });
  }
});

/**
 * @desc Candidate removeDocument
 * @route POST /api/v2/candidate/removeDocument
 * @access PUBLIC
 */
exports.removeDocument = asyncHandler(async (req, res, next) => {
  try {
    let deletedBy = req.user.id;
    let { ids } = req.body;
    let model = "CandidateDocument";
    const ObjectId = require("mongoose").Types.ObjectId;
    ids.map(async (d) => {
      if (await utils.isValidObjectId(d)) new ObjectId(d)
    });
    let del = await helper.backupAndDelete({
      ids,
      deletedBy,
      model,
    });
    if (del.deletedCount >= 1) {
      await logger.filecheck(
          `INFO: Candidate document deleted: by ${deletedBy} at ${time} with data ${JSON.stringify(
              del
          )} \n`
      );
      return utils.send_json_response({
        res,
        data: del,
        msg: `Candidate document successfully deleted`,
      });
    } else {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Candidate document delete failed`,
        errorCode: "E501",
        statusCode: 200,
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Candidate document delete failed with error ${error.message}`,
      errorCode: error.errorCode,
      statusCode: 200,
    });
  }
});
