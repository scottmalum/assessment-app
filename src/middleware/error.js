
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.errorCode = err.errorCode;
  res.status(error.statusCode || 200).json({
    status: 'error',
    message: error.message,
    code: error.errorCode,
    data: {},
  });
};

module.exports = errorHandler;
