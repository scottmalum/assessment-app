const jwt = require("jsonwebtoken");
const axios = require("axios");
const fs = require("fs");
const AWS = require("aws-sdk");
const _ = require("lodash");
const logger = require("./logger");
const bcrypt = require("bcryptjs");
require("dotenv").config();
/* const strings = require("locutus/php/strings");
const generator = require('generate-password'); */
const moment = require("moment");
const { url } = require("inspector");
const XLSX = require("xlsx");
const { process_params } = require("express/lib/router");
const time = new Date(Date.now()).toLocaleString();

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

function toMysqlFormat(d) {
  return new Date(d).toMysqlFormat();
}

function getDateElems(d) {
  return new Date(d).getDateElems();
}

function getDateElemsUnpadded(d) {
  return new Date(d).getDateElemsUnpadded();
}

function getDateElemsText(d) {
  return new Date(d).getDateElemsText();
}

function convertDateToLocale(d) {
  return new Date(d).toLocaleString();
}

function currDayMonthYear() {
  let check = moment(new Date(Date.now()), "DD/MM/YYYY");
  let month = check.format("M");
  let day = check.format("D");
  let year = check.format("YYYY");
  return { day: day, month: month, year: year };
}

function shuffleArray(arr) {
  let currentIndex = arr.length,
    randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [
      arr[randomIndex],
      arr[currentIndex],
    ];
  }
  return arr;
}

function arrayShuffler(arr, times = 10) {
  for (let step = 0; step < times; step++) {
    arr = shuffleArray(arr);
  }
  return arr;
}

function buildQueryOptionSort(sort) {
  let sorted = {};
  if (sort.includes("|")) {
    let arr = sort.split("|");
    let direction =
      _.isEmpty(arr[1]) || (arr[1] != "desc" && arr[1] != "asc")
        ? "desc"
        : arr[1];
    sorted[arr[0]] = direction;
  }
  return sorted;
}

function comparePassword(provided, existing) {
  return bcrypt.compareSync(provided, existing);
}

Date.prototype.toMysqlFormat = function () {
  return (
    this.getUTCFullYear() +
    "-" +
    twoDigits(1 + this.getUTCMonth()) +
    "-" +
    twoDigits(this.getUTCDate()) +
    " " +
    twoDigits(this.getUTCHours()) +
    ":" +
    twoDigits(this.getUTCMinutes()) +
    ":" +
    twoDigits(this.getUTCSeconds())
  );
};

Date.prototype.getDateElems = function () {
  let mm = this.getMonth() + 1;
  let dd = this.getDate();
  mm = (mm > 9 ? "" : "0") + mm;
  dd = (dd > 9 ? "" : "0") + dd;
  yyyy = this.getFullYear();
  return { day: dd, month: mm, year: yyyy };
};

Date.prototype.getDateElemsUnpadded = function () {
  let mm = this.getMonth() + 1;
  let dd = this.getDate();
  yyyy = this.getFullYear();
  return { day: dd, month: mm, year: yyyy };
};

Date.prototype.getDateElemsText = function () {
  const monthName = new Date().toLocaleString("default", { month: "long" });
  let dd = this.getDate();
  dd = (dd > 9 ? "" : "0") + dd;
  yyyy = this.getFullYear();
  return { day: dd, month: monthName, year: yyyy };
};

module.exports = {
  getMonthText: async (d) => {
    let months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[d];
  },

  excelToJson: async (fileName) => {
    const file = XLSX.readFile(fileName);
    let data = [];
    const sheets = file.SheetNames;
    for (let i = 0; i < sheets.length; i++) {
      const temp = XLSX.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
      temp.forEach((item) => data.push(item));
    }
    return data;
  },

  buildMenu: (main, arr) => {
    let mainMenu1 = [];
    let mainMenu2 = [];
    let subMenu1 = [];
    let subMenu2 = [];
    let subSubMenu = [];
    let subSubMenu2 = [];
    let builtSubMenu = [];
    let builtMainMenu = [];
    let builtMenuHeader = [];
    const finder = (arr, path) => {
      for (const obj of arr) {
        if (obj.path === path) return obj;
      }
    };
    // pass main to it, returns the main menu from this whose path is given
    const findMainHeader = (arr, path) => {
      for (const obj of arr) {
        const main = finder(obj.menuObject, path);
        if (main) {
          if (main.hasOwnProperty("path") && main.path === path)
            return obj.menuHeaderId.name || false;
        }
      }
      return false;
    };
    // pass main to it, returns the main menu from this whose path is given
    const findMain = (arr, path) => {
      for (const obj of arr) {
        const main = finder(obj.menuObject, path);
        if (main) return main;
      }
      return false;
    };
    // pass main to it, returns the sub menu from this whose path is given
    const findSub = (arr, path) => {
      let mainPath = path.split(".").slice(0, 1).join(".");
      for (const obj of arr) {
        const main = finder(obj.menuObject, mainPath);
        if (main) return finder(main.children, path);
      }
      return false;
    };
    // pass main to it, returns the sub-sub menu from this whose path is given
    const findSubSub = (arr, path) => {
      let mainPath = path.split(".").slice(0, 1).join(".");
      let subPath = path.split(".").slice(0, 2).join(".");
      for (const obj of arr) {
        const main = finder(obj.menuObject, mainPath);
        if (main) {
          let sub = finder(main.children, subPath);
          if (sub) return finder(sub.children, path);
        }
      }
      return false;
    };
    _.forEach(arr.menuData, (u) => {
      u = u.toString();
      let match = (u.match(new RegExp(/\./, "g")) || []).length;
      if (match === 0) {
        let result1 = findMain(main, u);
        mainMenu1.push(u);
        mainMenu2.push(result1);
      }
      if (match === 1) {
        let result2 = findSub(main, u);
        subMenu1.push(u);
        subMenu2.push(result2);
      }
      if (match === 2) {
        let result3 = findSubSub(main, u);
        subSubMenu.push(u);
        subSubMenu2.push(result3);
      }
    });
    _.forEach(subSubMenu, (u) => {
      let subMenuId = u.split(".").slice(0, 2).join(".");
      let ss = finder(subSubMenu2, u);
      let s = finder(builtSubMenu, subMenuId);
      if (s) {
        s.children.push(ss);
      } else {
        if (subMenu1.indexOf(subMenuId) > -1) {
          let s1 = finder(subMenu2, subMenuId);
          s1.children = [];
          s1.children.push(ss);
          builtSubMenu.push({ ...s1 });
          subMenu2 = _.reject(subMenu2, function (el) {
            return el.path === subMenuId;
          });
        }
      }
    });
    if (subMenu2.length > 0) {
      _.forEach(subMenu2, (u) => {
        builtSubMenu.push(u);
      });
    }
    _.forEach(builtSubMenu, (u) => {
      let subMenuId = u.path;
      let mainMenuId = u.path.split(".").slice(0, 1).join(".");
      let m = finder(builtMainMenu, mainMenuId);
      let s = finder(builtSubMenu, subMenuId);
      if (m) {
        m.children.push(s);
      } else {
        if (mainMenu1.indexOf(mainMenuId) > -1) {
          let m1 = finder(mainMenu2, mainMenuId);
          m1.children = [];
          m1.children.push(s);
          builtMainMenu.push({ ...m1 });
          mainMenu2 = _.reject(mainMenu2, function (el) {
            return el.path === mainMenuId;
          });
        }
      }
    });
    if (mainMenu2.length > 0) {
      _.forEach(mainMenu2, (u) => {
        builtMainMenu.push(u);
      });
    }

    _.forEach(builtMainMenu, (u) => {
      let path = u.path;
      let header = findMainHeader(main, path);
      let f = builtMenuHeader.find((x) => x.header === header);
      if (f) {
        f.children.push(u);
      } else {
        let s = { header, children: [u] };
        builtMenuHeader.push(s);
      }
    });
    return builtMenuHeader;
  },

  getMenuDataFromMain: async (main) => {
    let arr = [];
    for (let m of main) {
      _.forEach(m.menuObject, (u) => {
        arr.push(u.path.toString());
      });
    }
    let menuData = arr.join(",");
    return { menuData };
  },

  pascal_to_underscore: async (str) => {
    if (str.constructor === Array) {
      // if (!Array.isArray(str)) {
      const arr = [];
      _.forEach(str, (u) => {
        arr.push(
          u
            .replace(/(?:^|\.?)([A-Z])/g, function (x, y) {
              return "_" + y.toLowerCase();
            })
            .replace(/^_/, "")
        );
      });
      return arr;
    }
    return str
      .replace(/(?:^|\.?)([A-Z])/g, function (x, y) {
        return "_" + y.toLowerCase();
      })
      .replace(/^_/, "");
  },

  isValidObjectId: async (id) => {
    const ObjectId = require("mongoose").Types.ObjectId;
    if (ObjectId.isValid(id)) {
      if (String(new ObjectId(id)) === id) return true;
      return false;
    }
    return false;
  },

  parseNameToFirstLastMiddle: async (params) => {
    if (_.isEmpty(params.name)) return false;
    let name = params.name.replace(/^\s+|\s+$/g, "");
    let firstNamePad = params.firstNamePad;
    let middleNamePad = params.middleNamePad;
    let nameArr = name.split(" ");
    let lastName, firstName, middleName;
    if (nameArr.length > 3) {
      middleName = name.split(" ").slice(2).join(" ");
      firstName = nameArr[1];
      lastName = nameArr[0];
    } else if (nameArr.length === 3) {
      middleName = nameArr[2];
      firstName = nameArr[1];
      lastName = nameArr[0];
    } else if (nameArr.length === 2) {
      middleName = middleNamePad;
      firstName = nameArr[1];
      lastName = nameArr[0];
    } else if (nameArr.length === 1) {
      middleName = middleNamePad;
      firstName = firstNamePad;
      lastName = nameArr[0];
    }
    return { lastName, firstName, middleName };
  },

  getShufflingFrequency: () => {
    return 10;
  },

  getFileArray: async ({ path, append, prepend, replace }) => {
    let fileArray = [];
    fs.readdirSync(path).forEach(function (file) {
      fileArray.push(
        append +
          file.replace(replace.replace_from, replace.replace_with) +
          prepend
      );
    });
    return fileArray;
  },

  send_email_api: async (params) => {
    const data = JSON.stringify({
      to: params.to,
      sender_name: process.env.EMAIL_API_FROM,
      sender_email: process.env.EMAIL_API_NO_REPLY,
      vendor_code: process.env.EMAIL_API_VENDOR_CODE,
      encoded: false,
      is_html: true,
      subject: params.subject,
      msg: params.message,
    });
    const config = {
      method: "post",
      url: process.env.EMAIL_API_URL,
      headers: {
        apikey: process.env.EMAIL_API_KEY,
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: "PHPSESSID=okdbrvc94sn22cvltlcvv77777",
      },
      data: data,
    };
    try {
      const emailSend = await axios(config);
      //console.log(JSON.stringify(emailSend.data));
      return { request: config, response: emailSend.data };
    } catch (error) {
      console.log(error);
    }
  },

  send_sms_api: async (params) => {
    let enc = params.encoded ? params.encoded : false;
    let from = params.from ? params.from : process.env.SMS_API_FROM;
    const data = JSON.stringify({
      vendor_code: process.env.SMS_API_VENDOR_CODE,
      encoded: enc,
      to: params.to,
      from: from,
      msg: params.message,
    });
    const config = {
      method: "post",
      url: process.env.SMS_API_URL,
      headers: {
        apikey: process.env.SMS_API_KEY,
        "Content-Type": "application/json",
      },
      data: data,
    };
    try {
      const smsSend = await axios(config);
      //console.log(JSON.stringify(smsSend.data));
      return { request: config, response: smsSend.data };
    } catch (error) {
      console.log(error);
    }
  },

  sameMonthYear: async (date1, date2) => {
    date1 = new Date(toMysqlFormat(date1)).getDateElems();
    date2 = new Date(toMysqlFormat(date2)).getDateElems();
    let date1_month = date1.month;
    // let date1_day = date1.day;
    let date1_year = date1.year;
    let date2_month = date2.month;
    // let date2_day = date2.day;
    let date2_year = date2.year;
    return date1_month === date2_month && date1_year === date2_year;
  },

  pickFromShuffledArray: async (arr, freq = 10, get = 2) => {
    let container = [];
    for (let step = 0; step < get; step++) {
      arr = arrayShuffler(arr, freq);
      let popped = arr.pop();
      if (popped) container.push(popped);
    }
    return container;
  },

  buildQueryOptionSort: async (sort) => {
    return buildQueryOptionSort(sort);
  },

  buildQueryOptions: async (query) => {
    let { sort, page, per_page } = query;
    sort = buildQueryOptionSort(sort);
    page = page ? parseInt(page) : 1;
    per_page = per_page ? parseInt(per_page) : 10;
    if (per_page > 100) per_page = 100;
    const customLabels = {
      totalDocs: "total",
      docs: "data",
      limit: "per_page",
      page: "current_page",
      totalPages: "last_page",
      nextPage: "next",
      prevPage: "prev",
      hasPrevPage: "hasPrev",
      hasNextPage: "hasNext",
      pagingCounter: "pageCounter",
    };
    const getPagination = (page, per_page) => {
      const limit = per_page ? per_page : 10;
      const offset = page ? (page - 1) * limit : 0;
      return { limit, page, offset };
    };
    let queryOptions = getPagination(page, per_page);
    queryOptions = !_.isEmpty(sort)
      ? { ...queryOptions, customLabels, lean: true, sort }
      : { ...queryOptions, customLabels, lean: true };
    return queryOptions;
  },

  buildResponseMeta: async (params) => {
    let { url, obj } = params;
    let u_next = new URL(url);
    let u_prev = new URL(url);
    let sort = u_next.searchParams.get("sort");
    // build next page
    u_next.searchParams.set("page", obj.next ? obj.next : "");
    u_next.searchParams.set("sort", sort);
    u_next.searchParams.set("per_page", obj.per_page);
    // build prev page
    u_prev.searchParams.set("page", obj.prev ? obj.prev : "");
    u_prev.searchParams.set("sort", sort);
    u_prev.searchParams.set("per_page", obj.per_page);
    // build meta
    let _obj = {};
    _obj.data = obj.data;
    let meta = {
      total: obj.total,
      last_page: obj.last_page,
      per_page: obj.per_page,
      current_page: obj.current_page,
      next_page_url: u_next.href,
      prev_page_url: u_prev.href,
      from: 1,
      to: obj.per_page,
    };
    _obj.meta = meta;
    let ret = { ..._obj, ...meta };
    return _obj;
  },

  toMysqlFormat: async (d) => {
    return toMysqlFormat(d);
  },

  makeTokenDate: async () => {
    let dur = process.env.TOKEN_EXPIRE_MINUTES;
    return moment(new Date()).add(parseInt(dur), "minutes").toDate();
  },

  getDateElems: async (d) => {
    return getDateElems(d);
  },

  getDateElemsUnpadded: async (d) => {
    return getDateElemsUnpadded(d);
  },

  getDateElemsText: async (d) => {
    return getDateElemsText(d);
  },

  getDateFromMonthYear: async (y, m) => {
    let date = new Date(`${y}-${m}-10`);
    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return moment(lastDay).clone().endOf("month").format("YYYY-MM-DD hh:mm");
  },

  getFirstLastDateOfMonth: async (d) => {
    let date = new Date(d);
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startOfMonth = moment(firstDay)
      .clone()
      .startOf("month")
      .format("YYYY-MM-DD hh:mm");
    const endOfMonth = moment(lastDay)
      .clone()
      .endOf("month")
      .format("YYYY-MM-DD hh:mm");
    return {
      first: startOfMonth,
      last: endOfMonth,
    };
  },

  convertDateToLocale: async (d) => {
    return convertDateToLocale(d);
  },

  hashPassword: async (d) => {
    let SALT_WORK_FACTOR = 10;
    return bcrypt.hashSync(d, SALT_WORK_FACTOR);
  },

  comparePassword: async (plain, hashed) => {
    return comparePassword(plain, hashed);
  },

  passwordPolicyPassed: async (d) => {
    let strongRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
    );
    return strongRegex.test(d);
  },

  passwordResetMatches: async (passwordResets, password) => {
    if (
      _.isEmpty(passwordResets) ||
      (!_.isEmpty(passwordResets) && _.isEmpty(passwordResets[0]))
    )
      return false;
    let cond = 0;
    _.forEach(passwordResets, function (value) {
      if (comparePassword(password, value)) {
        cond++;
      }
    });
    return cond > 0;
  },

  twoDigits: async (d) => {
    return twoDigits(d);
  },

  currDayMonthYear: async () => {
    return currDayMonthYear();
  },

  idToken: (length) => {
    //edit the token allowed characters
    let a = "1234567890".split("");
    let b = [];
    for (let i = 0; i < length; i++) {
      let j = (Math.random() * (a.length - 1)).toFixed(0);
      b[i] = a[j];
    }
    return b.join("");
  },

  jobQueue: async (params) => {
    try {
      console.log("Publishing ...");
      let msg = {};
      let conn = await amqplib.connect(amqp_url, "heartbeat=60");
      let ch = await conn.createChannel();
      let exch = params.exchange;
      let q = params.queue;
      let rkey = params.rkey;
      if (params.msg) msg = params.msg;
      await ch
        .assertExchange(exch, "direct", { durable: true })
        .catch(console.error);
      await ch.assertQueue(q, { durable: true });
      await ch.bindQueue(q, exch, rkey);
      await ch.publish(exch, rkey, Buffer.from(msg));
      setTimeout(function () {
        ch.close();
        conn.close();
      }, 500);
      let res = {
        data: msg,
        message: _.isEmpty(msg)
          ? "No task to queue yet"
          : "Task queued successfully",
      };
      console.log(res);
      return res;
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  jobExec: async (params) => {
    try {
      let msg = {};
      let conn = await amqplib.connect(amqp_url, "heartbeat=60");
      let ch = await conn.createChannel();
      let q = params.queue;
      await ch.assertQueue(q, { durable: true });
      await ch.consume(
        q,
        function (obj) {
          console.log("Executing ...");
          if (obj) msg = JSON.parse(obj.content.toString());
          let res = {
            data: msg,
            message: _.isEmpty(msg)
              ? "No task to execute yet"
              : "Task executed successfully",
          };
          const { doRRSJob } = require("../controllers/ussd");
          let doJob = doRRSJob(msg);
          ch.ack(obj);
          if (doJob == 1) {
            console.log("acknowledged");
          } else {
            console.log("Error: ", doJob);
          }
        },
        { consumerTag: "rrs" }
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  send_response: async (res, msg) => {
    return res.status(200).set("Content-Type", "text/plain").send(msg);
  },

  send_json_response: async ({ res, data, msg, statusCode = 200 }) => {
    return res.status(statusCode).json({
      status: "success",
      code: "00",
      data: data || [],
      message: msg || "Successful",
    });
  },

  send_json_error_response: async ({
    res,
    data,
    msg,
    errorCode,
    statusCode = 400,
  }) => {
    await logger.filecheck(
      `ERROR; time: ${time}; message: ${msg}; errorCode: ${errorCode} } \n`
    );
    return res.status(statusCode).json({
      status: "error",
      code: errorCode || "E01",
      data: data || [],
      message: msg || "Error occurred",
    });
  },

  sendTokenResponse: (obj, statusCode, res, message = "Action successful") => {
    const token = jwt.sign({ id: obj.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
    res.status(statusCode).json({
      status: "success",
      code: "00",
      data: obj,
      message: message,
      token,
    });
  },

  sendNoTokenResponse: (user, statusCode, res, message, status) => {
    res.status(statusCode).json({
      status,
      code: "00",
      data: { user: user },
      message: message,
    });
  },

  sendTokenResponseRoutes: (user, routes, statusCode, res) => {
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
    res
      .status(statusCode)
      .json({ status: "success", code: "s200", user, routes, token });
  },

  uploadFile: async (fileName) => {
    const file = fileName.name;

    // Read content from the file
    const fileContent = fs.readFileSync(fileName);

    AWS.config.update({
      accessKeyId: ID,
      secretAccessKey: SECRET,
      region: "EU (Ireland) eu-west-1",
    });

    // Setting up S3 upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: file, // File name you want to save as in S3
      Body: fileContent,
    };

    // Uploading files to the bucket
    try {
      let uploadPromise = await new AWS.S3().putObject(params).promise();
      console.log("Successfully uploaded data to bucket");
    } catch (e) {
      console.log("Error uploading data: ", e);
    }
  },

  sendDataToken: (data, statusCode, message, code, res) => {
    const dataToken = jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(statusCode).json({
      status: "success",
      code,
      message,
      dataToken,
    });
  },

  hasDuplicates: (array) => {
    return new Set(array).size !== array.length;
  },

  genData: (length) => {
    let a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    let b = [];
    for (let i = 0; i < length; i++) {
      let j = (Math.random() * (a.length - 1)).toFixed(0);
      b[i] = a[j];
    }
    return b.join("");
  },

  getPagination: (page, size) => {
    const limit = size ? +size : 3;
    const offset = page ? page * limit : 0;
    return { limit, offset };
  },

  getPagingData: (data, page, limit) => {
    const { count: totalItems, rows } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);
    return { totalItems, rows, totalPages, currentPage };
  },
};
