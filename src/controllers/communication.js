
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const { validate } = require("validate.js");
const axios = require("axios");
const utils = require("../utils");
const helper = require("../utils/model_helpers");
const _ = require("lodash");
const logger = require("../utils/logger");
let appRoot = require("app-root-path");
let emailTemplate = require(`${appRoot}/src/utils/emailTemplate`);
const time = new Date(Date.now()).toLocaleString();

/**
 * @desc communication module
 * @route POST /api/v2/communication/mail
 * @access PUBLIC
 */

exports.mail = asyncHandler(async (req, res, next) => {
  try {
    /**
     * initialize key variables
     */
    let currMonthYear = await utils.getDateElemsText(Date.now());
    currMonthYear = currMonthYear.month + ", " + currMonthYear.year;
    const currDayMonthYear = await utils.currDayMonthYear();

    /**
     * build contraints for validate.js
     */
    const constraints = {
      to: {
        presence: {
          allowEmpty: false,
          message: "Email address is required",
        },
        email: true,
      },
      message: {
        presence: {
          allowEmpty: false,
          message: "Body text is required",
        },
      },
      type: {
        presence: {
          allowEmpty: false,
          message: "Email type is required",
        },
      },
      subject: { 
        presence: {
          allowEmpty: false,
          message: "Email subject is required",
        },
      },
    };
    /**
     * destructure the request body and pick the needed params
     */
    let { to, message, subject, type } = req.body;
    console.log("*** user request body: ***");
    console.log(req.body);  

    /**
     * do validation, if it fails log and return response to user,else proceed and start processing
     */
    const validation = validate( 
      {
        to, message, subject, type
      },
      constraints
    );

    if (validation) {
      /**
       * validation fails
       */
      logger.filecheck(
        `ERROR(E11): Email sending validation failed , at ${time} with error ${
          Object.values(validation)[0]
        } \n`
      );
      return next(
        new ErrorResponse(`${Object.values(validation)[0]}`, 200, "E300")
      );
    }
    let success = 0;
    let template = "";
    if (!_.isEmpty(type) && type == "contact_support") {
      let category = req.body.category ? req.body.category : "{category not provided}";
      let from = req.body.from ? req.body.from : "{from not provided}";
      emailParams = {
        heading: `Support Email`,
        to: `${category} department`,
        from: `${from}`,
        previewText:
          "RRS is a revenue reward scheme designed to appreciate tax-payers and make revenue collection a bit fun!",
        message,
      };
      template = emailTemplate.contactSupport(emailParams);
    }
    
    p = {
      to,
      message: template,
      subject,
    };
    const send_email = await utils.send_email_api(p);
    if (send_email.response.Code == "02") {
      success = 1;
    }
    console.log(`*** email sent ***`);
    email_log_data = {
      email: to,
      requestData: send_email.request,
      responseData: send_email.response,
      emailLogStatus: success,
    };
    const create_email_log = await helper.EmailLogHelper.createEmailLog(
      email_log_data
    );
    console.log(`*** email log added ***`);

    return utils.send_json_response({
      res,
      data: send_email.response,
      msg: "Email successfully sent",
    });
  } catch (error) {
    return next(
      new ErrorResponse(
        `Email sending failed with error ${error.message}`,
        200,
        error.errorCode
      )
    );
  }
});

