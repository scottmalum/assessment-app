
const { drawAdd, drawSelect } = require("./draw.swagger");
const { Components } = require("./components.swagger");

exports.swaggerDocument = {
  openapi: "3.0.3",
  info: {
    version: "2.0.0",
    title: "Revenue reward scheme APIs Document",
    description:
      "this is documentation for the RRS designed by AppmartGroup Int. Ltd.",
    termsOfService: "",
    contact: {
      name: "Mbaebie Paulcollins O",
      email: "paulcollins.obi@appmartgroup.com",
      url: "https://appmartgroup.com",
    },
    license: {
      name: "MIT",
      url: "https://spdx.org/licenses/MIT.html",
    },
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local server",
    },
  ],
  components: Components,
  tags: [
    {
      name: "USSD",
    },
    {
      name: "USER",
    },
    {
      name: "RRSCODE",
    },
    {
      name: "RECEIPT",
    },
    {
      name: "DRAW",
    },
    {
      name: "REWARD",
    },
  ],
  paths: {
    "/api/v2/draw/add": {
      post: drawAdd,
    },
  },
};