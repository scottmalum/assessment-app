const fs = require("fs");
const _ = require("lodash");
const generator = require("generate-password");
const moment = require("moment");
const strings = require("locutus/php/strings");
const Application = require("../../models/Application");
const ApplicationStage = require("../../models/ApplicationStage");
const ApplicationUserPermission = require("../../models/ApplicationUserPermission");
const User = require("../../models/User");
const utils = require("../");
const { is_null } = require("locutus/php/var");
const ApplicationDocumentType = require("../../models/ApplicationDocumentType");
const InstitutionDocumentType = require("../../models/InstitutionDocumentType");
const time = new Date(Date.now()).toLocaleString();

module.exports = {
  /**
   * application
   * @param data
   * @returns {Promise<data>}
   */
  createApplication: async (data) => {
    return Application.create(data);
  },

  getApplications: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v = await Application.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "institutions",
          localField: "institutionId",
          foreignField: "_id",
          as: "application_institution",
        },
      },
      { $unwind: "$application_institution" },
      {
        $lookup: {
          from: "businesses",
          localField: "application_institution.businessId",
          foreignField: "_id",
          as: "institution_business",
        },
      },
      { $unwind: "$institution_business" },
      {
        $project: {
          __v: 0,
          status: 0,
          "application_institution.address": 0,
          "application_institution._id": 0,
          "institution_business.address": 0,
          "institution_business._id": 0,
        },
      },
    ]);
    console.log(v);
    return Application.aggregatePaginate(v, options, function (err, results) {
      if (err) {
        console.log(err);
      } else {
        return results;
      }
    });
  },

  getApplication: async (where) => {
    return Application.find(where).populate({ path: "institutionId" });
  },

  findOne: async (where) => {
    return Application.findOne(where);
  },

  findUpdate: async ({ filter: filter, update: update, options: options }) => {
    let res;
    let result;
    let check = await Application.findOne(filter);
    if (!check || is_null(check)) {
      return { result: false, message: "Application provided do not exist" };
    } else {
      res = await Application.findOneAndUpdate(filter, update, options);
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },

  /**
   * application stage
   */

  createApplicationStage: async (data) => {
    return ApplicationStage.create(data);
  },

  findUpdateStage: async ({
    filter: filter,
    update: update,
    options: options,
  }) => {
    let res;
    let result;
    let check = await ApplicationStage.findOne(filter);
    if (!check || is_null(check)) {
      return {
        result: false,
        message: "Application stage provided do not exist",
      };
    } else {
      res = await ApplicationStage.findOneAndUpdate(filter, update, options);
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },

  getApplicationStage: async (where) => {
    return ApplicationStage.find(where)
      .populate({ path: "institutionId" })
      .populate({ path: "applicationId" });
  },

  getApplicationStages: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v = ApplicationStage.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "stage_application",
        },
      },
      { $unwind: "$stage_application" },
      {
        $lookup: {
          from: "institutions",
          localField: "stage_application.institutionId",
          foreignField: "_id",
          as: "stage_application_institution",
        },
      },
      { $unwind: "$stage_application_institution" },
      {
        $lookup: {
          from: "businesses",
          localField: "stage_application_institution.businessId",
          foreignField: "_id",
          as: "stage_institution_business",
        },
      },
      { $unwind: "$stage_institution_business" },
      {
        $project: {
          __v: 0,
          status: 0,
          applicationId: 0,
          institutionId: 0,
          "stage_application_institution.address": 0,
          "stage_application_institution._id": 0,
          "stage_application_institution.createdAt": 0,
          "stage_application_institution.updatedAt": 0,
          "stage_application_institution.businessId": 0,
          "stage_application_institution.modules": 0,
          "stage_institution_business.address": 0,
          "stage_institution_business._id": 0,
          "stage_institution_business.createdAt": 0,
          "stage_institution_business.updatedAt": 0,
        },
      },
    ]);
    return ApplicationStage.aggregatePaginate(
      v,
      options,
      function (err, results) {
        if (err) {
          console.log(err);
        } else {
          return results;
        }
      }
    );
  },

  createApplicationUserPermission: async (data) => {
    return ApplicationUserPermission.create(data);
  },

  findUpdateUserPermission: async ({
    filter: filter,
    update: update,
    options: options,
  }) => {
    let res;
    let result;
    let check = await ApplicationUserPermission.findOne(filter);
    if (!check || is_null(check)) {
      return {
        result: false,
        message: "Application user permission provided do not exist",
      };
    } else {
      res = await ApplicationUserPermission.findOneAndUpdate(
        filter,
        update,
        options
      );
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },

  getApplicationUserPermissions: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v = ApplicationUserPermission.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "permission_application",
        },
      },
      { $unwind: "$permission_application" },
      {
        $lookup: {
          from: "institutions",
          localField: "institutionId",
          foreignField: "_id",
          as: "permission_institution",
        },
      },
      { $unwind: "$permission_institution" },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "permission_user",
        },
      },
      { $unwind: "$permission_user" },
      {
        $lookup: {
          from: "application_stages",
          localField: "applicationStageId",
          foreignField: "_id",
          as: "permission_application_stage",
        },
      },
      { $unwind: "$permission_application_stage" },
      {
        $project: {
          __v: 0,
          status: 0,
          applicationId: 0,
          institutionId: 0,
          userId: 0,
          applicationStageId: 0,
          "permission_application.createdAt": 0,
          "permission_application.updatedAt": 0,
          "permission_application._id": 0,
          "permission_institution.address": 0,
          "permission_institution._id": 0,
          "permission_institution.createdAt": 0,
          "permission_institution.updatedAt": 0,
          "permission_institution.businessId": 0,
          "permission_institution.modules": 0,
          "permission_user.password": 0,
          "permission_user._id": 0,
          "permission_user.firstLogin": 0,
          "permission_user.passwordResets": 0,
          "permission_user.updatedAt": 0,
          "permission_user.createdAt": 0,
          "permission_application_stage.createdAt": 0,
          "permission_application_stage.updatedAt": 0,
        },
      },
    ]);
    return ApplicationUserPermission.aggregatePaginate(
      v,
      options,
      function (err, results) {
        if (err) {
          console.log(err);
        } else {
          return results;
        }
      }
    );
  },

  getApplicationUserPermission: async (where) => {
    return ApplicationUserPermission.find(where)
      .populate({ path: "institutionId" })
      .populate({ path: "applicationId" })
      .populate({ path: "applicationStageId" });
  },

  createApplicationDocumentType: async (data) => {
    return ApplicationDocumentType.create(data);
  },

  getApplicationDocumentTypes: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v = ApplicationDocumentType.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "institutions",
          localField: "institutionId",
          foreignField: "_id",
          as: "institution",
        },
      },
      { $unwind: "$institution" },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "application",
        },
      },
      { $unwind: "$application" },
      {
        $lookup: {
          from: "institution_document_types",
          localField: "institutionDocumentTypes",
          foreignField: "_id",
          as: "docTypes",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: "$creator" },
      {
        $project: {
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
          createdBy: 0,
          institutionId: 0,
          applicationId: 0,
          institutionDocumentTypes: 0,
          "institution.address": 0,
          "institution._id": 0,
          "institution.institutionConfig": 0,
          "institution.logo": 0,
          "institution.businessId": 0,
          "institution.modules": 0,
          "application.createdAt": 0,
          "application.updatedAt": 0,
          "application._id": 0,
          "creator.password": 0,
          "creator.passwordResets": 0,
          "creator._id": 0,
          "creator.firstLogin": 0,
          "creator.userPermission": 0,
          "creator.isSystemAdmin": 0,
          "creator.isInstitutionAdmin": 0,
          "creator.isLmsAdmin": 0,
          "creator.createdAt": 0,
          "creator.updatedAt": 0,
          "docTypes._id": 0,
          "docTypes.createdAt": 0,
          "docTypes.updatedAt": 0,
          "docTypes.institutionId": 0,
          "docTypes.createdBy": 0,
        },
      },
    ]);
    return ApplicationDocumentType.aggregatePaginate(
      v,
      options,
      function (err, results) {
        if (err) {
          console.log(err);
        } else {
          return results;
        }
      }
    );
  },

  getApplicationDocumentType: async (where) => {
    return ApplicationDocumentType.findOne(where)
      .populate({ path: "institutionId" })
      .populate({ path: "applicationId" })
      .populate({ path: "institutionDocumentTypes" })
      .populate({ path: "createdBy" });
  },

  updateApplicationDocumentType: async ({
    filter: filter,
    update: update,
    options: options,
  }) => {
    let res;
    let result;
    let check = await ApplicationDocumentType.findOne(filter);
    if (!check || is_null(check)) {
      return { result: false, message: "Application provided do not exist" };
    } else {
      res = await ApplicationDocumentType.findOneAndUpdate(
        filter,
        update,
        options
      );
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },
};
