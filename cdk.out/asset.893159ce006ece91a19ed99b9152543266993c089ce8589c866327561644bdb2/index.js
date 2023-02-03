"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// services/SpacesTable/Read.ts
var Read_exports = {};
__export(Read_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(Read_exports);
var import_aws_sdk = require("aws-sdk");
var TABLE_NAME = process.env.TABLE_NAME;
var PRIMARY_KEY = process.env.PRIMARY_KEY;
var dbClient = new import_aws_sdk.DynamoDB.DocumentClient();
async function handler(event, context) {
  const result = {
    statusCode: 200,
    body: "Hellow from DynamoDB"
  };
  console.log(`Reading items from ${TABLE_NAME}`);
  try {
    if (event.queryStringParameters) {
      if (PRIMARY_KEY) {
        const keyValue = event.queryStringParameters[PRIMARY_KEY];
        const queryResponse = await dbClient.query({
          TableName: TABLE_NAME,
          // have to do roundabout way as dynamodb has a lot  of reserved keywords
          // Thus we use a KeyConditionExpression to get around this
          // note: didnt have to use jj, could use anything
          KeyConditionExpression: "#jj = :jjj",
          ExpressionAttributeNames: {
            "#zz": PRIMARY_KEY
          },
          ExpressionAttributeValues: {
            "#zzzz": keyValue
          }
        }).promise();
        result.body = JSON.stringify(queryResponse);
      }
    } else {
      const queryResponse = await dbClient.scan({
        TableName: TABLE_NAME
        // due to type of TABLE_NAME we use ! to show we are sure it exists (if it doesnt exist we will get an error in result body anyways so adding the ! doesnt break anything)
      }).promise();
      result.body = JSON.stringify(queryResponse);
    }
  } catch (error) {
    result.body = error.message;
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
