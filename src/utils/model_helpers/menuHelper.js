
const fs = require("fs");
const _ = require("lodash");
const generator = require("generate-password");
const moment = require("moment");
const strings = require("locutus/php/strings");
const UserMenu = require("../../models/UserMenu");
const InstitutionMenu = require("../../models/InstitutionMenu");
const MenuHeader = require("../../models/MenuHeader");
const Menu = require("../../models/Menu");
const DeletedData = require("../../models/DeletedData");
const utils = require("..");
const number_format = require("locutus/php/strings/number_format");
const Application = require("../../models/Application");
const {is_null} = require("locutus/php/var");
const time = new Date(Date.now()).toLocaleString();

module.exports = {

  createMenu: async (data) => {
    return Menu.create(data);
  },

  findUpdateInstitutionMenu: async (obj) => {
    let res;
    let result;
    let check = await InstitutionMenu.findOne(obj.filter);
    if (!check || is_null(check)) {
      res = await InstitutionMenu.create(obj.data);
    } else {
      res = await InstitutionMenu.findOneAndUpdate(obj.filter, obj.update, obj.options);
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },

  findUpdateUserMenu: async (obj) => {
    let res;
    let result;
    let check = await UserMenu.findOne(obj.filter);
    if (!check || is_null(check)) {
      res = await UserMenu.create(obj.data);
    } else {
      res = await UserMenu.findOneAndUpdate(obj.filter, obj.update, obj.options);
    }
    result = res.toObject();
    if (result) {
      result.id = result._id;
    }
    return { result, message: "successful" };
  },

  getMenu: async (data) => {
    return Menu.find(data).populate({path: 'menuHeaderId'});
  },

  getInstitutionMenu: async (data) => {
    return InstitutionMenu.findOne(data).populate({path: 'institutionId'});
  },

  /*createUserMenu: async (data) => {
    const del = await UserMenu.deleteMany({ userId: data.userId, institutionId: data.institutionId });
    return data.userMenuData ? UserMenu.insertMany(data.userMenuData) : false;
  },*/

  getUserMenu: async (data) => {
    return UserMenu.findOne(data).select('menuData userId institutionId -_id').populate({path: 'institutionId'}).populate({path: 'userId'});
  },

  
};