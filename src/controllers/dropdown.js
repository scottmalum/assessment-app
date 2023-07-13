const asyncHandler = require("../middleware/async");
const utils = require("../utils");
const helper = require("../utils/model_helpers");

exports.institutions = asyncHandler(async (req, res, next) => {
  try {
    const institutions = await helper.DropDownHelper.getInstitution();
    if (!institutions) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Institutions not found`,
        errorCode: "DRP01",
        statusCode: 404,
      });
    } else {
      return utils.send_json_response({
        res,
        data: institutions,
        msg: `Institutions successfully fetched`,
        statusCode: 200
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Institution fetch failed with error ${error.message}`,
      errorCode: "DRP02",
      statusCode: 500,
    });
  }
});

exports.candidateTypes = asyncHandler(async (req, res, next) => {
  try {
    const candidateType = await helper.DropDownHelper.getCandidateType();
    if (!candidateType) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `CandidateType not found`,
        errorCode: "DRP03",
        statusCode: 404,
      });
    } else {
      return utils.send_json_response({
        res,
        data: candidateType,
        msg: `CandidateType successfully fetched`,
        statusCode: 200
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `CandidateType fetch failed with error ${error.message}`,
      errorCode: "DRP04",
      statusCode: 500,
    });
  }
});

exports.modules = asyncHandler(async (req, res, next) => {
  try {
    const module = await helper.DropDownHelper.getModules();
    if (!module) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Modules not found`,
        errorCode: "DRP05",
        statusCode: 404,
      });
    } else {
      return utils.send_json_response({
        res,
        data: module,
        msg: `Module successfully fetched`,
        statusCode: 200
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Module fetch failed with error ${error.message}`,
      errorCode: "DRP06",
      statusCode: 500,
    });
  }
});

exports.qualifications = asyncHandler(async (req, res, next) => {
  try {
    const qualifications = await helper.DropDownHelper.getQualifications();
    if (!qualifications) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `qualifications not found`,
        errorCode: "DRP07",
        statusCode: 404,
      });
    } else {
      return utils.send_json_response({
        res,
        data: qualifications,
        msg: `qualifications successfully fetched`,
        statusCode: 200
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `qualifications fetch failed with error ${error.message}`,
      errorCode: "DRP08",
      statusCode: 500,
    });
  }
});

exports.grades = asyncHandler(async (req, res, next) => {
  try {
    const grades = await helper.DropDownHelper.getGrades();
    if (!grades) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Grades not found`,
        errorCode: "DRP09",
        statusCode: 404,
      });
    } else {
      return utils.send_json_response({
        res,
        data: grades,
        msg: `Grades successfully fetched`,
        statusCode: 200
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Grades fetch failed with error ${error.message}`,
      errorCode: "DRP10",
      statusCode: 500,
    });
  }
});

exports.business = asyncHandler(async (req, res, next) => {
  try {
    const businesses = await helper.DropDownHelper.getBusiness();
    if (!businesses) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `Business not found`,
        errorCode: "DRP11",
        statusCode: 404,
      });
    } else {
      return utils.send_json_response({
        res,
        data: businesses,
        msg: `Business successfully fetched`,
        statusCode: 200
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `Business fetch failed with error ${error.message}`,
      errorCode: "DRP12",
      statusCode: 500,
    });
  }
});

exports.questionTypes = asyncHandler(async (req, res, next) => {
  try {
    const questionTypes = await helper.DropDownHelper.getQuestionType();
    if (!questionTypes) {
      return utils.send_json_error_response({
        res,
        data: [],
        msg: `QuestionTypes not found`,
        errorCode: "DRP14",
        statusCode: 404,
      });
    } else {
      return utils.send_json_response({
        res,
        data: questionTypes,
        msg: `QuestionTypes successfully fetched`,
        statusCode: 200
      });
    }
  } catch (error) {
    return utils.send_json_error_response({
      res,
      data: [],
      msg: `QuestionTypes fetch failed with error ${error.message}`,
      errorCode: "DRP15",
      statusCode: 500,
    });
  }
});
