const ErrorResponse = require("../utils/errorResponse");
require("dotenv").config();
const asyncHandler = require("../middleware/async");
const { validate } = require("validate.js");
const bcrypt = require("bcryptjs");
const utils = require("../utils");
const generator = require("generate-password");
const helper = require("../utils/model_helpers");
const _ = require("lodash");
const logger = require("../utils/logger");
let appRoot = require("app-root-path");
let emailTemplate = require(`${appRoot}/src/utils/emailTemplate`);
const time = new Date(Date.now()).toLocaleString();

/**
 * @desc Login
 * @route POST /api/v2/auth/login
 * @access PUBLIC
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { login, password, loginType } = req.body;
  if (!login || !password || !loginType) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Email/Phone, password, and Type is required `,
      errorCode: "AUTH01",
      statusCode: 400,
    });
  }
  let check_user;
  if (loginType === "sysAdmin") {
    check_user = await helper.UserHelper.getUser({
      $and: [
        { $or: [{ email: login }, { phone: login }] },
        { isSystemAdmin: 1 },
      ],
    });
  } else if (loginType === "institution") {
    check_user = await helper.UserHelper.getUser({
      $and: [
        { $or: [{ email: login }, { phone: login }] },
        { isInstitutionAdmin: 1 },
      ],
    });
  } else if (loginType === "lms") {
    check_user = await helper.UserHelper.getUser({
      $and: [{ $or: [{ email: login }, { phone: login }] }, { isLmsAdmin: 1 }],
    });
  } else if (loginType === "staff") {
    check_user = await helper.UserHelper.getUser({
      $and: [
        { $or: [{ email: login }, { phone: login }] },
        { isInstitutionAdmin: 0, isSystemAdmin: 0, isLmsAdmin: 0 },
      ],
    });
  } else if (loginType === "candidate") {
    check_user = await helper.CandidateHelper.getCandidate({
      $or: [{ email: login }, { phone: login }],
    });
    if (!_.isEmpty(check_user)) {
      let r = await helper.imageUrl({
        id: check_user._id,
        type: "candidate",
        req,
      });
      check_user.photoUrl = r.result.href || null;
    }
  } else {
    check_user = null;
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `loginType: ${loginType} provided is invalid`,
      errorCode: "AUTH02",
      statusCode: 404,
    });
  }
  if (!check_user) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Email or password is incorrect, ${loginType} record not found`,
      errorCode: "AUTH02",
      statusCode: 404,
    });
  }
  const isMatch = await utils.comparePassword(password, check_user.password);
  if (!isMatch) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Email or password is incorrect, ${loginType} not found`,
      errorCode: "AUTH03",
      statusCode: 404,
    });
  }
  if (check_user.firstLogin === 1) {
    return utils.sendNoTokenResponse(
      check_user,
      200,
      res,
      "First time login, kindly change your password",
      "default-password"
    );
  }
  if (check_user.isSystemAdmin === 1) {
  }
  if (check_user.isInstitutionAdmin === 1) {
  }
  if (check_user.isLmsAdmin === 1) {
  }
  return utils.sendTokenResponse(
    { user: check_user },
    200,
    res,
    `${loginType} login successful`
  );
});

/**
 * @desc forgotPassword module
 * @route POST /api/v2/auth/forgotPassword
 * @access PUBLIC
 */

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  let sms_log_data;
  let phone;
  try {
    /**
     * build constraints for validate.js
     */
    const constraints = {
      login: {
        presence: {
          allowEmpty: false,
          message: "Email address is required",
        },
        email: false,
      },
    };
    /**
     * destructure the request body and pick the needed params
     */
    const { login, reset_url } = req.body;
    if (!login) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Login param is required`,
        errorCode: "AUTH04",
        statusCode: 400,
      });
    }
    /**
     * do validation, if it fails log and return response to user,else proceed and start processing
     */
    const validation = validate(
      {
        login,
      },
      constraints
    );
    if (validation) {
      /**
       * validation fails
       */
      await logger.filecheck(
        `ERROR(E11): Forgot password failed , at ${time} with error ${
          Object.values(validation)[0]
        } \n`
      );
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${Object.values(validation)[0]}`,
        errorCode: "AUTH05",
        statusCode: 400,
      });
    }
    let isEmail,
      isPhone = false;
    let check_user = await helper.UserHelper.getUser({ email: login });
    if (check_user) {
      isEmail = true;
    } else {
      check_user = await helper.UserHelper.getUser({ phone: login });
      if (check_user) {
        isPhone = true;
      }
    }
    if (!check_user) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Email/Phone do not exist!`,
        errorCode: "AUTH07",
        statusCode: 404,
      });
    }
    /**
     * modify the reset link to generate a random token and tie it to the userID so that yoy don't send
     * same link
     */
    let sender;
    let user_id = check_user._id;
    let token = await helper.TokenHelper.createToken({
      data: { userId: user_id },
    });
    let url = reset_url + "?e0779Binary=" + token.token;
    let success = 0;
    /**
     * begin send sms
     */
    if (isPhone) {
      phone = login;
      console.log(`*** begin sms sending ***`);
      let to = phone;
      let message = `Password reset link: ${url}`;
      console.log(`*** sms data: ${message} ***`);
      sender = await utils.send_sms_api({
        to,
        message,
      });
      if (
        sender.response.StatusCode === "101" ||
        sender.response.StatusCode === "102" ||
        sender.response.StatusCode === "100" ||
        sender.response.Status === "Success"
      ) {
        success = 1;
      }
      sms_log_data = {
        phone,
        requestData: sender.request,
        responseData: sender.response,
        smsLogStatus: success,
      };
      const create_sms_log = await helper.SmsLogHelper.createSmsLog(
        sms_log_data
      );
      console.log(`*** smslog added ***`);
    }
    /**
     * begin send email
     */
    if (isEmail) {
      let email = login;
      console.log(`*** begin email sending ***`);
      let subject = "Password Reset";
      let emailParams = {
        heading: `Forgot Password`,
        previewText: "Tiwo Exam Portal is awesome!",
        message:
          "This exam portal is designed to help institutions conduct quiz.",
        url: url,
        url_text: reset_url,
      };
      let template = emailTemplate.forgotPassword(emailParams);
      let p = {
        to: email,
        message: template,
        subject,
      };
      sender = await utils.send_email_api(p);
      if (sender.response.Code === "02") {
        success = 1;
      }
      let email_log_data = {
        email,
        requestData: sender.request,
        responseData: sender.response,
        emailLogStatus: success,
      };
      const create_email_log = await helper.EmailLogHelper.createEmailLog(
        email_log_data
      );
      console.log(`*** emailLog created ***`);
    }
    return utils.send_json_response({
      res,
      data: sender.response,
      msg: "Forgot password link successfully sent",
      statusCode: 201,
    });
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Forgot password failed with error ${error.message}`,
      errorCode: "AUTH07",
      statusCode: 500,
    });
  }
});

/**
 * @desc resetPassword module
 * @route POST /api/v2/auth/resetPassword
 * @access PUBLIC
 */

exports.resetPassword = asyncHandler(async (req, res, next) => {
  try {
    /**
     * build constraints for validate.js
     */
    const constraints = {
      password: {
        presence: {
          allowEmpty: false,
          message: "is required",
        },
        length: {
          minimum: 8,
          maximum: 20,
          message: "must be between 8 and 20 characters",
        },
      },
    };
    /**
     * destructure the request body and pick the needed params
     */
    let { password, resetPasswordCode } = req.body;
    /**
     * do validation, if it fails log and return response to user,else proceed and start processing
     */
    const validation = validate(
      {
        password,
      },
      constraints
    );
    if (validation) {
      /**
       * validation fails
       */
      await logger.filecheck(
        `ERROR(E11): Reset password failed , at ${time} with error ${
          Object.values(validation)[0]
        } \n`
      );
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${Object.values(validation)[0]}`,
        errorCode: "AUTH08",
        statusCode: 400,
      });
    }
    if (!(await utils.passwordPolicyPassed(password))) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Password should contain a letter, number, upper, lower, special character and greater than 8!`,
        errorCode: "AUTH09",
        statusCode: 406,
      });
    }
    const ObjectId = require("mongoose").Types.ObjectId;
    let process_token = await helper.TokenHelper.processToken({
      token: resetPasswordCode,
      dataColumn: "userId",
    });
    if (_.isEmpty(process_token.result) || process_token.message !== "success")
      return utils.send_json_error_response({
        res,
        data: [],
        msg: process_token.message,
        errorCode: "AUTH10",
        statusCode: 406,
      });
    let userId = process_token.result.data.userId;
    if (!ObjectId.isValid(userId)) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `User account do not exist, invalid userID!`,
        errorCode: "AUTH10",
        statusCode: 404,
      });
    }
    let user_id = new ObjectId(userId);
    const check_user = await helper.UserHelper.getUser({
      _id: user_id,
    });

    if (!check_user) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `User account do not exist!`,
        errorCode: "AUTH11",
        statusCode: 404,
      });
    }
    let old_password = check_user.password;
    let passwordResets = check_user.passwordResets;
    if (await utils.passwordResetMatches(passwordResets, password)) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `This password is already used!`,
        errorCode: "AUTH12",
        statusCode: 406,
      });
    }
    password = await utils.hashPassword(password);
    const save_password_reset = await helper.UserHelper.savePasswordReset({
      user_id,
      old_password,
      new_password: password,
    });
    /**
     * begin email send
     */
    let email = check_user.email;
    let success = 0;
    let subject = "Password Reset";
    let emailParams = {
      heading: `Password Reset Successful`,
      previewText: "Exam portal is good!",
      message: "Your password is successfully reset, kindly login and proceed.",
    };
    let template = emailTemplate.resetPassword(emailParams);
    let p = {
      to: email,
      message: template,
      subject,
    };
    const send_email = await utils.send_email_api(p);
    if (send_email.response.Code === "02") {
      success = 1;
    }
    console.log(`*** email sent ***`);
    let email_log_data = {
      email,
      requestData: send_email.request,
      responseData: send_email.response,
      emailLogStatus: success,
    };
    const create_email_log = await helper.EmailLogHelper.createEmailLog(
      email_log_data
    );
    console.log(`*** email-log added ***`);
    await helper.TokenHelper.disableToken(resetPasswordCode);
    return utils.send_json_response({
      res,
      data: send_email.response,
      msg: "Password reset successful",
      statusCode: 201,
    });
  } catch (error) {
    console.log(error);
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Password reset failed with error ${error.message}`,
      errorCode: "AUTH13",
      statusCode: 500,
    });
  }
});

/**
 * @desc changePassword module
 * @route POST /api/v2/auth/changePassword
 * @access PUBLIC
 */

exports.changePassword = asyncHandler(async (req, res, next) => {
  try {
    /**
     * build constraints for validate.js
     */
    const constraints = {
      password: {
        presence: {
          allowEmpty: false,
          message: "is required",
        },
        length: {
          minimum: 8,
          maximum: 20,
          message: "must be between 8 and 20 characters",
        },
      },
    };
    /**
     * destructure the request body and pick the needed params
     */
    let { password, currentPassword, user_id } = req.body;
    /**
     * do validation, if it fails log and return response to user,else proceed and start processing
     */
    const validation = validate(
      {
        password,
      },
      constraints
    );
    if (validation) {
      /**
       * validation fails
       */
      await logger.filecheck(
        `ERROR(E11): Change password failed , at ${time} with error ${
          Object.values(validation)[0]
        } \n`
      );
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `${Object.values(validation)[0]}`,
        errorCode: "AUTH14",
        statusCode: 400,
      });
    }
    if (!(await utils.passwordPolicyPassed(password))) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Password should contain a letter, number, upper, lower, special character and greater than 8!`,
        errorCode: "AUTH15",
        statusCode: 406,
      });
    }
    const ObjectId = require("mongoose").Types.ObjectId;
    if (!ObjectId.isValid(user_id)) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `User do not exist, invalid userID`,
        errorCode: "AUTH16",
        statusCode: 404,
      });
    }
    user_id = new ObjectId(user_id);
    const check_user = await helper.UserHelper.getUser({
      _id: user_id,
    });
    if (!check_user) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `User account do not exist!`,
        errorCode: "AUTH17",
        statusCode: 404,
      });
    }
    let old_password = check_user.password;
    let passwordResets = check_user.passwordResets;

    if (!(await utils.comparePassword(currentPassword, old_password))) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Current password provided do not match!`,
        errorCode: "AUTH18",
        statusCode: 406,
      });
    }
    if (await utils.passwordResetMatches(passwordResets, password)) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `The new password provided is already used!`,
        errorCode: "AUTH19",
        statusCode: 406,
      });
    }
    password = await utils.hashPassword(password);
    const save_password_reset = await helper.UserHelper.savePasswordReset({
      user_id,
      old_password,
      new_password: password,
    });
    let email = check_user.email;
    let success = 0;
    let subject = "Change Password";
    let emailParams = {
      heading: `Change Password Successful`,
      previewText: "Exam portal is good!",
      message:
        "Your password is successfully changed, kindly login and proceed.",
    };
    let template = emailTemplate.changePassword(emailParams);
    let p = {
      to: email,
      message: template,
      subject,
    };
    const send_email = await utils.send_email_api(p);
    if (send_email.response.Code === "02") {
      success = 1;
    }
    console.log(`*** email sent ***`);
    let email_log_data = {
      email,
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
      data: send_email.response,
      msg: "Password change successful",
      statusCode: 201,
    });
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Password change failed with error ${error.message}`,
      errorCode: "AUTH20",
      statusCode: 500,
    });
  }
});
