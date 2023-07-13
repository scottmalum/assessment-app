
const logger = require("./logger");
const time = new Date(Date.now()).toLocaleString();

class ErrorResponse extends Error {
  constructor(
    message,
    statusCode,
    errorCode
  ) {
    super(message || "internal server error");
    this.statusCode = statusCode || 200;
    this.errorCode = errorCode || 'E01';
    logger.filecheck(
        `ERROR; time: ${time}; message: ${this.message}; statusCode: ${this.statusCode}; errorCode: ${this.errorCode} } \n`
    );
  }
}

module.exports = ErrorResponse;
