
let seeder = require("mongoose-seed");
const mongoose = require("mongoose");
require("dotenv").config();
const utils = require("../utils");
const logger = require("../utils/logger");
let appRoot = require("app-root-path");
const generator = require("generate-password");
//let normalizedPath = appRoot + "/src/models/";
let normalizedPath = "./src/models/";

console.log('seeding started...');
(async () => {
  try {
    let modelFileArray = await utils.getFileArray({
      path: normalizedPath,
      append: normalizedPath,
      prepend: "",
      replace: { replace_from: "", replace_with: "" },
    });
    let modelFileNameArray = await utils.getFileArray({
      path: normalizedPath,
      append: "",
      prepend: "",
      replace: { replace_from: ".js", replace_with: "" },
    });
    /*let modelFileNameArray = await utils.pascal_to_underscore(
      getModelFileNameArray
    );*/

    await logger.filecheck(
      `INFO: Seeder ran with modelFileArray: ${JSON.stringify(
        modelFileArray
      )} \n`
    );
    await logger.filecheck(
      `INFO: Seeder ran with modelFileNameArray: ${JSON.stringify(
        modelFileNameArray
      )} \n`
    );

    let pw_hashed = await utils.hashPassword("Password12@");

    /**
     * drop db and remove sticky constraints and unnecessary unique keys
     */
    await mongoose.connect(
      process.env.MONGO_URI,
      {
      },
      function () {
        mongoose.connection.db.dropDatabase();
      }
    );

    await seeder.connect(
      process.env.MONGO_URI,
      {
      },
      function () {
        seeder.loadModels(modelFileArray);
        seeder.clearModels(modelFileNameArray, function () {
          seeder.populateModels(data, function () {
            seeder.disconnect();
          });
        });
      }
    );

    let data = [
      {
        model: "User",
        documents: [
          {
            userName: "system.admin",
            lastName: "OBI",
            firstName: "PAUL",
            middleName: "COLLINS",
            email: "pcollinsmb@gmail.com",
            phone: "08068535539",
            isSystemAdmin: 1,
            isInstitutionAdmin: 0,
            isLmsAdmin: 0,
            status: 1,
            firstLogin: 2,
            password: pw_hashed,
            passwordResets: [pw_hashed]
          },
          {
            userName: "lms.admin",
            lastName: "OBI",
            firstName: "PAULINE",
            middleName: "ADA",
            email: "pcollinso@yahoo.com",
            phone: "09072258248",
            isSystemAdmin: 0,
            isInstitutionAdmin: 0,
            isLmsAdmin: 1,
            status: 1,
            firstLogin: 2,
            password: pw_hashed,
            passwordResets: [pw_hashed]
          },
        ],
      },
      /*{
        model: "Permission",
        documents: [
          {
            name: "institution:read",
          },
          {
            name: "institution:write",
          },
          {
            name: "institution:delete",
          },
          {
            name: "user:read",
          },
          {
            name: "user:write",
          },
          {
            name: "user:delete",
          },
          {
            name: "candidate:read",
          },
          {
            name: "candidate:write",
          },
          {
            name: "candidate:delete",
          },
          {
            name: "exam:read",
          },
          {
            name: "exam:write",
          },
          {
            name: "exam:delete",
          },
          {
            name: "exam:review",
          },
          {
            name: "exam:coordinate",
          },
          {
            name: "candidate:delete",
          },
        ],
      },*/
      {
        model: "Module",
        documents: [
          {
            name: "WORKFLOW",
          },
          {
            name: "LMS",
          },
          {
            name: "EXAM",
          },
          {
            name: "SYSTEM",
          },
          {
            name: "REPORT",
          },
        ],
      },
      {
        model: "Business",
        documents: [
          {
            name: "GLOBAL",
            email: "pcollinsmb@gmail.com",
            phone: "08068535539",
            address: "FCT",
          }
        ],
      },
      {
        model: "SchoolProgramme",
        documents: [
          {
            name: "UNDERGRADUATE",
          },
          {
            name: "POST-GRADUATE",
          },
          {
            name: "PART-TIME",
          },
          {
            name: "NCE",
          },
          {
            name: "SECONDARY",
          },
          {
            name: "PRIMARY",
          },
          {
            name: "POLYTECHNIC",
          }
        ],
      },
      {
        model: "CandidateType",
        documents: [
          {
            name: "EMPLOYEE",
          },
          {
            name: "STUDENT",
          }
        ],
      },
      {
        model: "QuestionType",
        documents: [
          {
            name: "OBJECTIVE",
          },
          {
            name: "ESSAY",
          },
          {
            name: "MULTI-ANSWER",
          }
        ],
      },
      {
        model: "Grade",
        documents: [
          {
            name: "First Class",
          },
          {
            name: "Second Class Upper",
          },
          {
            name: "Second Class Lower",
          },
          {
            name: "Pass",
          },
          {
            name: "Distinction",
          },
          {
            name: "Third Class",
          }
        ],
      },
      {
        model: "Qualification",
        documents: [
          {
            name: "Diploma",
          },
          {
            name: "B.Ed",
          },
          {
            name: "M.B.B.S",
          },
          {
            name: "JSCE",
          },
          {
            name: "SSCE",
          },
          {
            name: "FSLC",
          },
          {
            name: "M.Sc",
          },
          {
            name: "B.Sc",
          },
          {
            name: "Ph.D",
          }
        ],
      },
      {
        model: "Institution",
        documents: [
          {
            name: "LMS",
            institutionCode: "LMS098712",
            address: "",
            email: "pcollinsmb@gmail.com",
            phone: "08068535539",
            logo: "",
            institutionConfig: {
              enable2wa: 0,
              anyCanReview: 1,
            },
            modules: [],
          }
        ],
      },
      {
        model: "SystemMenu",
        documents: [
          {
            title: "Set Question",
            route: "set-question",
            icon: "CheckSquareIcon",
            target: "_parent",
            href: ""
          },
          {
            title: "Institution",
            icon: "CheckSquareIcon",
            children: [
              {
                title: "Create Institution",
                route: "create-institution",
                icon: "CheckSquareIcon",
                target: "_parent",
                href: ""
              },
              {
                title: "Create Inst. Admin",
                route: "create-institution-admin",
                icon: "MailIcon",
                target: "_parent",
                href: ""
              },
              {
                title: "Configure Institution",
                route: "configure-institution",
                icon: "MessageSquareIcon",
                target: "_parent",
                href: ""
              },
            ]
          },
          {
            title: "Users",
            icon: "MessageSquareIcon",
            children: [
              {
                title: "Create User",
                route: "create-institution",
                icon: "CheckSquareIcon",
                target: "_parent",
                href: ""
              },
              {
                title: "Configure User",
                icon: "MessageSquareIcon",
                children: [
                  {
                    title: "Exam Config",
                    route: "exam-config",
                    icon: "CheckSquareIcon",
                    target: "_parent",
                  },
                  {
                    title: "Application Config",
                    route: "application-config",
                    icon: "CheckSquareIcon",
                    target: "_parent",
                  },
                ]
              },
            ]
          },
        ],
      },
    ];
  } catch (error) {
    console.log(error);
  }
})();

