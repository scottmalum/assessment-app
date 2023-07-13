const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const utils = require("../utils");
const ErrorResponse = require('../utils/errorResponse');
const logger = require("../utils/logger");
const time = new Date(Date.now()).toLocaleString();

// protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route"), 401);
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    let createdBy = req.user.id;
    const isValidId = await utils.isValidObjectId(createdBy);
    if (!isValidId) {
      return next(
        new ErrorResponse(
          (message = "UserId is invalid!"),
          (statusCode = 200),
          (errorCode = "E02")
        )
      );
    }
    next();
  } catch (error) {
    logger.filecheck(
      `ERROR: message= ${error.message}, statusCode= ${error.statusCode}, errorCode= ${error.errorCode} at ${time}  } \n`
    );
    if (error.name === "TokenExpiredError") {
      return next(
        new ErrorResponse(
          (message = "Token expired!"),
          (statusCode = 301),
          (errorCode = "E02")
        )
      );
    }
    return next(new ErrorResponse());
  }
});

exports.guardExternalRequests = asyncHandler(async (req, res, next) => {
  let apikey = req.headers.apikey;
  if (!apikey || apikey != process.env.EXTERNAL_API_KEY) {
    return next(new ErrorResponse("Not authorized to access this route"), 401);
  }
  try {
    next();
  } catch (error) {
    logger.filecheck(
      `ERROR: message= ${error.message}, statusCode= ${error.statusCode}, errorCode= ${error.errorCode} at ${time}  } \n`
    );
    return next(
      new ErrorResponse(
        (message = error.message),
        (statusCode = error.statusCode),
        (errorCode = error.errorCode)
      )
    );
  }
});
