exports.drawSchema = {
  type: "object",
  properties: {
    drawMonth: {
      type: "number",
      description: "draw month",
      example: 6,
    },
    drawYear: {
      type: "number",
      description: "draw year",
      example: 2021,
    },
    drawDescription: {
      type: "string",
      description: "draw description",
      example: "June, 2021 RRS Draw",
    },
    drawStatus: {
      type: "number",
      description: "draw active status, 1 means active, 0 is inactive",
      example: 1,
    },
    noOfRewards: {
      type: "number",
      description: "number of winners that will emerge for this draw",
      example: 3,
    },
    drawCriteria: {
      type: "object",
      description: "criteria for selecting draw reward winners",
      example: {
        and: {
          amountRange: { from: 10000, to: 30000 },
          userType: 1,
          location: ["awka", "onitsha"],
          receiptDateBefore: "2021-06-20",
        },
        or: {
          amountRange: { from: 10000, to: 30000 },
          userType: 1,
          location: ["awka", "onitsha"],
          receiptDateBefore: "2021-06-20",
        },
      },
    },
  },
};

exports.drawAdd = {
  tags: ["DRAW"],
  description: "Make a draw for month/year",
  operationId: "drawAdd",
  security: [
    {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  ],
  parameters: [
    /* {
      name: "apikey",
      in: "header",
      schema: {
        $ref: "#/components/schemas/ApiKey",
      },
      required: true,
      description:
        "provide APIKEY assigned for comm between back and front ends",
    }, */
  ],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Draw",
        },
      },
    },
  },
  responses: {
    200: {
      description: "Draw object created",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/Success",
          },
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/Error",
          },
        },
      },
    },
  },
};
