const fs = require("fs");
const date = new Date().toISOString().split("T")[0] + ".log";
let appRoot = require("app-root-path");

const file = appRoot + "/logs/" + date;

async function filecheck(data) {
  const checkfile = fs.existsSync(file);
  if (!checkfile) {
    fs.writeFileSync(file, data);
  } else {
    fs.appendFileSync(file, data)
  }
}

async function readLog(filename, type) {
  let dataArray = []
  let file = filename + ".log";
  const fileExists = fs.existsSync(file);
  if (fileExists) {
    var rs = fs.readFileSync(file)
    const data = JSON.parse(rs)
    if (type === "INFO") {
      console.log(data)
    }
  } else {
    console.log("File does not exist");
  }
}

module.exports = {
  filecheck
};