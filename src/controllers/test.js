const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const fs = require("fs");
const path = require("path");
//const db = require("../models");
const bcrypt = require("bcryptjs");
const utils = require("../utils");
const _ = require("lodash");
const logger = require("../utils/logger");
const generator = require("generate-password");
/* const EnrollStates = require("../models/EnrollStates");
const AdminPermission = require("../models/AdminPermission"); */
let appRoot = require("app-root-path");
const helper = require("../utils/model_helpers");



/**
 * @desc Login Admin
 * @route POST /api/auth/login
 * @access PUBLIC
 */

exports.start = asyncHandler(async (req, res, next) => {
  let obj;
  /**
   * test utils.getFileArray returns array of files ending with extension if replace object children has empty values
   */
  /* 
  var normalizedPath = appRoot + '/src/models/';
  const fileArray = await utils.getFileArray({
    path: normalizedPath,
    append: normalizedPath,
    prepend: "",
    replace: { replace_from: "", replace_with: "" },
  });
  obj = fileArray;
  */

  /**
   * test utils.getFileArray returns array of file names with no extension if replace object children has strings to replace
  /* 
  const fileNameArray = await utils.getFileArray({
    path: normalizedPath,
    append: "",
    prepend: "",
    replace: { replace_from: ".js", replace_with: "s" },
  });
  obj = fileNameArray;
*/

  /**
   * test utils.pascal_to_underscore
   */
  /* 
  const obj = await utils.pascal_to_underscore('ArrayTo');
  assert that obj = 'array_to'
   */

  /**
   * test email send
   */
  /*   
let appRoot = require("app-root-path");
   let emailTemplate = require(`${appRoot}/src/utils/emailTemplate`);
  let params = {
    heading: "Your RRS account created & monthly RRS code successfully generated",
    email: "pcollinsmb@gmail.com",
    password: "password",
    message: "Revenue reward scheme (RRS) is a program designed to reward tax payers. At every month-end, a draw is made where the lucky tax-payers are provided with a reward.",
    rrsCode: "WYTWYTYTWEY65656"
  };
  const obj = await utils.send_email_api({
    to: params.email,
    message: emailTemplate.rrsCode(params),
    subject: "Revenue reward scheme",
  });
  */

  /**
   * test get current monthname and year
   */
  /* obj = await utils.getDateElemsText(Date.now()); 
 obj = obj.month + ", " + obj.year; */

  /**
   * test get current month and year
   */
  /* obj = await utils.getDateElems(Date.now()); 
 obj = obj.month + ", " + obj.year; */

  /**
   * test mongoose valid objectId
   */
  /* var mongoose = require("mongoose");
  let s = "microsoft123";
  var isValid = mongoose.Types.ObjectId("microsoft123") == s;
  let s = "551137c2f9e1fac808a5f572";
  var isValid = mongoose.Types.ObjectId("551137c2f9e1fac808a5f572") == s;
  console.log(isValid); */

  /**
   * test get first and last date of month
   */


   /*let arr = [
  {
    a: 1,
    b: 2,
  },
  {
    c: 3,
    d: 4,
  },
  {
    e: 5,
    f: 6,
  },
  {
    g: 7,
    h: 8,
  },
  {
    i: 9,
    j: 10,
  },
];
obj = await utils.pickFromShuffledArray(arr, 10, 2);*/

  /**
   * test menu
   * lsof -i tcp:3009
   * kill -9 <pid>
   */
  let name = "  "
  name = name.replace(/^\s+|\s+$/g, "");
  let nameArr = name.split(" ")
  let lastName, firstName, middleName;
  if(nameArr.length > 3){
    middleName = name.split(" ").slice(2).join(" ");
    firstName = nameArr[1]
    lastName = nameArr[0]
  }else if(nameArr.length === 3){
    middleName = nameArr[2]
    firstName = nameArr[1]
    lastName = nameArr[0]
  }else if(nameArr.length === 2){
    middleName = ""
    firstName = nameArr[1]
    lastName = nameArr[0]
  }else if(nameArr.length === 1){
    middleName = ""
    firstName = "Institution"
    lastName = nameArr[0]
  }

  obj = {lastName, firstName, middleName}
  return res.status(200).json(obj);
});
