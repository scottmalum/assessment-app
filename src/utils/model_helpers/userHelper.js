
const fs = require("fs");
const _ = require("lodash");
const generator = require("generate-password");
const moment = require("moment");
const strings = require("locutus/php/strings");
const User = require("../../models/User");
const DeletedData = require("../../models/DeletedData");
const utils = require("..");
const number_format = require("locutus/php/strings/number_format");
const Institution = require("../../models/Institution");
const Application = require("../../models/Application");
const {is_null} = require("locutus/php/var");
const time = new Date(Date.now()).toLocaleString();

module.exports = {

  createUser: async (data) => {
    return User.create(data);
  },

  savePasswordReset: async ({ user_id, old_password, new_password }) => {
    return User.findByIdAndUpdate(
        user_id,
        {$push: {passwordResets: old_password}, password: new_password, firstLogin: 0},
        {new: true}
    );
  },

  findUpdate: async ({
                       filter: filter,
                       update: update,
                       options: options,
                     }) => {
    let res;
    let result;
    let check = await User.findOne(filter);
    if (!check || is_null(check)) {
      return {result: false, message: "User do not exist"};
    } else {
      res = await User.findOneAndUpdate(filter, update, options);
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },

  isAdmin: async (id) => {
    const v = await User.find({
      _id: id,
      isSystemAdmin: 1,
    });
    return !_.isEmpty(v);
  },

  getUser: async (data) => {
    return User.findOne(data);
  },

  getUsers: async (params) => {
    const { where, queryOptions } = params;
    const options = {
      ...queryOptions,
    };
    const v =  User.aggregate([
      {
        $match: where,
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "institutions",
          localField: "institutionId",
          foreignField: "_id",
          as: "user_institution",
        },
      },
      { $unwind: "$user_institution" },
      {
        $lookup: {
          from: "businesses",
          localField: "user_institution.businessId",
          foreignField: "_id",
          as: "institution_business",
        },
      },
      { $unwind: "$institution_business" },
      {
        $project: {
          __v: 0,
          passwordResets: 0,
          password: 0,
          status: 0,
          firstLogin: 0,
          "user_institution.createdAt": 0,
          "user_institution.businessId": 0,
          "user_institution.updatedAt": 0,
          "user_institution._id": 0,
          "user_institution.address": 0,
          "user_institution.modules": 0,
          "institution_business.address": 0,
          "institution_business._id": 0,
        },
      },
    ]).addFields({
      isInstitutionAdminText: {
        $function: {
          body: function (isInstitutionAdmin) {
            return isInstitutionAdmin === 1 ? "Yes" : "No";
          },
          args: ["$isInstitutionAdmin"],
          lang: "js",
        },
      },
      isSystemAdminText: {
        $function: {
          body: function (isSystemAdmin) {
            return isSystemAdmin === 1 ? "Yes" : "No";
          },
          args: ["$isSystemAdmin"],
          lang: "js",
        },
      },
      isLmsAdminText: {
        $function: {
          body: function (isLmsAdmin) {
            return isLmsAdmin === 1 ? "Yes" : "No";
          },
          args: ["$isLmsAdmin"],
          lang: "js",
        },
      },
    });
    return User.aggregatePaginate(v, options, function (err, results) {
      if (err) {
        console.log(err);
      } else {
        return results;
      }
    });
  },

  getUserItemsSingleFieldsUsingDistinct: async (data) => {
    let model = data.model
      ? require("../../models/" + data.model)
      : require("../../models/User");
    const v =  model.distinct(data.fields, data.where);
    return v;
  },

  getUserItemsMultipleFieldsUsingQuery: async (data) => {
    let model = data.model
      ? require("../../models/" + data.model)
      : require("../../models/User");
    return model.find(data.where).select(data.fields);
  },

};