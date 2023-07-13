
const _ = require("lodash");
const DeletedData = require("../../models/DeletedData");
const Institution = require("../../models/Institution");
const Candidate = require("../../models/Candidate");
const utils = require("../index");
const fs = require("fs");
const appRoot = require("app-root-path");

module.exports = {
  backupAndDelete: async (data) => {
    let { ids, deletedBy, model } = data;
    let modelLoader = require("../../models/" + data.model);
    _.forEach(ids, async (u) => {
      if (u) {
        let deleteData = {
          deletedData: await modelLoader.findById(u),
          deletedModel: model,
          deletedBy,
        };
        await DeletedData.create(deleteData);
      }
    });
    const v = await modelLoader.deleteMany({ _id: { $in: ids } });
    console.log(v);
    return v;
  },

  imageUrl: async (data) => {
    let { id, type, req } = data;
    const ObjectId = require("mongoose").Types.ObjectId;
    let url, dir;
    let where = {_id: new ObjectId(id)};
    if(type === 'institution'){
      const institution = await Institution.findOne(where);
      if (!institution) {
        return {result: false, message: "Institution not found"};
      }
      const code = institution.institutionCode;
      const logo = institution.logo;
      dir = `${appRoot}/public/uploads/institutions/${code}/logo/${logo}`;
      url = new URL(`${req.protocol}://${req.get('host')}/institutions/${code}/logo/${logo}`);
      if (!fs.existsSync(dir)){
        url = new URL(`${req.protocol}://${req.get('host')}/null.jpg`);
      }
      return {result: url, message: "Successful"};
    }
    if(type === 'candidate'){
      const candidate = await Candidate.findOne(where).populate({path: 'institutionId'});
      if (!candidate) {
        return {result: false, message: "Candidate not found"};
      }
      let candidateCode = candidate.candidateCode
      let photoUrl = candidate.photoUrl
      let institutionCode = candidate.institutionId.institutionCode
      dir = `${appRoot}/public/uploads/institutions/${institutionCode}/candidates/${candidateCode}/photo/${photoUrl}`;
      url = new URL(`${req.protocol}://${req.get('host')}/institutions/${institutionCode}/candidates/${candidateCode}/photo/${photoUrl}`);
      if (!fs.existsSync(dir)){
        url = new URL(`${req.protocol}://${req.get('host')}/null.jpg`);
      }
      return {result: url, message: "Successful"};
    }
  },
  UserHelper: require("./userHelper"),
  ApplicationHelper: require("./applicationHelper"),
  InstitutionHelper: require("./institutionHelper"),
  SubjectHelper: require("./subjectHelper"),
  QuestionHelper: require("./questionHelper"),
  MenuHelper: require("./menuHelper"),
  CandidateHelper: require("./candidateHelper"),
  SmsLogHelper: require("./smsLogHelper"),
  EmailLogHelper: require("./emailLogHelper"),
  DropDownHelper: require("./dropdownHelper"),
  TokenHelper: require("./tokenHelper"),
};

