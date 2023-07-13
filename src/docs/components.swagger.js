
const { drawSchema } = require("./draw.swagger");

exports.Components = {
  schemas: {
    ApiKey: {
      type: "string",
      description: "apikey string, alphanumeric",
      example: "WETYWETY66723tftY",
    },
    Draw: drawSchema,
    Success: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "success",
          example: "success",
        },
        message: {
          type: "string",
          description: "success description",
          example: "action performed successfully",
        },
        code: {
          type: "string",
          description: "success code",
          example: "00",
        },
        data: {
          type: "object",
          description: "response result for the caller",
          example: {
            receiptAmount: 23000.66,
            receiptStatus: 1,
            rrsCodeId: "60ce0f9031a494a061f51b84",
            receiptNumber: "009op98887up6oop",
            receiptDate: "2021-06-11T00:00:00.000Z",
          },
        },
      },
    },
    Error: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "error",
          example: "error",
        },
        message: {
          type: "string",
          description: "error description",
          example: "division by zero encountered",
        },
        code: {
          type: "string",
          description: "error code",
          example: "E101",
        },
        data: {
          type: "object",
          description: "empty",
          example: {},
        },
      },
    },
  },
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
    ApiKeyAuth: {
      type: "apiKey",
      in: "header",
      name: "apikey",
    },
  },
};